import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import OfferLetterModal from '../components/OfferLetterModal';
import { Download, Search, Edit2, Trash2, Plus, Mail, Phone, Hash, User, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OfferLetters = ({ user, onLogout }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/offer-letters`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOffers(response.data);
        } catch (error) {
            console.error('Error fetching offers:', error);
            toast.error('Failed to load offer letters');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    };

    const handleDownload = (offer) => {
        const printWindow = window.open('', '_blank');
        const details = offer.details || {};
        const salary = details.salaryBreakdown || {};

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offer Letter - ${offer.name}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                    .company-name { font-size: 24px; font-bold; color: #4f46e5; }
                    .offer-title { text-align: center; font-size: 20px; text-decoration: underline; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #eee; padding: 10px; text-align: left; }
                    th { background: #f9fafb; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                    .signature-box { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; margin-top: 60px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">${details.company?.name || 'Your Company Name'}</div>
                    <div>${details.company?.address || 'Company Address Line'}</div>
                </div>
                
                <h2 class="offer-title">LETTER OF OFFER</h2>
                
                <div class="section">
                    <p>Date: ${new Date(offer.created_at).toLocaleDateString()}</p>
                    <p>To,<br><strong>${offer.name}</strong><br>Email: ${offer.email}<br>Phone: ${offer.phone}</p>
                </div>
                
                <div class="section">
                    <p>Dear ${offer.name},</p>
                    <p>We are pleased to offer you the position of <strong>${offer.designation}</strong>. Your joining date is scheduled for ${details.timeline?.joiningDate || 'TBD'}.</p>
                </div>
                
                <div class="section">
                    <div class="section-title">Salary Structure (CTC: ₹${offer.ctc_yearly.toLocaleString('en-IN')})</div>
                    <table>
                        <thead>
                            <tr><th>Component</th><th>Monthly (₹)</th><th>Yearly (₹)</th></tr>
                        </thead>
                        <tbody>
                            ${Object.entries(salary).map(([name, val]) => `
                                <tr><td>${name}</td><td>${Math.round(val.monthly).toLocaleString('en-IN')}</td><td>${Math.round(val.yearly).toLocaleString('en-IN')}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-title">Responsibilities</div>
                    <ul>
                        ${(details.responsibilities || []).map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>

                <div class="footer">
                    <div class="signature-box">For ${details.company?.name || 'Company'}</div>
                    <div class="signature-box">Candidate Acceptance</div>
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

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

    return (
        <div className="layout-container">
            <Sidebar
                user={user}
                onLogout={onLogout}
                activePage="offer-letters"
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="main-content">
                <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Offer Letters</h1>
                        <p className="page-subtitle">Manage and generate employment offer letters</p>
                    </div>
                    <button onClick={() => setShowOfferModal(true)} className="btn-dark-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                        <Plus size={18} /> Generate New Offer
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '32px', maxWidth: '500px' }}>
                    <Search
                        size={20}
                        className="text-white/30"
                        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone or unique ID..."
                        className="dark-input"
                        style={{ paddingLeft: '48px', fontSize: '14px', height: '48px', borderRadius: '14px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px' }}>Loading record...</div>
                ) : (
                    <div className="dark-table-wrap fade-in">
                        <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr>
                                    <th style={{ background: 'transparent', padding: '0 16px' }}>Candidate Details</th>
                                    <th style={{ background: 'transparent', padding: '0 16px' }}>Unique ID</th>
                                    <th style={{ background: 'transparent', padding: '0 16px' }}>Status</th>
                                    <th style={{ background: 'transparent', padding: '0 16px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOffers.length > 0 ? filteredOffers.map((offer) => (
                                    <tr key={offer.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: '14px', fontWeight: 600,
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                                }}>
                                                    {getInitials(offer.name)}
                                                </div>
                                                <div>
                                                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{offer.name}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{offer.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                                <Hash size={14} className="text-white/20" /> {offer.id}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                                background: offer.status === 'Sent' ? 'rgba(16,185,129,0.1)' :
                                                    offer.status === 'Draft' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                                                color: offer.status === 'Sent' ? '#10b981' :
                                                    offer.status === 'Draft' ? '#f59e0b' : '#3b82f6',
                                                border: `1px solid ${offer.status === 'Sent' ? 'rgba(16,185,129,0.2)' : offer.status === 'Draft' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`
                                            }}>
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleDownload(offer)}
                                                    className="btn-dark-icon" title="Download PDF" style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                                    <Download size={16} />
                                                </button>
                                                <button className="btn-dark-icon" title="Edit Offer" style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
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
                                                <p>No offer letters found matching your criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {showOfferModal && (
                <OfferLetterModal
                    show={showOfferModal}
                    onClose={() => setShowOfferModal(false)}
                    onSave={handleSaveOffer}
                />
            )}
        </div>
    );
};

export default OfferLetters;
