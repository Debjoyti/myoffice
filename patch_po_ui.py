import re

with open("frontend/src/pages/PurchaseOrders.js", "r") as f:
    content = f.read()

# Add GRN Modal and functionality to PurchaseOrders.js
grn_state = "  const [showGRNModal, setShowGRNModal] = useState(false);\n  const [selectedPOForGRN, setSelectedPOForGRN] = useState(null);\n  const [grnData, setGrnData] = useState({ items_received: [], receipt_date: new Date().toISOString().split('T')[0], delivery_note: '', received_by: user.id });"

if "const [showGRNModal, setShowGRNModal]" not in content:
    content = content.replace("const [showModal, setShowModal] = useState(false);", f"const [showModal, setShowModal] = useState(false);\n{grn_state}")

grn_functions = """
  const handleOpenGRNModal = (po) => {
    setSelectedPOForGRN(po);
    setGrnData({
      purchase_order_id: po.id,
      store_id: po.store_id,
      items_received: po.items.map(item => ({ ...item, received_quantity: item.quantity })),
      receipt_date: new Date().toISOString().split('T')[0],
      delivery_note: '',
      received_by: user.name || user.id
    });
    setShowGRNModal(true);
  };

  const handleGRNSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Format items correctly for backend
      const formattedData = {
        ...grnData,
        items_received: grnData.items_received.map(item => ({
          name: item.name,
          quantity: parseInt(item.received_quantity, 10),
          price: item.price || item.unit_price || 0,
          unit: item.unit
        }))
      };

      await axios.post(`${API}/goods-receipts`, formattedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Goods Receipt Note created successfully');
      setShowGRNModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error creating GRN:', error);
      toast.error('Failed to create Goods Receipt Note');
    }
  };
"""

if "handleOpenGRNModal" not in content:
    content = content.replace("const handleSubmit = async (e) => {", f"{grn_functions}\n  const handleSubmit = async (e) => {{")

# Add Receive Goods button to actions
receive_button = """
                          {order.status === 'approved' && (
                            <button
                              onClick={() => handleOpenGRNModal(order)}
                              className="text-green-600 hover:text-green-900 ml-4 font-medium"
                            >
                              Receive Goods
                            </button>
                          )}"""

if "Receive Goods" not in content:
    # Need to find the action buttons block
    # Simple replace logic
    content = re.sub(r'(<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">.*?)(</td>)', r'\1' + receive_button + r'\2', content, flags=re.DOTALL)


# Add GRN Modal UI
grn_modal_ui = """
        {/* GRN Modal */}
        {showGRNModal && selectedPOForGRN && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create Goods Receipt Note (GRN)</h3>
                <button onClick={() => setShowGRNModal(false)} className="text-gray-400 hover:text-gray-500">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleGRNSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt Date</label>
                    <input type="date" value={grnData.receipt_date} onChange={(e) => setGrnData({...grnData, receipt_date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Note / Waybill</label>
                    <input type="text" value={grnData.delivery_note} onChange={(e) => setGrnData({...grnData, delivery_note: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Optional" />
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 mb-2">Items Received</h4>
                <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200 max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ordered Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Received Qty</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grnData.items_received.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{item.quantity} {item.unit}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.received_quantity}
                              onChange={(e) => {
                                const newItems = [...grnData.items_received];
                                newItems[index].received_quantity = e.target.value;
                                setGrnData({...grnData, items_received: newItems});
                              }}
                              className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              required
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowGRNModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Confirm Receipt</button>
                </div>
              </form>
            </div>
          </div>
        )}
"""

if "Create Goods Receipt Note" not in content:
    content = content.replace("      </div>\n    </div>\n  );\n};\n\nexport default PurchaseOrders;", f"{grn_modal_ui}\n      </div>\n    </div>\n  );\n}};\n\nexport default PurchaseOrders;")

with open("frontend/src/pages/PurchaseOrders.js", "w") as f:
    f.write(content)

print("Updated PurchaseOrders.js")
