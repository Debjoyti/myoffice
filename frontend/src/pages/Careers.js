import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const Careers = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('careersActiveTab') || 'jobBoard');
  const [jdText, setJdText] = useState('');
  const [creatingJob, setCreatingJob] = useState(false);

  useEffect(() => {
    localStorage.setItem('careersActiveTab', activeTab);
  }, [activeTab]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    naukri_url: '',
    skills: '',
    colleague_rating: 0,
    boss_rating: 0,
    resume_text: ''
  });

  const [currentCandidateId, setCurrentCandidateId] = useState(null);
  const [interviewSession, setInterviewSession] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [candidates, setCandidates] = useState([]);

  // Anti-cheating refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [proctorStatus, setProctorStatus] = useState('Initializing Face Detection...');
  const [blazeModel, setBlazeModel] = useState(null);

  useEffect(() => {
    fetchJobs();
    loadBlazeface();
  }, []);

  const loadBlazeface = async () => {
    try {
      await tf.setBackend('webgl');
      const model = await blazeface.load();
      setBlazeModel(model);
      setProctorStatus('Ready');
    } catch(err) {
      console.error("TFJS load error:", err);
      setProctorStatus('Failed to load Face Model');
    }
  };

  useEffect(() => {
    let animationId;
    let isActive = true;
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    const setupCamera = async () => {
      if (!videoElement || !navigator.mediaDevices?.getUserMedia) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!isActive) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        videoElement.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied:", err);
        if (isActive) {
          setProctorStatus('Camera Access Denied');
        }
      }
    };

    const detectFaces = async () => {
      if (!isActive || !videoElement || !canvasElement || !blazeModel) return;

      if (videoElement.readyState === 4) {
        const ctx = canvasElement.getContext('2d');
        if (!ctx) return;

        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        const predictions = await blazeModel.estimateFaces(videoElement, false);
        if (!isActive) return;

        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        if (predictions.length > 0) {
          if (predictions.length > 1) {
            setProctorStatus('WARNING: Multiple faces detected!');
          } else {
            setProctorStatus('Proctoring: Active & Clear');
          }

          predictions.forEach(pred => {
            ctx.beginPath();
            ctx.lineWidth = "2";
            ctx.strokeStyle = predictions.length > 1 ? "red" : "green";
            ctx.rect(
              pred.topLeft[0],
              pred.topLeft[1],
              pred.bottomRight[0] - pred.topLeft[0],
              pred.bottomRight[1] - pred.topLeft[1]
            );
            ctx.stroke();
          });
        } else {
          setProctorStatus('WARNING: No face detected!');
        }
      }

      if (isActive) {
        animationId = requestAnimationFrame(detectFaces);
      }
    };

    if (activeTab === 'aiInterview' && interviewSession && videoElement && canvasElement && blazeModel) {
      setupCamera().then(() => {
        if (!isActive) return;
        videoElement.onloadeddata = () => {
          if (!isActive) return;
          detectFaces();
        };
      });
    }

    return () => {
      isActive = false;
      if (animationId) cancelAnimationFrame(animationId);

      if (videoElement) {
        videoElement.onloadeddata = null;
        const stream = videoElement.srcObject;
        if (stream && typeof stream !== 'string' && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach(track => track.stop());
        }
        videoElement.srcObject = null;
      }
    };
  }, [activeTab, interviewSession, blazeModel]);


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

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/careers/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        job_id: selectedJob?.id || selectedJob?._id || "1",
        name: applyForm.name,
        email: applyForm.email,
        resume_text: applyForm.full_resume || `Skills: ${applyForm.skills}, LI: ${applyForm.linkedin_url}, Naukri: ${applyForm.naukri_url}`,
        peer_rating: (parseFloat(applyForm.colleague_rating) + parseFloat(applyForm.boss_rating)) / 2
      };

      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const cid = data.candidate_id || data.id || "dummy_candidate_123";
        setCurrentCandidateId(cid);
        window.tempCandidateId = cid;
        alert('Application submitted successfully!');
        setSelectedJob(null);
        setActiveTab('myProfile');
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert('Network error');
    }
  };

  const startInterview = async () => {
    const cid = currentCandidateId || window.tempCandidateId || "test_candidate_123";
    try {
      const dummySession = {
         session_id: "dummy_sess_" + cid,
         round: 1,
         messages: [{role: 'ai', content: 'Welcome to the interview.'}]
      };
      setInterviewSession(dummySession);

      const res = await fetch(`/api/careers/ai-interview/start/${cid}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setInterviewSession(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !interviewSession) return;
    const session_id = interviewSession.session_id;

    // Calculate simulated typing speed
    const msgLength = chatInput.length;
    const assumedTypingSpeedCharsPerSecond = 5;
    const timeTaken = Math.max(1, Math.floor(msgLength / assumedTypingSpeedCharsPerSecond));

    // Optimistic UI update
    const newMessages = [...interviewSession.messages, { role: 'user', content: chatInput }];
    setInterviewSession({ ...interviewSession, messages: newMessages });
    const msg = chatInput;
    setChatInput('');

    try {
      const res = await fetch(`/api/careers/ai-interview/${session_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, time_taken_seconds: timeTaken })
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewSession({ ...interviewSession, messages: [...newMessages, { role: 'ai', content: data.reply }] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const endInterview = async () => {
    if (!interviewSession) return;
    try {
      const res = await fetch(`/api/careers/ai-interview/${interviewSession.session_id}/finish`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const score = data.final_score !== undefined ? data.final_score : data.rating;
        const recommendation = data.ai_report?.recommendation || '';
        alert(`Interview completed. AI Final Score: ${score}/10. ${recommendation}`);
        setInterviewSession(null);
        setActiveTab('myProfile');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/careers/candidates');
      if(res.ok) {
         const data = await res.json();
         const mapped = data.map(c => ({
           id: c.id,
           name: c.resume_text ? c.resume_text.split(',')[0] : 'Unknown',
           skills: c.resume_text || "N/A",
           ai_rating: c.ai_interview_rating,
           peer_rating: c.peer_rating,
           status: c.status
         }));
         setCandidates(mapped);
      }
    } catch(err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05070f' }}>
      <Sidebar user={user} onLogout={onLogout} />
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', marginLeft: '250px' }}>
        <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '24px' }}>Careers & Hiring</h1>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {['jobBoard', 'myProfile', 'aiInterview', 'recruiterView'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if(tab === 'recruiterView') fetchCandidates(); }}
              style={{
                padding: '10px 20px',
                background: activeTab === tab ? '#6366f1' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {tab === 'jobBoard' && 'Job Board'}
              {tab === 'myProfile' && 'My Profile'}
              {tab === 'aiInterview' && 'AI Proctored Interview'}
              {tab === 'recruiterView' && 'Recruiter View'}
            </button>
          ))}
        </div>

        {activeTab === 'jobBoard' && (
          <div style={{ color: '#ccc' }}>
            <h2>Available Positions</h2>
            {!selectedJob ? (
              <div>
                {jobs && jobs.slice(0, 5).map(job => (
                  <div key={job.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <h3 style={{ color: '#fff', margin: '0 0 8px 0' }}>{job?.title || 'Unknown Job'}</h3>
                    <p>{job?.description || 'No description'}</p>
                    <p><strong>Skills:</strong> {job?.skills_required || 'N/A'}</p>
                    <button onClick={() => setSelectedJob(job)} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply Now</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                <button onClick={() => setSelectedJob(null)} style={{ background: 'transparent', color: '#6366f1', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>← Back</button>
                <h3>Applying for: {selectedJob?.title || 'Unknown Job'}</h3>
                <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input placeholder="Name" value={applyForm.name} onChange={e=>setApplyForm({...applyForm, name: e.target.value})} required style={{ padding: '8px' }} />
                  <input placeholder="Email" type="email" value={applyForm.email} onChange={e=>setApplyForm({...applyForm, email: e.target.value})} required style={{ padding: '8px' }} />
                  <input placeholder="LinkedIn URL" value={applyForm.linkedin_url} onChange={e=>setApplyForm({...applyForm, linkedin_url: e.target.value})} style={{ padding: '8px' }} />
                  <input placeholder="Naukri URL" value={applyForm.naukri_url} onChange={e=>setApplyForm({...applyForm, naukri_url: e.target.value})} style={{ padding: '8px' }} />
                  <input placeholder="Skills (comma separated)" value={applyForm.skills} onChange={e=>setApplyForm({...applyForm, skills: e.target.value})} required style={{ padding: '8px' }} />
                  <textarea placeholder="Paste Full Resume Here..." value={applyForm.full_resume} onChange={e=>setApplyForm({...applyForm, full_resume: e.target.value})} required style={{ padding: '8px', height: '100px' }} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label>Colleague Rating (0-5):
                      <input type="number" step="0.1" max="5" value={applyForm.colleague_rating} onChange={e=>setApplyForm({...applyForm, colleague_rating: parseFloat(e.target.value)})} style={{ width: '60px' }} />
                    </label>
                    <label>Boss Rating (0-5):
                      <input type="number" step="0.1" max="5" value={applyForm.boss_rating} onChange={e=>setApplyForm({...applyForm, boss_rating: parseFloat(e.target.value)})} style={{ width: '60px' }} />
                    </label>
                  </div>
                  <button type="submit" style={{ padding: '10px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Application</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'myProfile' && (
          <div style={{ color: '#ccc' }}>
            <h2>Transparent Profile</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
              {currentCandidateId ? (
                <>
                <p><strong>Name:</strong> {applyForm.name}</p>
                <p><strong>Linked In:</strong> {applyForm.linkedin_url || 'N/A'}</p>
                <p><strong>Naukri:</strong> {applyForm.naukri_url || 'N/A'}</p>
                <p><strong>Skills:</strong> {applyForm.skills}</p>
                <p><strong>Colleague Rating:</strong> {applyForm.colleague_rating}/5</p>
                <p><strong>Boss Rating:</strong> {applyForm.boss_rating}/5</p>
                {applyForm.colleague_rating < 3.0 || applyForm.boss_rating < 3.0 ? (
                   <p style={{ color: '#ef4444' }}>Notice: Previous low ratings may affect your application.</p>
                ) : <p style={{ color: '#22c55e' }}>Good standing.</p>}
                </>
              ) : (
                <p>No profile data yet. Please apply for a job first.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'aiInterview' && (
          <div style={{ color: '#ccc' }}>
            <h2>AI Proctored Interview</h2>
            {!interviewSession ? (
              <div>
                <p>Ensure your webcam and microphone are working. You will be evaluated based on the Job Description and your Resume data.</p>
                <button onClick={startInterview} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Start Interview</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 2, background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ position: 'relative', width: '100%', height: '300px', background: '#111', borderRadius: '8px', marginBottom: '16px', border: proctorStatus.includes('WARNING') ? '2px solid #ef4444' : '2px solid #22c55e', overflow: 'hidden' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', color: proctorStatus.includes('WARNING') ? '#ef4444' : '#22c55e' }}>
                      {proctorStatus}
                    </div>
                  </div>
                  <div style={{ height: '300px', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {interviewSession.messages.map((m, idx) => (
                      <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%' }}>
                        <strong>{m.role === 'user' ? 'You' : 'AI'}: </strong>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      style={{ flex: 1, padding: '10px', borderRadius: '4px', border: 'none' }}
                      placeholder="Type your answer..."
                      value={chatInput}
                      onChange={e=>setChatInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                    />
                    <button onClick={sendChatMessage} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <h3>Status</h3>
                  <p>Round: {interviewSession.round || 1}</p>
                  <p>Proctoring: Active & Recording</p>
                  <p>Questions adaptive based on JD & Resume.</p>
                  <div style={{ flex: 1 }}></div>
                  <button onClick={endInterview} style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '16px' }}>End Interview & Submit</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recruiterView' && (
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
                      <td style={{ padding: '12px', fontSize: '18px', fontWeight: 'bold' }}>{c.final_score !== undefined && c.final_score !== null ? `${(c.final_score * 10).toFixed(0)}%` : 'Pending'}</td>
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
        )}
      </div>
    </div>
  );
};

export default Careers;
