import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaveManagement = ({ user, onLogout }) => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [leavesResponse, empResponse] = await Promise.all([
        axios.get(`${API}/leave-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLeaves(leavesResponse.data);
      setEmployees(empResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/leave-requests`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Leave request submitted successfully');
      setShowModal(false);
      setFormData({
        employee_id: '',
        leave_type: 'casual',
        from_date: '',
        to_date: '',
        reason: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit leave request');
    }
  };

  const handleStatusUpdate = async (leaveId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/leave-requests/${leaveId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Leave ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? emp.name : 'Unknown';
  };

  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="leave"
        setActivePage={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" data-testid="leave-title">
                Leave Management
              </h1>
              <p className="text-slate-600">Manage employee leave requests</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              data-testid="request-leave-btn"
              className="btn-primary flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              <Plus size={20} />
              Request Leave
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : leaves.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <p className="text-slate-600 mb-4">No leave requests found</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Submit a leave request
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="table-container overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Employee</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Type</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">From</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">To</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Reason</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50" data-testid={`leave-row-${leave.id}`}>
                        <td className="px-6 py-4 text-slate-900 font-medium">{getEmployeeName(leave.employee_id)}</td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{leave.leave_type}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(leave.from_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(leave.to_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-600">{leave.reason}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              leave.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : leave.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {leave.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStatusUpdate(leave.id, 'approved')}
                                data-testid={`approve-leave-${leave.id}`}
                                className="text-emerald-600 hover:text-emerald-700"
                                title="Approve"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                                data-testid={`reject-leave-${leave.id}`}
                                className="text-red-600 hover:text-red-700"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900" data-testid="request-leave-modal-title">Request Leave</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee *</label>
                <select
                  required
                  data-testid="leave-employee-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type *</label>
                <select
                  required
                  data-testid="leave-type-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                >
                  <option value="casual">Casual Leave (CL)</option>
                  <option value="earned">Earned Leave (EL)</option>
                  <option value="sick">Sick Leave (SL)</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">From Date *</label>
                <input
                  type="date"
                  required
                  data-testid="leave-from-date-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.from_date}
                  onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">To Date *</label>
                <input
                  type="date"
                  required
                  data-testid="leave-to-date-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.to_date}
                  onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason *</label>
                <textarea
                  required
                  data-testid="leave-reason-input"
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-leave-btn"
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;