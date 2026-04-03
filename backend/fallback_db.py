from __future__ import annotations

import copy
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class _WriteResult:
    deleted_count: int = 0
    modified_count: int = 0
    matched_count: int = 0
    inserted_id: Optional[str] = None


def _matches(doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
    if not query:
        return True
    for key, expected in query.items():
        value = doc.get(key)
        if isinstance(expected, dict):
            if "$in" in expected and value not in expected["$in"]:
                return False
            if "$ne" in expected and value == expected["$ne"]:
                return False
            continue
        if value != expected:
            return False
    return True


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
        self._docs.sort(key=lambda x: x.get(field), reverse=reverse)
        return self

    def limit(self, value: int):
        if value >= 0:
            self._docs = self._docs[:value]
        return self

    async def to_list(self, length: int):
        if length < 0:
            return copy.deepcopy(self._docs)
        return copy.deepcopy(self._docs[:length])


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

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for idx, item in enumerate(self._items):
            if not _matches(item, query):
                continue
            updated = copy.deepcopy(item)
            if "$set" in update:
                updated.update(update["$set"])
            self._items[idx] = updated
            return _WriteResult(modified_count=1, matched_count=1)
        return _WriteResult(modified_count=0, matched_count=0)

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
