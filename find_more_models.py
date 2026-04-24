import ast

def find_models():
    with open("backend/main.py", 'r') as file:
        content = file.read()

    tree = ast.parse(content)
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            if any(name in node.name for name in [
                "ChartOfAccount", "Journal", "Bank", "Invoice", "Payment", "Vendor", "GoodsReceipt", "GRN", "Stock"
            ]):
                print(f"class {node.name}:")

find_models()
