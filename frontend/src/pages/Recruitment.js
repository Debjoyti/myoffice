import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Briefcase, Users, Mail, FileText, CheckCircle2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Recruitment = ({ user, onLogout, isSubComponent }) => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('recruitmentActiveTab') || 'jobs');

  useEffect(() => {
    localStorage.setItem('recruitmentActiveTab', activeTab);
  }, [activeTab]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [jobForm, setJobForm] = useState({ title: '', department: '', location: '', type: 'Full-time', description: '' });
  const [candidateForm, setCandidateForm] = useState({ job_id: '', name: '', email: '', resume_url: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [jobsRes, candidatesRes] = await Promise.all([
        axios.get(`${API}/jobs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/candidates`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setJobs(jobsRes.data);
      setCandidates(candidatesRes.data);
    } catch { toast.error('Failed to fetch recruitment data'); }
    setLoading(false);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/jobs`, jobForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Job posting created');
      setShowJobModal(false);
      setJobForm({ title: '', department: '', location: '', type: 'Full-time', description: '' });
      fetchData();
    } catch { toast.error('Failed to create job'); }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/candidates`, candidateForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Candidate added');
      setShowCandidateModal(false);
      setCandidateForm({ job_id: '', name: '', email: '', resume_url: '' });
      fetchData();
    } catch { toast.error('Failed to add candidate'); }
  };

  const content = (
    <>
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Recruitment (ATS)</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(94, 106, 210, 0.15)', color: 'var(--brand-primary)', padding: '2px 8px', borderRadius: '4px' }}>PA40</span>
              </div>
              <p className="page-subtitle">Manage job openings and track candidates</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  if (jobs.length === 0) { toast.warning('Create a job posting first'); return; }
                  setShowCandidateModal(true);
                }} 
                className="btn-dark-secondary"
              >
                <Plus size={18} /> Add Candidate
              </button>
              <button onClick={() => setShowJobModal(true)} className="btn-dark-primary">
                <Plus size={18} /> Post Job
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0' }}>
            <button 
              onClick={() => setActiveTab('jobs')} 
              style={{ padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'jobs' ? '2px solid var(--brand-primary)' : 'none', color: activeTab === 'jobs' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600, cursor: 'pointer' }}
            >
              Open Roles ({jobs.length})
            </button>
            <button 
              onClick={() => setActiveTab('candidates')} 
              style={{ padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'candidates' ? '2px solid var(--brand-primary)' : 'none', color: activeTab === 'candidates' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600, cursor: 'pointer' }}
            >
              Candidates ({candidates.length})
            </button>
          </div>

          {loading ? (
            <div className="dark-loading">Processing applications...</div>
          ) : activeTab === 'jobs' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }} className="fade-in">
              {jobs.map(job => (
                <div key={job.id} className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{job.id}</span>
                    <span className="badge-green">{job.status}</span>
                  </div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', margin: '0 0 8px', fontWeight: 700 }}>{job.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>{job.department} • {job.location}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="var(--brand-primary)" />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {candidates.filter(c => c.job_id === job.id).length} Applicants
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr><th>Candidate Name</th><th>Job Role</th><th>Email</th><th>Applied On</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                      <td>{jobs.find(j => j.id === c.job_id)?.title || 'Unknown'}</td>
                      <td>{c.email}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td><span className="badge-blue">{c.status}</span></td>
                      <td><button className="icon-btn"><MoreVertical size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

      {/* New Job Modal */}
      {showJobModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '600px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Step 1: Open New Role</h2>
              <button onClick={() => setShowJobModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleCreateJob} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Job Title</label>
                <input type="text" className="dark-input" placeholder="e.g. Senior Software Engineer" required value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Department</label>
                  <input type="text" className="dark-input" placeholder="e.g. Engineering" required value={jobForm.department} onChange={e => setJobForm({...jobForm, department: e.target.value})} />
                </div>
                <div>
                  <label className="dark-label">Location</label>
                  <input type="text" className="dark-input" placeholder="e.g. Remote / New York" required value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="dark-label">Description</label>
                <textarea className="dark-input" rows="5" placeholder="Job details, requirements..." required value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowJobModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Post Hiring</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Candidate Modal */}
      {showCandidateModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '400px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Add Applicant</h2>
              <button onClick={() => setShowCandidateModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleAddCandidate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Select Job</label>
                <select className="dark-input" required value={candidateForm.job_id} onChange={e => setCandidateForm({...candidateForm, job_id: e.target.value})}>
                  <option value="">Select a role</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Candidate Name</label>
                <input type="text" className="dark-input" required value={candidateForm.name} onChange={e => setCandidateForm({...candidateForm, name: e.target.value})} />
              </div>
              <div>
                <label className="dark-label">Email Address</label>
                <input type="email" className="dark-input" required value={candidateForm.email} onChange={e => setCandidateForm({...candidateForm, email: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCandidateModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add to Pipeline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  if (isSubComponent) return content;

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Recruitment;
