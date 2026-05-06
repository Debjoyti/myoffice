import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

function JobApply() {
    const location = useLocation();
    const navigate = useNavigate();

    // We assume you get job_id from URL params or location state.
    // For demo, we'll hardcode or grab from search params
    const query = new URLSearchParams(location.search);
    const jobId = query.get('job_id') || 'fake-job-id';
    const companyId = 'demo-comp-1'; // Default test company

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        resume_text: ''
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/whatsapp/web-apply', {
                ...formData,
                job_id: jobId,
                company_id: companyId
            });
            toast.success("Application submitted successfully!");
            navigate('/job-studio');
        } catch (error) {
            toast.error("Failed to submit application.");
        } finally {
            setLoading(false);
        }
    };

    const handleMockWhatsApp = async () => {
        if (!formData.phone || !formData.resume_text) {
            toast.error("Enter phone and resume text to mock WhatsApp flow");
            return;
        }
        setLoading(true);
        try {
            await api.post('/api/whatsapp/webhook', {
                phone_number: formData.phone,
                message: formData.resume_text,
                job_id: jobId,
                company_id: companyId
            });
            toast.success("WhatsApp application mock successful!");
        } catch (error) {
            toast.error("Failed WhatsApp mock");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-2xl font-bold mb-6 text-center">PRSK Fast Apply</h1>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4 flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input type="text" required className="mt-1 w-full p-2 border rounded" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input type="text" required className="mt-1 w-full p-2 border rounded" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" required className="mt-1 w-full p-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="text" required className="mt-1 w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">Brief Intro / Resume Paste</label>
                        <textarea required className="mt-1 w-full p-2 border rounded" rows="4" value={formData.resume_text} onChange={e => setFormData({...formData, resume_text: e.target.value})}></textarea>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Submitting...' : 'Apply via Web'}
                    </button>

                    <div className="mt-4 border-t pt-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">Or test the WhatsApp API mock (USP 1)</p>
                        <button type="button" onClick={handleMockWhatsApp} disabled={loading} className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50">
                            Simulate WhatsApp App
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JobApply;
