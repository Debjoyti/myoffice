import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Book, Plus, X, Search, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const KnowledgeBase = ({ user, onLogout }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({ title: '', content: '', category: 'General' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/kb`, { headers: { Authorization: `Bearer ${token}` } });
      setArticles(res.data);
    } catch { toast.error('Failed to fetch knowledge base'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/kb`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Article published');
      setShowModal(false);
      setFormData({ title: '', content: '', category: 'General' });
      fetchData();
    } catch { toast.error('Failed to publish article'); }
  };

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="kb" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">Knowledge Base</h1>
              <p className="page-subtitle">Standard Operating Procedures & Company Wiki</p>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => setShowModal(true)} className="btn-dark-primary">
                <Plus size={18} /> New Article
              </button>
            )}
          </div>

          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
            <input
              type="text" className="dark-input" style={{ paddingLeft: '50px', height: '54px', fontSize: '16px' }}
              placeholder="Search by title, category, or keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="dark-loading">Indexing library...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {filteredArticles.map(article => (
                <div key={article.id} className="glass-card" style={{ padding: '24px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(94, 106, 210, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="var(--brand-primary)" />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '50px' }}>
                      {article.category.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '17px', margin: '0 0 8px', fontWeight: 600 }}>{article.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.content}</p>
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>By {article.author_name}</span>
                    <ExternalLink size={14} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
              {articles.length === 0 && (
                <div className="dark-empty" style={{ gridColumn: '1/-1' }}>No articles yet. Start building your company's second brain.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Article Modal */}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '800px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>New Article</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label className="dark-label">Article Title</label>
                  <input type="text" className="dark-input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Category</label>
                  <select className="dark-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="General">General</option>
                    <option value="Policies">Policies</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="dark-label">Content (Supports Markdown)</label>
                <textarea className="dark-input" rows="12" required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Discard</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
