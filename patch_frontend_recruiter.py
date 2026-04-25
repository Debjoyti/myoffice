import sys

filepath = 'frontend/src/pages/Careers.js'
with open(filepath, 'r') as f:
    content = f.read()

# 1. State for JD text
if "const [activeTab, setActiveTab] = useState(localStorage.getItem('careersActiveTab') || 'jobBoard');" in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState(localStorage.getItem('careersActiveTab') || 'jobBoard');",
        "const [activeTab, setActiveTab] = useState(localStorage.getItem('careersActiveTab') || 'jobBoard');\n  const [jdText, setJdText] = useState('');\n  const [creatingJob, setCreatingJob] = useState(false);"
    )

# 2. Function to handle JD submit
handle_jd_code = """
  const handleStartHiring = async () => {
    if(!jdText.trim()) return alert('Please enter a JD');
    setCreatingJob(true);
    try {
      const res = await fetch('/api/careers/jobs/create-from-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText, organization_id: user?.organization_id || 'default_org' })
      });
      if(res.ok) {
        alert('AI Hiring Engine configured successfully!');
        setJdText('');
        fetchJobs(); // refresh the job board
      } else {
        alert('Failed to start hiring');
      }
    } catch(e) {
      console.error(e);
      alert('Error creating job');
    }
    setCreatingJob(false);
  };
"""
content = content.replace("  const fetchJobs = async () => {", handle_jd_code + "\n  const fetchJobs = async () => {")

# 3. Add AI Start Hiring Section to recruiter view + update table columns
recruiter_view_old = """        {activeTab === 'recruiterView' && (
          <div style={{ color: '#ccc' }}>
            <h2>Recruiter Dashboard</h2>
            <button onClick={fetchCandidates} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '16px' }}>Refresh Data</button>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Candidate Name / Info</th>
                  <th style={{ padding: '12px' }}>Role/Skills</th>
                  <th style={{ padding: '12px' }}>AI Rating</th>
                  <th style={{ padding: '12px' }}>Prev Ratings</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                   <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No candidates found.</td></tr>
                ) : (
                  candidates.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px' }}>{c.name}</td>
                      <td style={{ padding: '12px' }}>{c.skills}</td>
                      <td style={{ padding: '12px' }}>{c.ai_rating ? `${c.ai_rating}/10` : '-'}</td>
                      <td style={{ padding: '12px' }}>{c.peer_rating ? `${c.peer_rating}/5` : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: c.status === 'rejected' ? '#ef4444' : (c.status === 'ai_interview_done' ? '#22c55e' : '#f59e0b'),
                          borderRadius: '4px', fontSize: '12px'
                        }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}"""

recruiter_view_new = """        {activeTab === 'recruiterView' && (
          <div style={{ color: '#ccc' }}>
            <h2>Recruiter Dashboard (AI Engine)</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
               <h3>Start Autonomous Hiring</h3>
               <p>Paste the Job Description below. The AI will parse skills, generate questions, and handle evaluations.</p>
               <textarea
                 value={jdText}
                 onChange={e=>setJdText(e.target.value)}
                 placeholder="Paste full JD here..."
                 style={{ width: '100%', height: '120px', padding: '12px', background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '16px' }}
               />
               <button onClick={handleStartHiring} disabled={creatingJob} style={{ padding: '10px 20px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                 {creatingJob ? 'Configuring Engine...' : '✨ Start Hiring ✨'}
               </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3>Candidate Leaderboard (Merit Based)</h3>
               <button onClick={fetchCandidates} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '16px' }}>Refresh Data</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Rank</th>
                  <th style={{ padding: '12px' }}>Candidate Info</th>
                  <th style={{ padding: '12px' }}>AI Composite Score</th>
                  <th style={{ padding: '12px' }}>Recommendation</th>
                  <th style={{ padding: '12px' }}>Risk Flags</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                   <tr><td colSpan="6" style={{ padding: '12px', textAlign: 'center' }}>No candidates found.</td></tr>
                ) : (
                  candidates.map((c, index) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: index === 0 ? 'rgba(234, 179, 8, 0.1)' : 'transparent' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: index === 0 ? '#eab308' : '#fff' }}>#{index + 1}</td>
                      <td style={{ padding: '12px' }}>{c.name}<br/><span style={{fontSize:'12px', color:'#888'}}>{c.email}</span></td>
                      <td style={{ padding: '12px', fontSize: '18px', fontWeight: 'bold' }}>{c.final_score ? `${c.final_score}%` : 'Pending'}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: c.ai_report?.recommendation === 'Reject' ? '#ef4444' : (c.ai_report?.recommendation === 'Strong Hire' ? '#22c55e' : '#f59e0b') }}>{c.ai_report?.recommendation || '-'}</td>
                      <td style={{ padding: '12px' }}>
                         {c.ai_report?.risk_flags?.length > 0 ? (
                             <span style={{ color: '#ef4444', fontSize: '12px' }}>{c.ai_report.risk_flags.join(', ')}</span>
                         ) : <span style={{ color: '#22c55e', fontSize: '12px' }}>Clear</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: c.status === 'rejected' ? '#ef4444' : (c.status === 'ai_interview_done' ? '#22c55e' : '#3b82f6'),
                          borderRadius: '4px', fontSize: '12px'
                        }}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}"""

content = content.replace(recruiter_view_old, recruiter_view_new)

with open(filepath, 'w') as f:
    f.write(content)

print("Recruiter UI patched.")
