import re

with open("frontend/src/pages/AssetManagement.js", "r") as f:
    content = f.read()

# Make sure we show full lifecycle
if "Asset Lifecycle View" not in content:
    # Add a lifecycle view table or expand the existing one
    lifecycle_view = """
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Asset Lifecycle View</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initial Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.purchase_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${asset.value}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            asset.status === 'Active' ? 'bg-green-100 text-green-800' :
                            asset.status === 'In Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {asset.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.assigned_to || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
"""
    content = content.replace("          </div>\n        </main>", f"{lifecycle_view}\n          </div>\n        </main>")

with open("frontend/src/pages/AssetManagement.js", "w") as f:
    f.write(content)

print("Updated AssetManagement.js")
