import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { ShieldCheck, Search, Filter, History, Download } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuditLogs = ({ user, onLogout }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [skip, setSkip] = useState(0);
  const limit = 100;

  useEffect(() => {
    // Reset pagination when search or filter changes
    setSkip(0);
  }, [searchQuery, moduleFilter]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (moduleFilter) params.append('module', moduleFilter);
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());

      const res = await axios.get(`${API}/audit?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      setLogs(res.data);
    } catch { toast.error('Failed to fetch audit logs'); }
    setLoading(false);
  }, [searchQuery, moduleFilter, skip]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchData]);

  const handleNextPage = () => setSkip(prev => prev + limit);
  const handlePrevPage = () => setSkip(prev => Math.max(0, prev - limit));

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">Compliance Audit Logs</h1>
              <p className="page-subtitle">Historical record of all system-wide actions</p>
            </div>
            <button className="btn-dark-secondary" onClick={() => toast.info('Log export requested')}>
              <Download size={18} /> Export CSV
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={16} />
              <input
                type="text"
                placeholder="Search by user or action..."
                className="dark-input"
                style={{ paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative', width: '200px' }}>
                <Filter style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={16} />
                <select
                  className="dark-input"
                  style={{ paddingLeft: '40px' }}
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                >
                    <option value="">All Modules</option>
                    <option value="AUTH">Authentication</option>
                    <option value="HRMS">HRMS</option>
                    <option value="FINANCE">Finance</option>
                    <option value="CRM">CRM</option>
                    <option value="SETTINGS">Settings</option>
                    <option value="SYSTEM">System</option>
                </select>
            </div>
          </div>

          {loading ? (
            <div className="dark-loading">Loading audit records...</div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{log.user_email}</td>
                      <td>
                        <span className="badge-blue" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>{log.action}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{log.module}</td>
                      <td style={{ 
                        fontSize: '13px', 
                        color: log.anomaly_flag ? '#fecdd3' : 'rgba(255,255,255,0.5)',
                        background: log.anomaly_flag ? 'rgba(239,68,68,0.1)' : 'transparent',
                        padding: log.anomaly_flag ? '8px 12px' : '16px',
                        borderRadius: log.anomaly_flag ? '8px' : '0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {log.anomaly_flag && <ShieldCheck size={14} color="#ef4444" />}
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <History size={48} color="rgba(255,255,255,0.05)" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.2)' }}>No audit logs found matching criteria.</p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              Showing {logs.length} records {skip > 0 ? `(offset ${skip})` : ''}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrevPage}
                disabled={skip === 0}
                className="btn-dark-secondary"
                style={{ padding: '8px 16px', opacity: skip === 0 ? 0.5 : 1, cursor: skip === 0 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={logs.length < limit}
                className="btn-dark-secondary"
                style={{ padding: '8px 16px', opacity: logs.length < limit ? 0.5 : 1, cursor: logs.length < limit ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
