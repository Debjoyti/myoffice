from __future__ import annotations

import copy
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple


@dataclass
class _WriteResult:
    deleted_count: int = 0
    modified_count: int = 0
    matched_count: int = 0
    inserted_id: Optional[str] = None


def _matches(doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
    if not query:
        return True

    if "$and" in query:
        clauses = query.get("$and") or []
        return all(_matches(doc, clause) for clause in clauses)

    if "$or" in query:
        clauses = query.get("$or") or []
        return any(_matches(doc, clause) for clause in clauses)

    for key, expected in query.items():
        if key.startswith("$"):
            continue
        value = _get_value(doc, key)
        if isinstance(expected, dict):
            if "$in" in expected and value not in expected["$in"]:
                return False
            if "$ne" in expected and value == expected["$ne"]:
                return False
            if "$eq" in expected and value != expected["$eq"]:
                return False
            if "$gte" in expected and (value is None or value < expected["$gte"]):
                return False
            if "$lte" in expected and (value is None or value > expected["$lte"]):
                return False
            if "$gt" in expected and (value is None or value <= expected["$gt"]):
                return False
            if "$lt" in expected and (value is None or value >= expected["$lt"]):
                return False
            continue
        if value != expected:
            return False
    return True


def _get_value(doc: Dict[str, Any], key: str) -> Any:
    if "." not in key:
        return doc.get(key)

    value: Any = doc
    for part in key.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(part)
    return value


def _set_value(doc: Dict[str, Any], key: str, value: Any) -> None:
    if "." not in key:
        doc[key] = value
        return

    parts = key.split(".")
    cursor = doc
    for part in parts[:-1]:
        next_value = cursor.get(part)
        if not isinstance(next_value, dict):
            next_value = {}
            cursor[part] = next_value
        cursor = next_value
    cursor[parts[-1]] = value


def _apply_projection(doc: Dict[str, Any], projection: Optional[Dict[str, int]]) -> Dict[str, Any]:
    if not projection:
        return copy.deepcopy(doc)

    include_keys = [k for k, v in projection.items() if v]
    exclude_keys = [k for k, v in projection.items() if not v]
    out = copy.deepcopy(doc)

    if include_keys:
        out = {k: v for k, v in out.items() if k in include_keys}
    for key in exclude_keys:
        out.pop(key, None)
    return out


class AsyncInMemoryCursor:
    def __init__(self, docs: List[Dict[str, Any]]) -> None:
        self._docs = docs

    def sort(self, field: str, direction: int):
        reverse = direction == -1
        self._docs.sort(key=lambda x: _sort_key(_get_value(x, field)), reverse=reverse)
        return self

    def limit(self, value: int):
        if value >= 0:
            self._docs = self._docs[:value]
        return self

    async def to_list(self, length: Optional[int]):
        if length is None or length < 0:
            return copy.deepcopy(self._docs)
        return copy.deepcopy(self._docs[:length])


def _sort_key(value: Any) -> Tuple[int, Any]:
    if value is None:
        return (1, "")
    if isinstance(value, (int, float, str)):
        return (0, value)
    return (0, str(value))


def _apply_update(doc: Dict[str, Any], update: Dict[str, Any]) -> Dict[str, Any]:
    updated = copy.deepcopy(doc)
    set_values = update.get("$set", {})
    for key, value in set_values.items():
        _set_value(updated, key, value)

    inc_values = update.get("$inc", {})
    for key, increment in inc_values.items():
        current = _get_value(updated, key)
        if current is None:
            current = 0
        _set_value(updated, key, current + increment)
    return updated


def _eval_group_key(doc: Dict[str, Any], expr: Any) -> Any:
    if expr is None:
        return None
    if isinstance(expr, str) and expr.startswith("$"):
        return _get_value(doc, expr[1:])
    return expr


def _coerce_number(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(value)
    except Exception:
        return 0.0


def _apply_group(docs: Iterable[Dict[str, Any]], spec: Dict[str, Any]) -> List[Dict[str, Any]]:
    group_id_expr = spec.get("_id")
    accumulators = {k: v for k, v in spec.items() if k != "_id"}
    grouped: Dict[Any, Dict[str, Any]] = {}

    for doc in docs:
        key = _eval_group_key(doc, group_id_expr)
        if key not in grouped:
            grouped[key] = {"_id": key}
            for field in accumulators:
                grouped[key][field] = 0

        for field, op_spec in accumulators.items():
            if not isinstance(op_spec, dict):
                continue
            if "$sum" in op_spec:
                operand = op_spec["$sum"]
                if isinstance(operand, str) and operand.startswith("$"):
                    grouped[key][field] += _coerce_number(_get_value(doc, operand[1:]))
                else:
                    grouped[key][field] += _coerce_number(operand)

    return list(grouped.values())


class AsyncInMemoryCollection:
    def __init__(self) -> None:
        self._items: List[Dict[str, Any]] = []

    async def create_index(self, *args, **kwargs):
        return None

    async def count_documents(self, query: Dict[str, Any], limit: Optional[int] = None):
        count = 0
        for item in self._items:
            if _matches(item, query):
                count += 1
                if limit and count >= limit:
                    break
        return count

    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict[str, int]] = None, sort: Optional[List[Tuple[str, int]]] = None):
        docs = [d for d in self._items if _matches(d, query)]
        if sort:
            for field, direction in reversed(sort):
                docs.sort(key=lambda x: x.get(field), reverse=(direction == -1))
        if not docs:
            return None
        return _apply_projection(docs[0], projection)

    async def insert_one(self, doc: Dict[str, Any]):
        self._items.append(copy.deepcopy(doc))
        return _WriteResult(inserted_id=doc.get("id"))

    async def insert_many(self, docs: List[Dict[str, Any]]):
        for doc in docs:
            self._items.append(copy.deepcopy(doc))
        return _WriteResult()

    def find(self, query: Dict[str, Any], projection: Optional[Dict[str, int]] = None):
        docs = [_apply_projection(d, projection) for d in self._items if _matches(d, query)]
        return AsyncInMemoryCursor(docs)

    def aggregate(self, pipeline: List[Dict[str, Any]]):
        docs: List[Dict[str, Any]] = [copy.deepcopy(d) for d in self._items]
        for stage in pipeline:
            if "$match" in stage:
                docs = [d for d in docs if _matches(d, stage["$match"])]
                continue

            if "$group" in stage:
                docs = _apply_group(docs, stage["$group"])
                continue

            if "$sort" in stage:
                sort_spec = stage["$sort"]
                for field, direction in reversed(list(sort_spec.items())):
                    docs.sort(key=lambda d, f=field: _sort_key(_get_value(d, f)), reverse=(direction == -1))
                continue

            if "$limit" in stage:
                limit_value = int(stage["$limit"])
                docs = docs[:limit_value]
                continue

            if "$project" in stage:
                projection = stage["$project"]
                docs = [_apply_projection(d, projection) for d in docs]
                continue

        return AsyncInMemoryCursor(docs)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for idx, item in enumerate(self._items):
            if not _matches(item, query):
                continue
            updated = _apply_update(item, update)
            self._items[idx] = updated
            return _WriteResult(modified_count=1, matched_count=1)
        return _WriteResult(modified_count=0, matched_count=0)

    async def find_one_and_update(
        self,
        query: Dict[str, Any],
        update: Dict[str, Any],
        upsert: bool = False,
        return_document: bool = False,
    ):
        for idx, item in enumerate(self._items):
            if not _matches(item, query):
                continue
            updated = _apply_update(item, update)
            self._items[idx] = updated
            return copy.deepcopy(updated) if return_document else copy.deepcopy(item)

        if not upsert:
            return None

        inserted = copy.deepcopy(query)
        if "$set" in update:
            for key, value in update["$set"].items():
                _set_value(inserted, key, value)
        if "$inc" in update:
            for key, value in update["$inc"].items():
                _set_value(inserted, key, value)
        self._items.append(inserted)
        return copy.deepcopy(inserted)

    async def delete_one(self, query: Dict[str, Any]):
        for idx, item in enumerate(self._items):
            if _matches(item, query):
                self._items.pop(idx)
                return _WriteResult(deleted_count=1)
        return _WriteResult(deleted_count=0)

    async def delete_many(self, query: Dict[str, Any]):
        before = len(self._items)
        self._items = [item for item in self._items if not _matches(item, query)]
        return _WriteResult(deleted_count=before - len(self._items))


class InMemoryDatabase:
    def __init__(self) -> None:
        self._collections: Dict[str, AsyncInMemoryCollection] = {}

    def __getattr__(self, name: str):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = AsyncInMemoryCollection()
        return self._collections[name]
