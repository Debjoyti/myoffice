import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { JOBS, CANDIDATES, COMPANIES } from './careersData';

const C = { bg: '#ffffff', bg2: '#f8fafc', border: '#e2e8f0', text: '#0f172a', sub: '#64748b', blue: '#3b82f6', green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };
const S = {
  card: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 },
  btn: { border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: `${color}15`, color })
};

const Stars = ({ n }) => (
  <span style={{ color: C.amber, letterSpacing: 2, fontSize: 14 }}>
    {[1, 2, 3, 4, 5].map(i => <span key={i}>{i <= Math.round(n) ? '★' : '☆'}</span>)}
  </span>
);

export default function Careers({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('find_jobs');
  const [candidates, setCandidates] = useState(CANDIDATES);
  const [apiKey, setApiKey] = useState('');
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
      } catch (err) {
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
      if (!jdText.trim()) return alert('Please enter a JD');
      setCreatingJob(true);
      try {
        const res = await fetch('/api/careers/jobs/create-from-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jd_text: jdText, organization_id: user?.organization_id || 'default_org' })
        });
        if (res.ok) {
          alert('AI Hiring Engine configured successfully!');
          setJdText('');
          fetchJobs(); // refresh the job board
        } else {
          alert('Failed to start hiring');
        }
      } catch (e) {
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
          messages: [{ role: 'ai', content: 'Welcome to the interview.' }]
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
        if (res.ok) {
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
      } catch (err) { console.error(err); }
    };

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg2, fontFamily: 'system-ui, sans-serif', color: C.text }}>
        <Sidebar user={user} onLogout={onLogout} />
        <div style={{ flex: 1, marginLeft: 250 }}>
          {/* Header Tabs */}
          <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 40px', display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ padding: '20px 0', marginRight: 24 }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>Talent<span style={{ color: C.blue }}>OS</span></span>
            </div>
            {[
              { id: 'find_jobs', label: 'Find Jobs' },
              { id: 'talent_pool', label: 'Talent Pool' },
              { id: 'recruiter', label: 'Recruiter Dashboard' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: 'none', border: 'none', padding: '22px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  color: activeTab === t.id ? C.blue : C.sub,
                  borderBottom: activeTab === t.id ? `2px solid ${C.blue}` : '2px solid transparent'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: 40 }}>
            {activeTab === 'find_jobs' && <FindJobs />}
            {activeTab === 'talent_pool' && <TalentPool candidates={candidates} setCandidates={setCandidates} apiKey={apiKey} setApiKey={setApiKey} />}
            {activeTab === 'recruiter' && <RecruiterDashboard candidates={candidates} setCandidates={setCandidates} apiKey={apiKey} setApiKey={setApiKey} />}
          </div>
        </div>
      </div>
    );
  }

  // ── FIND JOBS ────────────────────────────────────────────────────────
  function FindJobs() {
    const [filter, setFilter] = useState('All');
    const [jdModal, setJdModal] = useState(null);
    const filters = ['All', 'Full-time', 'Remote', 'AI-ML', 'Engineering', 'Product'];
    const jobs = JOBS.filter(j => filter === 'All' || j.type === filter || j.category === filter);

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...S.btn, background: filter === f ? C.blue : C.bg, color: filter === f ? '#fff' : C.sub, border: `1px solid ${filter === f ? C.blue : C.border}` }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 40 }}>
          {jobs.map(job => (
            <div key={job.id} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${job.logoColor}15`, color: job.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>{job.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{job.title}</div>
                  <div style={{ color: C.sub, fontSize: 13 }}>{job.company}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.sub }}>
                {job.location} · {job.type} · <strong style={{ color: C.text }}>{job.salary}</strong>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {job.skills.map(s => <span key={s} style={S.badge(C.blue)}>{s}</span>)}
              </div>
              <div style={{ fontSize: 12, color: C.sub, display: 'flex', justifyContent: 'space-between' }}>
                <span>⭐ Min Rating: {job.minRating}</span>
                <span>👥 {job.applicants} applicants</span>
                <span>{job.postedDays}d ago</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button style={{ ...S.btn, flex: 1, background: C.blue, color: '#fff' }}>Quick Apply</button>
                <button onClick={() => setJdModal(job)} style={{ ...S.btn, flex: 1, background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>View JD</button>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Top Companies Hiring</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {COMPANIES.map(co => (
            <div key={co.name} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${co.color}15`, color: co.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>{co.logo}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{co.name}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{co.industry}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>
                  <Stars n={co.rating} /> · {co.openRoles} roles
                </div>
              </div>
            </div>
          ))}
        </div>

        {jdModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: C.bg, width: 600, maxHeight: '80vh', borderRadius: 12, padding: 32, overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ margin: '0 0 8px' }}>{jdModal.title}</h2>
                  <div style={{ color: C.sub }}>{jdModal.company} · {jdModal.location}</div>
                </div>
                <button onClick={() => setJdModal(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {jdModal.description}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── TALENT POOL ──────────────────────────────────────────────────────
  function TalentPool({ candidates, setCandidates, apiKey, setApiKey }) {
    const [search, setSearch] = useState('');
    const [activeProfile, setActiveProfile] = useState(null);

    const filtered = candidates.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase()));

    return (
      <div>
        <input
          placeholder="Search candidates by name or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 400, padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 24, fontSize: 14 }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => setActiveProfile(c)}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${c.color}15`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>{c.initials}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                  <div style={{ color: C.sub, fontSize: 13 }}>{c.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
                {c.company} · {c.location} · {c.experience}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {c.skills.slice(0, 4).map(s => <span key={s} style={S.badge(C.blue)}>{s}</span>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <div>
                  <Stars n={c.rating} /> <span style={{ color: C.sub }}>({c.peerRatings.length} reviews)</span>
                </div>
                <div style={{ fontWeight: 600, color: C.green }}>{c.expectedSalary}</div>
              </div>
            </div>
          ))}
        </div>

        {activeProfile && (
          <ProfileModal
            candidate={activeProfile}
            onClose={() => setActiveProfile(null)}
            onUpdate={(updated) => setCandidates(candidates.map(c => c.id === updated.id ? updated : c))}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </div>
    );
  }

  // ── PROFILE MODAL ────────────────────────────────────────────────────
  function ProfileModal({ candidate, onClose, onUpdate, apiKey, setApiKey }) {
    const [tab, setTab] = useState('overview');
    const [interviewing, setInterviewing] = useState(false);

    if (interviewing) {
      return <InterviewInterface candidate={candidate} onClose={() => setInterviewing(false)} onComplete={(score, rounds, finalResult) => {
        onUpdate({ ...candidate, interviewScore: score, interviewRounds: rounds, finalResult });
        setInterviewing(false);
      }} apiKey={apiKey} setApiKey={setApiKey} />;
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ background: C.bg, width: 800, height: '85vh', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 32, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${candidate.color}15`, color: candidate.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 32 }}>{candidate.initials}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 24 }}>{candidate.name}</h2>
              <div style={{ color: C.sub, fontSize: 15, marginBottom: 8 }}>{candidate.title} at {candidate.company}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: C.sub }}>
                <span>📍 {candidate.location}</span>
                <span>💼 {candidate.experience}</span>
                <span>🎓 {candidate.education.split('·')[1]?.trim()}</span>
                <span>💰 {candidate.expectedSalary}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: C.sub }}>×</button>
              <button onClick={() => setInterviewing(true)} style={{ ...S.btn, background: C.blue, color: '#fff' }}>
                Schedule AI Interview
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 32px' }}>
            {['overview', 'peer_ratings', 'interview_history'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: 'none', border: 'none', padding: '16px 0', marginRight: 32, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  color: tab === t ? C.blue : C.sub,
                  borderBottom: tab === t ? `2px solid ${C.blue}` : '2px solid transparent'
                }}
              >
                {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>

          <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
            {tab === 'overview' && (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>About</h3>
                <p style={{ lineHeight: 1.6, color: C.text, margin: '0 0 24px' }}>{candidate.about}</p>
                <h3 style={{ marginBottom: 12 }}>CV Summary</h3>
                <pre style={{ background: C.bg2, padding: 16, borderRadius: 8, fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.5, border: `1px solid ${C.border}` }}>
                  {candidate.cvSummary}
                </pre>
              </div>
            )}
            {tab === 'peer_ratings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {candidate.peerRatings.map(pr => (
                  <div key={pr.id} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{pr.reviewer} <span style={{ color: C.green, fontSize: 12, marginLeft: 8 }}>✓ Verified</span></div>
                        <div style={{ fontSize: 12, color: C.sub }}>{pr.role} at {pr.company} · <span style={S.badge(C.amber)}>{pr.type}</span></div>
                      </div>
                      <Stars n={pr.stars} />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: C.text }}>"{pr.review}"</p>
                  </div>
                ))}
              </div>
            )}
            {tab === 'interview_history' && (
              <div>
                {!candidate.interviewScore ? (
                  <div style={{ textAlign: 'center', padding: 40, color: C.sub }}>
                    No AI interview completed yet. <br /><br />
                    <button onClick={() => setInterviewing(true)} style={{ ...S.btn, background: C.bg2, color: C.text, border: `1px solid ${C.border}` }}>Start Interview Now</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ ...S.card, flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: C.blue }}>{candidate.interviewScore}%</div>
                        <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, textTransform: 'uppercase' }}>Overall Score</div>
                      </div>
                      <div style={{ ...S.card, flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: C.green }}>{candidate.finalResult?.communicationScore || 0}%</div>
                        <div style={{ fontSize: 12, color: C.sub }}>Communication</div>
                      </div>
                      <div style={{ ...S.card, flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: C.amber }}>{candidate.finalResult?.technicalScore || 0}%</div>
                        <div style={{ fontSize: 12, color: C.sub }}>Technical</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ ...S.card, flex: 1 }}>
                        <h4 style={{ margin: '0 0 12px' }}>Strengths</h4>
                        <ul style={{ paddingLeft: 20, margin: 0, color: C.green, fontSize: 13 }}>
                          {candidate.finalResult?.strengths?.map((s, i) => <li key={i}><span style={{ color: C.text }}>{s}</span></li>)}
                        </ul>
                      </div>
                      <div style={{ ...S.card, flex: 1 }}>
                        <h4 style={{ margin: '0 0 12px' }}>Areas to Probe</h4>
                        <ul style={{ paddingLeft: 20, margin: 0, color: C.amber, fontSize: 13 }}>
                          {candidate.finalResult?.gaps?.map((g, i) => <li key={i}><span style={{ color: C.text }}>{g}</span></li>)}
                        </ul>
                      </div>
                    </div>

                    <h3 style={{ marginBottom: 0 }}>Round Breakdown</h3>
                    {candidate.interviewRounds.map((r, i) => (
                      <div key={i} style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 8 }}>
                          <span>Round {r.round}: {r.name}</span>
                          <span style={{ color: C.blue }}>{r.score}%</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.text }}>{r.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RECRUITER DASHBOARD ──────────────────────────────────────────────
  function RecruiterDashboard({ candidates, setCandidates, apiKey, setApiKey }) {
    const interviewed = candidates.filter(c => c.interviewScore !== null);
    const pending = candidates.filter(c => c.interviewScore === null);
    const offers = interviewed.filter(c => c.interviewScore >= 75);

    const [activeProfile, setActiveProfile] = useState(null);

    const stats = [
      { label: 'Total Applicants', value: candidates.length },
      { label: 'Interviewed', value: interviewed.length },
      { label: 'Pending Review', value: pending.length },
      { label: 'Offers Ready', value: offers.length }
    ];

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {stats.map(s => (
            <div key={s.label} style={{ ...S.card, background: C.bg2, textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.blue, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 16 }}>Candidates Awaiting Interview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map(c => (
                <div key={c.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{c.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setActiveProfile(c)} style={{ ...S.btn, background: C.bg2, border: `1px solid ${C.border}`, color: C.text }}>View</button>
                  </div>
                </div>
              ))}
              {pending.length === 0 && <div style={{ color: C.sub, fontSize: 13 }}>No pending candidates.</div>}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 16 }}>Completed Interviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {interviewed.sort((a, b) => b.interviewScore - a.interviewScore).map(c => {
                const rec = c.interviewScore >= 75 ? { label: 'Strong Hire', color: C.green } : c.interviewScore >= 60 ? { label: 'Consider', color: C.amber } : { label: 'Not Recommended', color: C.red };
                return (
                  <div key={c.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: C.sub }}>Score: <strong style={{ color: C.blue }}>{c.interviewScore}%</strong></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={S.badge(rec.color)}>{rec.label}</span>
                      <button onClick={() => setActiveProfile(c)} style={{ ...S.btn, background: C.bg2, border: `1px solid ${C.border}`, color: C.text }}>View</button>
                    </div>
                  </div>
                );
              })}
              {interviewed.length === 0 && <div style={{ color: C.sub, fontSize: 13 }}>No completed interviews yet.</div>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40, padding: 24, background: C.bg2, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <h4 style={{ margin: '0 0 16px' }}>4-Step Autonomous Hiring Flow</h4>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: C.sub }}>
            <div style={{ flex: 1 }}><strong>1. Source</strong><br />Candidates apply via TalentPool or Jobs board.</div>
            <div style={{ flex: 1 }}><strong>2. Screen</strong><br />Peer ratings filter out low-performers automatically.</div>
            <div style={{ flex: 1 }}><strong>3. AI Interview</strong><br />Claude conducts technical and behavioural rounds.</div>
            <div style={{ flex: 1 }}><strong>4. Decide</strong><br />Review auto-generated scorecards and make offers.</div>
          </div>
        </div>

        {activeProfile && (
          <ProfileModal
            candidate={activeProfile}
            onClose={() => setActiveProfile(null)}
            onUpdate={(updated) => setCandidates(candidates.map(c => c.id === updated.id ? updated : c))}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </div>
    );
  }

  // ── AI INTERVIEW INTERFACE ───────────────────────────────────────────
  function InterviewInterface({ candidate, onClose, onComplete, apiKey, setApiKey }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [round, setRound] = useState(1); // 1: Behav, 2: Tech, 3: Case
    const [loading, setLoading] = useState(false);
    const [qCount, setQCount] = useState(0);
    const [roundResults, setRoundResults] = useState([]);
    const [scoring, setScoring] = useState(false);
    const [proctorLog, setProctorLog] = useState([]);
    const chatEndRef = useRef(null);
    const job = JOBS.find(j => j.id === candidate.appliedJobs[0]) || JOBS[0];

    const roundNames = { 1: 'Behavioural', 2: 'Technical', 3: 'Case Study / Situational' };

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
      // Proctoring simulation
      const iv = setInterval(() => {
        if (Math.random() < 0.05) {
          const events = ['Tab switch detected', 'Face not visible', 'Unusual typing pattern', 'Background noise detected'];
          setProctorLog(prev => [...prev, { time: new Date().toLocaleTimeString(), event: events[Math.floor(Math.random() * events.length)] }]);
        }
      }, 10000);
      return () => clearInterval(iv);
    }, []);

    const callClaude = async (systemPrompt, msgs, isJSON = false) => {
      if (!apiKey) {
        alert("Please enter API Key at the top.");
        return null;
      }
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: isJSON ? 600 : 400,
            system: systemPrompt,
            messages: msgs.map(m => ({ role: m.role, content: m.content }))
          })
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const data = await res.json();
        return data.content[0].text;
      } catch (e) {
        alert(e.message);
        return null;
      }
    };

    const startRound = async () => {
      setLoading(true);
      const sys = `You are an AI Interviewer for the role of ${job.title}.
Candidate CV Summary: ${candidate.cvSummary}
This is the ${roundNames[round]} round. You must ask exactly 1 question now to start the interview. Wait for the user's answer. Do not ask multiple questions at once.`;

      const reply = await callClaude(sys, [{ role: 'user', content: 'Hello, I am ready to start.' }]);
      if (reply) {
        setMessages([{ role: 'assistant', content: reply }]);
        setQCount(1);
      }
      setLoading(false);
    };

    const sendMessage = async () => {
      if (!input.trim() || loading) return;
      const newMsgs = [...messages, { role: 'user', content: input }];
      setMessages(newMsgs);
      setInput('');
      setLoading(true);

      if (input.toLowerCase() === 'end' || qCount >= 4) {
        // Score the round
        setScoring(true);
        const transcript = newMsgs.map(m => `${m.role}: ${m.content}`).join('\n');
        const sys = `Analyze this ${roundNames[round]} interview transcript for a ${job.title} role.
Return ONLY valid JSON: {"score": 0-100, "summary": "1 sentence summary"}`;

        const resText = await callClaude(sys, [{ role: 'user', content: transcript }], true);
        if (resText) {
          try {
            // Find json in the text
            const match = resText.match(/\{[\s\S]*\}/);
            const result = JSON.parse(match ? match[0] : resText);
            setRoundResults([...roundResults, { round, name: roundNames[round], score: result.score, summary: result.summary, transcript }]);
          } catch (e) {
            console.error("JSON parse error", resText);
            setRoundResults([...roundResults, { round, name: roundNames[round], score: 70, summary: "Completed round.", transcript }]);
          }
        }
        setMessages([]);
        setQCount(0);
        setScoring(false);
      } else {
        const sys = `You are an AI Interviewer for ${job.title} - ${roundNames[round]} round.
Acknowledge the candidate's last answer briefly, then ask the next question.
You have asked ${qCount} questions so far. Limit to 4 total questions.
If this is the 4th question, tell the candidate to type "end" to finish the round.`;
        const reply = await callClaude(sys, newMsgs);
        if (reply) {
          setMessages([...newMsgs, { role: 'assistant', content: reply }]);
          setQCount(qCount + 1);
        }
      }
      setLoading(false);
    };

    const finalizeInterview = async () => {
      setScoring(true);
      const fullTranscript = roundResults.map(r => `--- ${r.name} ---\n${r.transcript}`).join('\n\n');
      const sys = `Analyze the full interview across 3 rounds for ${job.title}.
Return ONLY valid JSON:
{
  "strengths": ["s1", "s2", "s3"],
  "gaps": ["g1", "g2"],
  "communicationScore": 85,
  "technicalScore": 75,
  "recommendation": "1 short paragraph recommendation"
}`;
      const resText = await callClaude(sys, [{ role: 'user', content: fullTranscript }], true);

      let finalResult = { strengths: ['Good communication'], gaps: ['Technical depth'], communicationScore: 80, technicalScore: 70, recommendation: 'Solid candidate.' };
      if (resText) {
        try {
          const match = resText.match(/\{[\s\S]*\}/);
          finalResult = JSON.parse(match ? match[0] : resText);
        } catch (e) { console.error(e); }
      }

      const avgScore = Math.round(roundResults.reduce((sum, r) => sum + r.score, 0) / roundResults.length);
      onComplete(avgScore, roundResults, finalResult);
      setScoring(false);
    };

    const isBetweenRounds = messages.length === 0 && !scoring;

    return (
      <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>AI Interview: {candidate.name}</h2>
            <div style={{ fontSize: 13, color: C.sub }}>Applying for {job.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <input
              type="password"
              placeholder="Anthropic API Key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, width: 250 }}
            />
            <button onClick={onClose} style={{ ...S.btn, background: C.bg2, border: `1px solid ${C.border}` }}>Cancel Interview</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex' }}>
          {/* Main Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}` }}>

            {isBetweenRounds ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                {roundResults.length > 0 && (
                  <div style={{ ...S.card, width: 500, marginBottom: 32 }}>
                    <h3 style={{ marginTop: 0 }}>Round {roundResults.length} Results</h3>
                    <div style={{ fontSize: 32, fontWeight: 800, color: C.blue, marginBottom: 8 }}>{roundResults[roundResults.length - 1].score}%</div>
                    <p style={{ margin: 0, color: C.sub, lineHeight: 1.5 }}>{roundResults[roundResults.length - 1].summary}</p>
                  </div>
                )}

                {round <= 3 ? (
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 8 }}>Ready for Round {round}: {roundNames[round]}</h2>
                    <p style={{ color: C.sub, marginBottom: 24 }}>The AI will ask up to 4 questions. Type "end" when you are finished.</p>
                    <button onClick={startRound} disabled={loading} style={{ ...S.btn, background: C.blue, color: '#fff', fontSize: 16, padding: '12px 32px' }}>
                      {loading ? 'Connecting...' : 'Start Round'}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <h2>All Rounds Completed</h2>
                    <p style={{ color: C.sub, marginBottom: 24 }}>Generating final scorecard and recommendations.</p>
                    <button onClick={finalizeInterview} disabled={loading} style={{ ...S.btn, background: C.green, color: '#fff', fontSize: 16, padding: '12px 32px' }}>
                      {loading ? 'Analysing...' : 'View Final Results'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ flex: 1, padding: 32, overflowY: 'auto', background: C.bg2 }}>
                  {scoring && <div style={{ textAlign: 'center', padding: 20, color: C.sub }}>AI is analysing the transcript and generating scores...</div>}
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 24 }}>
                      <div style={{
                        maxWidth: '70%',
                        background: m.role === 'user' ? C.blue : C.bg,
                        color: m.role === 'user' ? '#fff' : C.text,
                        padding: '16px 20px',
                        borderRadius: 12,
                        border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, marginBottom: 4 }}>
                          {m.role === 'user' ? candidate.name : 'AI Interviewer'}
                        </div>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && !scoring && <div style={{ color: C.sub, fontSize: 13, marginLeft: 16 }}>AI is typing...</div>}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: 24, background: C.bg, borderTop: `1px solid ${C.border}` }}>
                  <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 12 }}>
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      disabled={loading || scoring}
                      placeholder="Type your answer here..."
                      style={{ flex: 1, padding: '16px 20px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 15 }}
                    />
                    <button type="submit" disabled={loading || scoring || !input.trim()} style={{ ...S.btn, background: C.blue, color: '#fff', padding: '0 32px' }}>
                      Send
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar - Status & Proctoring */}
          <div style={{ width: 320, background: C.bg2, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', color: C.sub }}>Interview Status</h3>

            <div style={{ ...S.card, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>Current Stage</div>
              <div style={{ fontWeight: 600 }}>Round {round}: {roundNames[round] || 'Completed'}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 12, marginBottom: 4 }}>Questions Asked</div>
              <div style={{ fontWeight: 600 }}>{qCount} / 4</div>
            </div>

            <h3 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', color: C.sub }}>Live Proctoring</h3>
            <div style={{ ...S.card, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.green, fontSize: 13, fontWeight: 600, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block' }}></span>
                Active & Monitoring
              </div>
              {proctorLog.length === 0 ? (
                <div style={{ color: C.sub, fontSize: 12 }}>No suspicious activity detected.</div>
              ) : (
                proctorLog.map((log, i) => (
                  <div key={i} style={{ fontSize: 12 }}>
                    <div style={{ color: C.amber, fontWeight: 600 }}>{log.event}</div>
                    <div style={{ color: C.sub, fontSize: 11 }}>{log.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
