import re

with open("frontend/src/pages/Finance.js", "r") as f:
    content = f.read()

# Make sure payments fetch exists
if "const [payments, setPayments]" not in content:
    content = content.replace("const [invoices, setInvoices] = useState([]);", "const [invoices, setInvoices] = useState([]);\n  const [payments, setPayments] = useState([]);\n  const [showPaymentModal, setShowPaymentModal] = useState(false);\n  const [selectedInvoice, setSelectedInvoice] = useState(null);\n  const [paymentData, setPaymentData] = useState({ amount: 0, payment_method: 'bank_transfer', payment_date: new Date().toISOString().split('T')[0], reference_number: '' });")

if "fetchData = async ()" in content and "setPayments(res[3].data)" not in content:
    # We will just manually edit the effect if needed, but it's simpler to append a new fetch
    fetch_payments = """
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/payments`, { headers: { Authorization: `Bearer ${token}` } });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };
"""
    content = content.replace("useEffect(() => {", f"{fetch_payments}\n  useEffect(() => {{", 1)

payment_funcs = """
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      invoice_id: invoice.id,
      amount: invoice.total_amount - (invoice.amount_paid || 0),
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/payments`, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      fetchData(); // Refresh invoices and GL
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };
"""
if "handleOpenPaymentModal" not in content:
    content = content.replace("const handleAddAccount = async (e) => {", f"{payment_funcs}\n  const handleAddAccount = async (e) => {{")

# Add AP Invoice fields in Invoice Modal
if "value={invoiceData.type}" not in content:
    content = content.replace(
        "<div>\n                    <label className=\"block text-sm font-medium text-gray-700\">Due Date</label>",
        """<div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select value={invoiceData.type} onChange={(e) => setInvoiceData({...invoiceData, type: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                      <option value="AR">Accounts Receivable (AR)</option>
                      <option value="AP">Accounts Payable (AP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PO ID (for AP 3-Way Match)</label>
                    <input type="text" value={invoiceData.purchase_order_id || ''} onChange={(e) => setInvoiceData({...invoiceData, purchase_order_id: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GRN ID (for AP 3-Way Match)</label>
                    <input type="text" value={invoiceData.goods_receipt_id || ''} onChange={(e) => setInvoiceData({...invoiceData, goods_receipt_id: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>"""
    )


# Add Payment button to invoice list
pay_btn = """
                            {inv.status !== 'paid' && (
                              <button onClick={() => handleOpenPaymentModal(inv)} className="text-green-600 hover:text-green-900 font-medium">Record Payment</button>
                            )}
"""
content = re.sub(r'(<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">.*?)(</td>)', r'\1' + pay_btn + r'\2', content, flags=re.DOTALL)


payment_modal_ui = """
        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-500"><X size={24} /></button>
              </div>
              <form onSubmit={handlePaymentSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Invoice</label>
                    <input type="text" value={selectedInvoice.invoice_number} disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount to Pay</label>
                    <input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select value={paymentData.payment_method} onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                    <input type="text" value={paymentData.reference_number} onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Payment</button>
                </div>
              </form>
            </div>
          </div>
        )}
"""

if "Record Payment" not in content and "{/* Payment Modal */}" not in content:
    content = content.replace("      </div>\n    </div>\n  );\n};\n\nexport default Finance;", f"{payment_modal_ui}\n      </div>\n    </div>\n  );\n}};\n\nexport default Finance;")

with open("frontend/src/pages/Finance.js", "w") as f:
    f.write(content)

print("Updated Finance.js")
