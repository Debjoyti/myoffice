import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import OfferLetterModal from '../components/OfferLetterModal';
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
        const details = offer.details || {};
        const salary = Array.isArray(details.salaryBreakdown) ? details.salaryBreakdown : [];
        
        // Data Prep
        const companyName = details.company?.name || 'PRSK India Private Limited';
        const candidateName = offer.name;
        const hashId = btoa(offer.id + offer.created_at).substring(0, 32).toLowerCase(); // Doc ID simulation
        
        // Salary Categorization
        const fixed = salary.filter(c => ['Basic Pay', 'HRA', 'Other Allowance', 'Bonus', 'Special Allowance', 'Food Allowance'].some(n => c.name.includes(n)));
        const retirement = salary.filter(c => ['PF', 'Provident', 'Gratuity'].some(n => c.name.includes(n)));
        const otherBenefits = salary.filter(c => ['Insurance', 'Internet', 'Reimbursement'].some(n => c.name.includes(n)));
        
        const sumVal = (arr) => arr.reduce((acc, curr) => acc + (curr.final_value || 0), 0);
        const fixedTotal = sumVal(fixed);
        const retirementTotal = sumVal(retirement);
        const grossTotal = fixedTotal + retirementTotal;
        const benefitsTotal = sumVal(otherBenefits);
        
        const html = `<!DOCTYPE html><html><head><title>Offer_Letter_${offer.name}</title>
            <style>
                @page { margin: 20mm; }
                body { font-family: 'Arial', sans-serif; font-size: 11.5pt; line-height: 1.5; color: #1a1a1a; padding-bottom: 60px; }
                .top-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .candidate-info { font-weight: bold; }
                .date-info { text-align: right; }
                .salutation { margin-top: 30px; margin-bottom: 20px; font-weight: bold; }
                .section { margin-bottom: 20px; text-align: justify; }
                .section-num { font-weight: bold; text-decoration: underline; }
                .bold { font-weight: bold; }
                
                table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1.5px solid #000; font-size: 10pt; }
                th, td { border: 1px solid #000; padding: 6px 12px; text-align: left; vertical-align: middle; }
                .bg-grey { background-color: #f2f2f2; font-weight: bold; }
                
                .footer { position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; border-top: 1px solid #000; padding-top: 10px; font-size: 9pt; background: #fff; }
                .signature-section { display: flex; justify-content: space-between; margin-top: 50px; }
                .sign-box { width: 45%; }
                .sign-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
                .page-break { page-break-before: always; }
                .footnotes { font-size: 8.5pt; margin-top: 10px; line-height: 1.2; }
            </style>
        </head><body>
            <div class="top-header">
                <div class="candidate-info">
                    ${candidateName}<br>
                    Aadhaar No: ${details.aadhaar || 'XXXX-XXXX-XXXX'}<br>
                    Phone: ${offer.phone}<br>
                    E-mail: ${offer.email}
                </div>
                <div class="date-info">
                    Date: ${new Date(offer.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
            </div>

            <div class="salutation">Dear ${candidateName},</div>

            <div class="section">
                On behalf of <span class="bold">${companyName}</span>, a company set up under the Companies Act of India, 1956 (the “<span class="bold">Company</span>”), I am pleased to offer you the position of <span class="bold">${offer.designation}</span> of the Company. We are very impressed with your credentials and we look forward to your future success in this position.
            </div>

            <div class="section">The terms of your new position with the Company are as set forth below:</div>

            <div class="section">
                <span class="section-num">1. Position</span>. a. You will become <span class="bold">${offer.designation}</span> working on projects from our clients including Microsoft Corporation and other clients (each of which is hereinafter called “Client”).
                <br><br>
                b. You agree to the best of your ability and experience that you will at all times loyally and conscientiously perform all of the duties and obligations required of and from you pursuant to the express and implicit terms hereof...
            </div>

            <div class="section">
                <span class="section-num">2. Start Date</span>. Subject to fulfilment of any conditions imposed by this letter agreement, you will commence this new position with the Company on <span class="bold">${new Date(details.timeline?.joiningDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) || 'TBD'}</span>. Your place of joining will be <span class="bold">${details.location || 'Noida'}</span>.
            </div>

            <div class="section">
                <span class="section-num">3. Service Agreement</span>. Not applicable.
            </div>

            <div class="section">
                <span class="section-num">4. Compensation</span>. Your annual compensation consists of base salary, bonus, house rent allowance and other allowance as described below. In addition, you will be entitled to gratuity and certification reimbursement as per company policy.
                
                <table>
                    <tr class="bg-grey">
                        <td width="65%">Summary of Components</td>
                        <td>Amount (INR)</td>
                    </tr>
                    <tr class="bg-grey">
                        <td colspan="2">A. Fixed Component</td>
                    </tr>
                    ${fixed.map(c => `<tr><td>${c.name}</td><td>Rupees ${Math.round(c.final_value).toLocaleString('en-IN')}</td></tr>`).join('')}
                    
                    <tr class="bg-grey">
                        <td colspan="2">B. Retirement Benefits</td>
                    </tr>
                    ${retirement.map(c => `<tr><td>${c.name}<sup>a</sup></td><td>Rupees ${Math.round(c.final_value).toLocaleString('en-IN')}</td></tr>`).join('')}
                    
                    <tr class="bg-grey">
                        <td>C. Fixed Gross Salary (A+B)</td>
                        <td>Rupees ${Math.round(grossTotal).toLocaleString('en-IN')}</td>
                    </tr>
                    
                    <tr class="bg-grey">
                        <td colspan="2">D. Variable Components and Other Benefits</td>
                    </tr>
                    ${otherBenefits.map(c => `<tr><td>${c.name}</td><td>Rupees ${Math.round(c.final_value).toLocaleString('en-IN')}</td></tr>`).join('')}
                    
                    <tr class="bg-grey" style="background:#ddd">
                        <td>Total Earning Potential</td>
                        <td>Rupees ${Math.round(grossTotal + benefitsTotal).toLocaleString('en-IN')}</td>
                    </tr>
                </table>
                
                <div class="footnotes">
                    a. As per the provisions of the Payment of Gratuity Act, 1972.<br>
                    b. Company provides a comprehensive Group Health Insurance and Accidental Coverage plan...<br>
                    c. The company offers reimbursement for employee's home internet expenses.
                </div>
            </div>

            <div class="page-break"></div>

            <div class="section">
                <span class="section-num">5. Vacation Benefits</span>. You will be entitled to paid vacation per year, pro-rated for the remainder of this calendar year as per the company policy.
            </div>

            <div class="section">
                <span class="section-num">6. Confidential Information</span>. Your acceptance of this offer and commencement of employment with the Company is contingent upon the execution...
            </div>

            <div class="section"><span class="section-num">7. Confidentiality of Terms</span>. You agree to follow the Company’s strict policy that employees must not disclose...</div>
            <div class="section"><span class="section-num">8. Employment Restriction</span>. You shall not accept employment directly or indirectly with, at, for or by Client (Microsoft)...</div>
            
            <div class="section">
                <span class="section-num">9. At-Will Employment and Notice Period</span>. Your employment with the Company will be on an “at will” basis...
            </div>

            <div class="section">
                <span class="section-num">10. Surety Deposit</span>. Not applicable.
            </div>

            <div class="section">
                <span class="section-num">11. Jurisdiction</span>. This Agreement shall be governed and construed in accordance with the laws of India and shall be subject to the exclusive jurisdiction of the Courts at Delhi.
            </div>

            <div style="margin-top:40px;">
                We are all delighted to extend you this offer and look forward to working with you. To indicate your acceptance of the Company’s offer, please sign and date this letter in the space provided below...
            </div>

            <div class="signature-section">
                <div class="sign-box">
                    <div class="bold">For ${companyName}</div>
                    <div style="font-family: 'Cursive', serif; font-size: 24px; margin-top: 15px;">Amrish Shah</div>
                    <div class="sign-line">
                        <span class="bold">Signature</span><br>
                        Amrish Shah<br>
                        Director of Application Services Delivery<br>
                        Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
                <div class="sign-box">
                    <div class="bold">Accepted and Agreed</div>
                    <div style="font-family: 'Cursive', serif; font-size: 24px; margin-top: 15px;">${candidateName}</div>
                    <div class="sign-line">
                        <span class="bold">Signature</span><br>
                        ${candidateName}<br>
                        Date: ___________
                    </div>
                </div>
            </div>

            <div class="footer">
                ${companyName} (CIN: U72200MH2000PTC125631)<br>
                201, Meadows, Sahar Plaza, Andheri Kurla Road, Mumbai 400 059 | Tel +91 908 256 1327<br>
                www.PRSKIndia.com<br>
                <span style="color: #666">Doc ID: ${hashId}</span>
            </div>

            <script>window.onload=function(){window.print()}</script>
        </body></html>`;
        
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
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input type="text" placeholder="Search by name, email, phone or unique ID..."
                    className="dark-input" style={{ paddingLeft: '48px', fontSize: '14px', height: '48px', borderRadius: '14px' }}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px' }}>Loading records...</div>
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
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                                                {getInitials(offer.name)}
                                            </div>
                                            <div>
                                                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{offer.name}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{offer.email}</div>
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
                                            <button onClick={() => handleDownload(offer)} title="Download PDF" style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Download size={16} />
                                            </button>
                                            <button title="Edit Offer" style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <Sidebar user={user} onLogout={onLogout} activePage="offer-letters" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="page-content">
                <div className="page-inner">{content}</div>
            </div>
        </div>
    );
};

export default OfferLetters;
