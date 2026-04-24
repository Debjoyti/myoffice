import ast

def extract_classes(filepath):
    with open(filepath, 'r') as file:
        tree = ast.parse(file.read())

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            if any(name in node.name for name in [
                "Purchase", "Goods", "Invoice", "Payment", "Account",
                "Journal", "Asset", "Item", "Inventory", "Vendor",
                "Store", "Warehouse"
            ]):
                print(f"class {node.name}:")
                for item in node.body:
                    if isinstance(item, ast.AnnAssign):
                        print(f"    {item.target.id}: {ast.unparse(item.annotation)}")

extract_classes("backend/main.py")
