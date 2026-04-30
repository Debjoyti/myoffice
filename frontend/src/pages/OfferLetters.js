import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import OfferLetterModal from '../components/OfferLetterModal';
import { generateOfferLetterHtml } from '../utils/offerLetterTemplate';
import { Download, Search, Edit2, Plus, Mail, Hash } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OfferLetters = ({ user, onLogout, isSubComponent }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => { fetchOffers(); }, []);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/offer-letters`, { headers: { Authorization: `Bearer ${token}` } });
            setOffers(response.data);
        } catch (error) {
            toast.error('Failed to load offer letters');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    const handleDownload = (offer) => {
        const printWindow = window.open('', '_blank');
        const html = generateOfferLetterHtml(offer);
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleSaveOffer = (newOffer) => {
        setOffers([newOffer, ...offers]);
        toast.success('Offer letter generated and saved!');
    };

    const filteredOffers = offers.filter(o =>
        (o.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.phone || '').includes(searchQuery) ||
        (o.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const content = (
        <>
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Offer Letters</h1>
                    <p className="page-subtitle">Manage and generate employment offer letters</p>
                </div>
                <button onClick={() => setShowOfferModal(true)} className="btn-dark-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                    <Plus size={18} /> Generate New Offer
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '32px', maxWidth: '500px' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search by name, email, phone or unique ID..."
                    className="dark-input" style={{ paddingLeft: '48px', fontSize: '14px', height: '48px', borderRadius: '14px' }}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {loading ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Loading records...</div>
            ) : (
                <div className="dark-table-wrap fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Candidate Details</th>
                                <th>Unique ID</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOffers.length > 0 ? filteredOffers.map((offer) => (
                                <tr key={offer.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                                                {getInitials(offer.name)}
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{offer.name}</div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{offer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                            <Hash size={14} /> {offer.id}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                                            {offer.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleDownload(offer)} title="Download PDF" style={{ width: '34px', height: '34px', background: 'var(--bg-elevated)', border: 'none', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Download size={16} />
                                            </button>
                                            <button title="Edit Offer" style={{ width: '34px', height: '34px', background: 'var(--bg-elevated)', border: 'none', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <Mail size={48} strokeWidth={1} />
                                            <p>No offer letters found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showOfferModal && (
                <OfferLetterModal show={showOfferModal} onClose={() => setShowOfferModal(false)} onSave={handleSaveOffer} />
            )}
        </>
    );

    if (isSubComponent) return content;

    return (
        <div className="page-root">
            <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="page-content">
                <div className="page-inner">{content}</div>
            </div>
        </div>
    );
};

export default OfferLetters;
