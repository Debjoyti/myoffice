import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CRM = ({ user, onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
  });
  const [dealFormData, setDealFormData] = useState({
    lead_id: '',
    title: '',
    value: '',
    stage: 'proposal',
    probability: 50,
    expected_close_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [leadsResponse, dealsResponse] = await Promise.all([
        axios.get(`${API}/leads`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/deals`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLeads(leadsResponse.data);
      setDeals(dealsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/leads`, leadFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Lead added successfully');
      setShowLeadModal(false);
      setLeadFormData({ name: '', email: '', phone: '', company: '', source: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add lead');
    }
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const dealData = { ...dealFormData, value: parseFloat(dealFormData.value) };
      await axios.post(`${API}/deals`, dealData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Deal created successfully');
      setShowDealModal(false);
      setDealFormData({
        lead_id: '',
        title: '',
        value: '',
        stage: 'proposal',
        probability: 50,
        expected_close_date: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create deal');
    }
  };

  const getLeadName = (leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    return lead ? lead.name : 'Unknown';
  };

  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="crm"
        setActivePage={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" data-testid="crm-title">
                CRM
              </h1>
              <p className="text-slate-600">Manage leads and deals</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeadModal(true)}
                data-testid="add-lead-btn"
                className="btn-primary flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                <Plus size={20} />
                Add Lead
              </button>
              <button
                onClick={() => setShowDealModal(true)}
                data-testid="add-deal-btn"
                className="btn-primary flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                <Plus size={20} />
                Add Deal
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Leads</h2>
                {leads.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                    <p className="text-slate-600 mb-4">No leads found</p>
                    <button
                      onClick={() => setShowLeadModal(true)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Add your first lead
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="table-container overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Email</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Phone</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Company</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Source</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50" data-testid={`lead-row-${lead.id}`}>
                              <td className="px-6 py-4 text-slate-900 font-medium">{lead.name}</td>
                              <td className="px-6 py-4 text-slate-600">{lead.email || '-'}</td>
                              <td className="px-6 py-4 text-slate-600">{lead.phone || '-'}</td>
                              <td className="px-6 py-4 text-slate-600">{lead.company || '-'}</td>
                              <td className="px-6 py-4 text-slate-600">{lead.source || '-'}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    lead.status === 'new'
                                      ? 'bg-blue-100 text-blue-700'
                                      : lead.status === 'contacted'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {lead.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Deals</h2>
                {deals.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                    <p className="text-slate-600 mb-4">No deals found</p>
                    <button
                      onClick={() => setShowDealModal(true)}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Create your first deal
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="table-container overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Title</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Lead</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Value</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Stage</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Probability</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Close Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {deals.map((deal) => (
                            <tr key={deal.id} className="hover:bg-slate-50" data-testid={`deal-row-${deal.id}`}>
                              <td className="px-6 py-4 text-slate-900 font-medium">{deal.title}</td>
                              <td className="px-6 py-4 text-slate-600">{getLeadName(deal.lead_id)}</td>
                              <td className="px-6 py-4 text-slate-900 font-semibold">
                                ₹{deal.value.toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 capitalize">
                                  {deal.stage}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{deal.probability}%</td>
                              <td className="px-6 py-4 text-slate-600">
                                {deal.expected_close_date
                                  ? new Date(deal.expected_close_date).toLocaleDateString('en-IN')
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900" data-testid="add-lead-modal-title">Add Lead</h2>
              <button onClick={() => setShowLeadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleLeadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  data-testid="lead-name-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={leadFormData.name}
                  onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  data-testid="lead-email-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={leadFormData.email}
                  onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  data-testid="lead-phone-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={leadFormData.phone}
                  onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                <input
                  type="text"
                  data-testid="lead-company-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={leadFormData.company}
                  onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Source</label>
                <input
                  type="text"
                  data-testid="lead-source-input"
                  placeholder="e.g., Website, Referral"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={leadFormData.source}
                  onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-lead-btn"
                  className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900" data-testid="add-deal-modal-title">Create Deal</h2>
              <button onClick={() => setShowDealModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleDealSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lead *</label>
                <select
                  required
                  data-testid="deal-lead-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={dealFormData.lead_id}
                  onChange={(e) => setDealFormData({ ...dealFormData, lead_id: e.target.value })}
                >
                  <option value="">Select lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Deal Title *</label>
                <input
                  type="text"
                  required
                  data-testid="deal-title-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={dealFormData.title}
                  onChange={(e) => setDealFormData({ ...dealFormData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Value (₹) *</label>
                <input
                  type="number"
                  required
                  data-testid="deal-value-input"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={dealFormData.value}
                  onChange={(e) => setDealFormData({ ...dealFormData, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stage *</label>
                <select
                  required
                  data-testid="deal-stage-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={dealFormData.stage}
                  onChange={(e) => setDealFormData({ ...dealFormData, stage: e.target.value })}
                >
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Closed Won</option>
                  <option value="closed-lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Probability (%) *</label>
                <input
                  type="number"
                  required
                  data-testid="deal-probability-input"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={dealFormData.probability}
                  onChange={(e) => setDealFormData({ ...dealFormData, probability: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Expected Close Date</label>
                <input
                  type="date"
                  data-testid="deal-close-date-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={dealFormData.expected_close_date}
                  onChange={(e) => setDealFormData({ ...dealFormData, expected_close_date: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDealModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-deal-btn"
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;