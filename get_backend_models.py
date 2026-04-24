import ast

def extract_db_stuff():
    with open("backend/main.py", 'r') as file:
        content = file.read()

    tree = ast.parse(content)
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            if any(name in node.name for name in [
                "Purchase", "Goods", "Invoice", "Payment", "Asset", "Vendor", "Inventory", "Store", "Account", "Journal"
            ]):
                print(f"class {node.name}:")
                for item in node.body:
                    if isinstance(item, ast.AnnAssign):
                        print(f"    {item.target.id}: {ast.unparse(item.annotation)}")

extract_db_stuff()
