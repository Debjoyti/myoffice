import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

function CandidateProfile() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const personId = query.get('person_id');
    const companyId = 'demo-comp-1';

    const [trustData, setTrustData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(personId) {
            fetchTrustProfile();
        }
    }, [personId]);

    const fetchTrustProfile = async () => {
        try {
            const res = await api.get(`/api/trust/${personId}`);
            setTrustData(res.data);
        } catch (e) {
            console.error("No trust profile yet");
        }
    };

    const handleRunVerification = async () => {
        setLoading(true);
        try {
            const res = await api.post('/api/trust/verify', {
                person_id: personId,
                company_id: companyId,
                types: ['digilocker', 'uan', 'pan']
            });
            toast.success("Verification complete");
            setTrustData({ trust_score: res.data.trust_score, verifications: [] });
            fetchTrustProfile(); // refresh
        } catch (e) {
            toast.error("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    if (!personId) return <div className="p-6">No candidate selected.</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Candidate Profile & Trust Score</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Trust Backbone (India Moat)</h2>
                    <button onClick={handleRunVerification} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                        {loading ? 'Verifying...' : 'Run 1-Click Verification'}
                    </button>
                </div>

                {trustData && trustData.trust_score.score > 0 ? (
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center text-3xl font-bold text-green-600">
                                {trustData.trust_score.score}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Trust Score</h3>
                                <p className="text-sm text-gray-500">Based on verified, immutable sources.</p>
                            </div>
                        </div>

                        <h4 className="font-semibold mb-2">Score Breakdown:</h4>
                        <ul className="list-disc pl-5 mb-6 text-gray-700">
                            {Object.entries(trustData.trust_score.breakdown).map(([key, value]) => (
                                <li key={key}>{value}</li>
                            ))}
                        </ul>

                        <h4 className="font-semibold mb-2">Raw Verification Signals:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trustData.verifications?.map(v => (
                                <div key={v.id} className="border p-3 rounded">
                                    <div className="font-bold capitalize">{v.type} <span className="text-green-500 text-sm">✓ {v.status}</span></div>
                                    <pre className="text-xs bg-gray-50 p-2 mt-2 whitespace-pre-wrap">
                                        {JSON.stringify(v.result_data, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No verifications run yet.</p>
                )}
            </div>
        </div>
    );
}

export default CandidateProfile;
