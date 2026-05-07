import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

function JobStudio() {
    const [brief, setBrief] = useState('');
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState([]);

    // Simulating context/company logic
    const companyId = 'demo-comp-1';

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await api.get(`/api/jobs/?company_id=${companyId}`);
            setJobs(res.data);
        } catch (error) {
            toast.error("Failed to load jobs");
        }
    };

    const handleDraftJob = async () => {
        if (!brief) {
            toast.error("Please enter a brief");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/jobs/draft', { brief, company_id: companyId });
            toast.success("Job drafted successfully!");
            setJobs([res.data, ...jobs]);
            setBrief('');
        } catch (error) {
            toast.error("Failed to draft job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Job Studio (Magic Moment 1)</h1>

            <div className="bg-white p-4 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-2">Create New Role</h2>
                <p className="text-gray-600 mb-4">Describe the role in a few sentences, and our AI will draft the JD, rubric, and salary band.</p>
                <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="e.g. I need a backend engineer who knows Postgres, ideally has worked with payments..."
                    className="w-full p-2 border rounded-md mb-4"
                    rows={4}
                />
                <button
                    onClick={handleDraftJob}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                    {loading ? 'Drafting...' : 'Draft JD with AI'}
                </button>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Drafted Jobs</h2>
                {jobs.map(job => (
                    <div key={job.id} className="bg-white p-4 rounded-lg shadow mb-4">
                        <h3 className="text-lg font-bold">{job.title} ({job.department})</h3>
                        <p className="text-sm text-gray-500 mb-2">Status: {job.status}</p>
                        <p className="mb-2"><strong>Description:</strong> {job.description}</p>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 p-2 rounded">
                                <strong>Rubric:</strong>
                                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(job.rubric, null, 2)}</pre>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <strong>Salary Band:</strong>
                                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(job.salary_band, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default JobStudio;
