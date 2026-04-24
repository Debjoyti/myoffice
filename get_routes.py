import ast

def extract_routes(filepath):
    with open(filepath, 'r') as file:
        tree = ast.parse(file.read())

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute):
                    method = decorator.func.attr
                    if method in ["get", "post", "put", "delete", "patch"]:
                        if len(decorator.args) > 0 and isinstance(decorator.args[0], ast.Constant):
                            path = decorator.args[0].value
                            if any(term in path for term in ["purchase", "goods", "invoice", "payment", "account", "journal", "asset", "item", "inventory", "vendor", "store", "warehouse", "finance", "grn", "pr", "po"]):
                                print(f"{method.upper()} {path} -> {node.name}")

extract_routes("backend/main.py")
