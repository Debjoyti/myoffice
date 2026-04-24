import re

with open("frontend/src/components/Sidebar.js", "r") as f:
    content = f.read()

# Add Goods Receipts to sidebar menu
if "path: '/goods-receipts'" not in content:
    content = content.replace(
        "{ icon: ShoppingCart, label: 'Purchase Orders', path: '/purchase-orders', permissions: ['manage_inventory'] },",
        "{ icon: ShoppingCart, label: 'Purchase Orders', path: '/purchase-orders', permissions: ['manage_inventory'] },\n    { icon: FileText, label: 'Goods Receipts', path: '/goods-receipts', permissions: ['manage_inventory'] },"
    )

with open("frontend/src/components/Sidebar.js", "w") as f:
    f.write(content)

print("Updated Sidebar.js")
