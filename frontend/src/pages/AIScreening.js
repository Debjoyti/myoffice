import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

function AIScreening() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const jobId = query.get('job_id') || 'fake-job-id';
    const companyId = 'demo-comp-1';

    const [topCandidates, setTopCandidates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTopCandidates();
    }, [jobId]);

    const fetchTopCandidates = async () => {
        try {
            const res = await api.get(`/api/screening/top/${jobId}`);
            setTopCandidates(res.data);
        } catch (e) {
            console.error("Failed to fetch top candidates", e);
        }
    };

    const handleRunScreening = async () => {
        setLoading(true);
        try {
            await api.post('/api/screening/run', { job_id: jobId, company_id: companyId });
            toast.success("AI Screening Complete");
            fetchTopCandidates();
        } catch (error) {
            toast.error("Failed to run AI screening");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">AI Screening (Magic Moment 3)</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Top 5 Candidates</h2>
                    <button onClick={handleRunScreening} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50">
                        {loading ? 'Screening...' : 'Run AI Screen'}
                    </button>
                </div>

                {topCandidates.length > 0 ? (
                    <div className="space-y-4">
                        {topCandidates.map((c, index) => (
                            <div key={c.application_id} className="border p-4 rounded-lg flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{index + 1}. {c.name}</h3>
                                    <div className="text-sm text-gray-500 mb-2">Score: <span className="font-semibold text-black">{c.score}/100</span></div>
                                    <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{c.rationale}</pre>
                                </div>
                                <Link to={`/candidate?person_id=${c.person_id}`} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                    View Trust Profile
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No candidates screened yet. Try applying via the Fast Apply form, then run screening.</p>
                )}
            </div>
        </div>
    );
}

export default AIScreening;
