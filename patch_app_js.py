import re

with open("frontend/src/App.js", "r") as f:
    content = f.read()

import_statement = "import GoodsReceipts from './pages/GoodsReceipts';"
if import_statement not in content:
    content = content.replace("import PurchaseOrders from './pages/PurchaseOrders';", f"import PurchaseOrders from './pages/PurchaseOrders';\n{import_statement}")

route_statement = "<Route path=\"/goods-receipts\" element={<ProtectedRoute><GoodsReceipts user={user} onLogout={handleLogout} /></ProtectedRoute>} />"
if route_statement not in content:
    content = content.replace("<Route path=\"/purchase-orders\" element={<ProtectedRoute><PurchaseOrders user={user} onLogout={handleLogout} /></ProtectedRoute>} />",
                              f"<Route path=\"/purchase-orders\" element={{<ProtectedRoute><PurchaseOrders user={{user}} onLogout={{handleLogout}} /></ProtectedRoute>}} />\n              {route_statement}")

with open("frontend/src/App.js", "w") as f:
    f.write(content)

print("Updated App.js")
