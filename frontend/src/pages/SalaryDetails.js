import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FileText, Download, ShieldCheck, ChevronRight, Smartphone, IndianRupee } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function SalaryDetails({ user }) {
  const [activeTab, setActiveTab] = useState('structure');

  // States for salary data
  const [structure, setStructure] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b']; // Earnings, Benefits, Reimbursements

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      // Fetch Salary Structure
      const structRes = await fetch(`${BACKEND_URL}/api/salary-structure/${user.id}`, { headers });
      if (structRes.ok) {
        setStructure(await structRes.json());
      }

      // Fetch Payslips
      const payslipsRes = await fetch(`${BACKEND_URL}/api/payslips/${user.id}`, { headers });
      if (payslipsRes.ok) {
        setPayslips(await payslipsRes.json());
      }

      // Fetch reimbursements
      const expRes = await fetch(`${BACKEND_URL}/api/expenses`, { headers });
      if (expRes.ok) {
        const expenses = await expRes.json();
        setReimbursements(expenses.filter(e => e.type === 'reimbursement' && e.status === 'approved' && e.emp_id === user.id));
      }
    } catch (error) {
      console.error("Error fetching salary details:", error);
      toast.error("Failed to load salary details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#111827' }}>Loading salary details...</div>;
  }

  // --- Calculations ---
  const monthlyGross = structure ? structure.gross_salary : 0;
  const yearlyCTC = monthlyGross * 12;
  const monthlyNet = structure ? structure.net_salary : 0;

  let earnings = [];
  let deductions = [];
  let pfAmount = 0;
  let esiAmount = 0;
  let totalReimbursements = 0;

  if (structure) {
    earnings = structure.components.filter(c => c.type === 'earning');
    deductions = structure.components.filter(c => c.type === 'deduction');
    pfAmount = deductions.find(d => d.component_name === 'PF' || d.component_id === 'PF')?.final_amount || 0;
    esiAmount = deductions.find(d => d.component_name === 'ESI' || d.component_id === 'ESI')?.final_amount || 0;
  }

  if (reimbursements.length > 0) {
      totalReimbursements = reimbursements.reduce((sum, r) => sum + r.amount, 0);
  }

  // Calculate Benefit Value (Employer's Contribution estimated here if exact details missing)
  const totalBenefits = (structure?.pf_enabled ? pfAmount : 0) + (structure?.esi_enabled ? Math.round(monthlyGross * 0.0325) : 0);

  const breakdownData = [
      { name: 'Earnings', value: monthlyGross || 0 },
      { name: 'Benefits', value: totalBenefits || 0 },
      { name: 'Reimbursements', value: totalReimbursements || 0 }
  ];

  const handleDownloadMobileApp = () => {
    toast.success("Mobile app download link sent to your email!");
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#111827', fontFamily: 'Inter, sans-serif' }}>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#dc2626', fontSize: '18px' }}>
            {user.company_id ? user.company_id.substring(0, 3).toUpperCase() : 'CO.'}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>Welcome {user.name}!</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>{user.position || 'Employee'} at {user.company_id || 'Your Company'}.</p>
          </div>
        </div>
        <button onClick={handleDownloadMobileApp} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', cursor: 'pointer', fontWeight: '500' }}>
          <Smartphone size={18} /> Download Mobile App
        </button>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
         <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#6b7280', textTransform: 'uppercase' }}>Monthly CTC</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center' }}><IndianRupee size={28}/> {monthlyGross.toLocaleString('en-IN')}</div>
         </div>
         <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#6b7280', textTransform: 'uppercase' }}>Yearly CTC</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center' }}><IndianRupee size={28}/> {yearlyCTC.toLocaleString('en-IN')}</div>
         </div>
         <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#6b7280', textTransform: 'uppercase' }}>Take Home (Estimated)</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center' }}><IndianRupee size={28}/> {monthlyNet.toLocaleString('en-IN')}</div>
         </div>
      </div>

      {/* Salary Breakup Chart */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
          Salary Breakup
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
          <div style={{ width: '250px', height: '250px', position: 'relative' }}>
             <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                 <Pie
                     data={breakdownData}
                     cx="50%"
                     cy="50%"
                     innerRadius={70}
                     outerRadius={100}
                     paddingAngle={2}
                     dataKey="value"
                 >
                     {breakdownData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                 </Pie>
                 <Tooltip formatter={(value) => `₹${value}`} />
                 </PieChart>
             </ResponsiveContainer>
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#374151' }}>
                 Breakup
             </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {breakdownData.map((item, idx) => (
                 <div key={item.name} style={{ borderLeft: `4px solid ${COLORS[idx]}`, paddingLeft: '16px' }}>
                    <p style={{ color: '#6b7280', margin: '0 0 4px 0', fontSize: '14px' }}>{item.name}</p>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                      ₹{item.value.toLocaleString('en-IN')}
                    </div>
                 </div>
             ))}
          </div>
        </div>
      </div>

      {/* Detailed Modules Tabs */}
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e5e7eb', padding: '16px 24px 0 24px', background: '#f9fafb', overflowX: 'auto' }}>
          {['structure', 'benefits', 'reimbursements', 'compliance', 'payslips', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                color: activeTab === tab ? '#3b82f6' : '#6b7280',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '600' : '500',
                textTransform: 'capitalize',
                fontSize: '15px',
                whiteSpace: 'nowrap'
              }}
            >
              {tab === 'structure' ? 'Earnings Breakdown' : tab === 'history' ? 'Revision History' : tab}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'structure' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Earnings Breakdown</h3>
              {!structure ? (
                  <p style={{ color: '#6b7280' }}>No salary structure found.</p>
              ) : (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    {earnings.map((e, i) => (
                    <div key={e.component_name || e.component_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: i === earnings.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                        <span style={{ color: '#374151', fontWeight: '500' }}>{e.component_name || e.component_id}</span>
                        <span style={{ fontWeight: '600', color: '#111827' }}>₹{e.final_amount.toLocaleString('en-IN')}</span>
                    </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#eff6ff', borderTop: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1d4ed8' }}>
                    <span>Total Monthly Gross</span>
                    <span>₹{monthlyGross.toLocaleString('en-IN')}</span>
                    </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'benefits' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Company Provided Benefits</h3>
              {structure && (structure.pf_enabled || structure.esi_enabled) ? (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {structure.pf_enabled && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck color="#10b981" size={18}/> Provident Fund (PF)</div>
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 12px 0' }}>Employer's Contribution (12%)</p>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{pfAmount} / month</div>
                        </div>
                    )}
                    {structure.esi_enabled && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck color="#3b82f6" size={18}/> ESI Insurance</div>
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 12px 0' }}>Employer's Contribution (3.25%)</p>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{Math.round((monthlyGross * 0.0325)).toLocaleString('en-IN')} / month</div>
                        </div>
                    )}
                 </div>
              ) : (
                <p style={{ color: '#6b7280' }}>No standard benefits enrolled for this structure.</p>
              )}
            </div>
          )}

          {activeTab === 'reimbursements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Approved Reimbursements</h3>
                 <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>Excluded from CTC</span>
              </div>
              {reimbursements.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: '8px' }}>No approved reimbursements found.</div>
              ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reimbursements.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                      <div>
                          <div style={{ fontWeight: '600', textTransform: 'capitalize', color: '#111827' }}>{r.category_name} Reimbursement</div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{new Date(r.date).toLocaleDateString()} · {r.description}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '16px' }}>+ ₹{r.amount.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div>
               <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Statutory Compliance</h3>
               <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <span style={{ fontWeight: '600' }}>Component</span>
                      <span style={{ fontWeight: '600' }}>Status</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#374151' }}>Provident Fund (PF)</span>
                      <span>
                          {structure?.pf_enabled ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>Enrolled</span> : <span style={{ color: '#9ca3af' }}>Not Enrolled</span>}
                      </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
                      <span style={{ color: '#374151' }}>Employee State Insurance (ESI)</span>
                      <span>
                          {structure?.esi_enabled ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>Enrolled</span> : <span style={{ color: '#9ca3af' }}>Not Applicable (Salary > ₹21,000)</span>}
                      </span>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'payslips' && (
             <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Payslips</h3>
                {payslips.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: '8px' }}>No payslips generated yet.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {payslips.map(slip => (
                        <div key={slip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileText size={24} color="#3b82f6" />
                                <div>
                                    <div style={{ fontWeight: '500', color: '#111827' }}>Payslip for {slip.month} {slip.year}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Net Pay: ₹{slip.net_salary?.toLocaleString('en-IN')}</div>
                                </div>
                            </div>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', cursor: 'pointer' }}>
                                <Download size={16} /> Download
                            </button>
                        </div>
                    ))}
                    </div>
                )}
             </div>
          )}

          {activeTab === 'history' && (
            <div>
               <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Salary Revision History</h3>
               <div style={{ padding: '20px', border: '1px dashed #d1d5db', borderRadius: '8px', textAlign: 'center', color: '#6b7280' }}>
                   Current Active Structure Date: {structure ? new Date(structure.created_at).toLocaleDateString() : 'N/A'}<br/>
                   No other previous salary revisions found for your profile yet.
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
