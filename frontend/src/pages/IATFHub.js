import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
  ShieldCheck, Zap, BarChart3, Users, Calendar, Award, 
  Plus, CheckCircle, XCircle, Clock, Eye, Send, 
  AlertCircle, ChevronRight, FileText, TrendingUp, FolderKanban,
  Download, Filter, Search, Info, Settings, UserCheck
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IATF_MODULES = [
  { id: 'audit_dashboard', label: 'Compliance Audit', icon: ShieldCheck, tcode: 'AUTO' },
  { id: 'turtle_diagram', label: 'Turtle Diagrams', icon: BarChart3, tcode: 'M03' },
  { id: 'skill_matrix', label: 'Skill Matrix', icon: BarChart3, tcode: 'M17' },
  { id: 'kaizen_suggestion', label: 'Kaizen Submissions', icon: Zap, tcode: 'M07' },
  { id: 'training_calendar', label: 'Training Calendar', icon: Calendar, tcode: 'M06' },
  { id: 'training_history', label: 'Training History Cards', icon: FileText, tcode: 'M11' },
  { id: 'competence_matrix', label: 'Competence Matrix', icon: Award, tcode: 'M18' },
  { id: 'ojt_records', label: 'OJT Records', icon: Clock, tcode: 'M14' },
  { id: 'responsibility_matrix', label: 'Responsibility Matrix', icon: Users, tcode: 'M19' },
];

const IATFHub = ({ user, onLogout, isSubComponent }) => {
  const [activeModule, setActiveModule] = useState('skill_matrix');
  const [data, setData] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (activeModule === 'audit_dashboard') {
        res = await axios.get(`${API}/iatf/gap-analysis`, authHeader());
      } else {
        res = await axios.get(`${API}/iatf/module/${activeModule}`, authHeader());
      }
      setData(res.data);
    } catch (err) {
      console.error(err);
      setData([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setData([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]); // Clear old data for new module
    fetchData(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (recordId) => {
    try {
      await axios.patch(`${API}/iatf/module/${activeModule}/${recordId}/approve`, {}, authHeader());
      showToast('Document Approved & Activated');
      fetchData();
    } catch (err) {
      showToast('Approval Failed', 'error');
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IATF_${activeModule}_Export.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const renderModuleContent = () => {
    const filteredData = data.filter(item => 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch(activeModule) {
      case 'audit_dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/3 border border-red-500/20 p-8 rounded-3xl relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                 <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Critical Gaps</p>
                 <p className="text-4xl font-black text-white">{data?.summary?.critical_count || 0}</p>
                 <p className="text-xs text-white/30 mt-4 leading-relaxed">Immediate action required for Clause 7.2 compliance.</p>
              </div>
              <div className="bg-white/3 border border-indigo-500/20 p-8 rounded-3xl">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total Findings</p>
                 <p className="text-4xl font-black text-white">{data?.summary?.total_gaps || 0}</p>
                 <p className="text-xs text-white/30 mt-4 leading-relaxed">Process improvements identified during automated audit.</p>
              </div>
              <div className="bg-white/3 border border-emerald-500/20 p-8 rounded-3xl">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Last Sync</p>
                 <p className="text-xl font-black text-white">
                   {data?.summary?.last_audit ? new Date(data.summary.last_audit).toLocaleTimeString() : 'Pending Sync...'}
                 </p>
                 <p className="text-xs text-white/30 mt-4 leading-relaxed">Continuous monitoring engine is active.</p>
              </div>
            </div>

            <div className="bg-white/2 border border-white/5 rounded-3xl overflow-hidden">
               <div className="p-6 border-b border-white/5 bg-white/3 font-black text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                 <span>Gap Description</span>
                 <span>Severity</span>
               </div>
               <div className="divide-y divide-white/5">
                 {data?.gaps?.map((gap, i) => (
                   <div key={i} className="p-6 flex justify-between items-center group hover:bg-white/2">
                     <div className="flex items-center gap-6">
                        <div className={`p-3 rounded-xl ${gap.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                           <AlertCircle size={20} />
                        </div>
                        <div>
                          <p className="text-white font-bold mb-1">{gap.module}: {gap.gap_type}</p>
                          <p className="text-xs text-white/40">{gap.description}</p>
                        </div>
                     </div>
                     <button onClick={() => showToast("Gap resolution initiated. CAPA raised.", "success")} className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-indigo-500/30">Initiate CAPA</button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        );

      case 'turtle_diagram':
        return (
          <div className="grid grid-cols-1 gap-6">
            {filteredData.map(item => (
              <div key={item.id} className="iatf-card" style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px' }}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{item.process_name}</h3>
                    <p className="text-xs text-blue-400 font-mono">IATF Process Approach · v{item.metadata?.version || '1.0'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.metadata?.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {item.metadata?.status || 'draft'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Inputs</p>
                      <ul className="text-sm text-white/70 list-disc pl-4 space-y-1">
                        {item.inputs?.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Personnel (With Whom?)</p>
                      <ul className="text-sm text-white/70 list-disc pl-4 space-y-1">
                        {item.personnel?.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Methods (How?)</p>
                      <ul className="text-sm text-white/70 list-disc pl-4 space-y-1">
                        {item.methods?.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Resources (With What?)</p>
                      <ul className="text-sm text-white/70 list-disc pl-4 space-y-1">
                        {item.resources?.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-green-400 uppercase mb-2">Outputs</p>
                      <ul className="text-sm text-white/70 list-disc pl-4 space-y-1">
                        {item.outputs?.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-amber-400 uppercase mb-2">KPIs (How Many?)</p>
                      <ul className="text-sm text-white/70 list-disc pl-4 space-y-1">
                        {item.kpis?.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'skill_matrix':
        return (
          <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[11px] font-bold tracking-widest text-white/40 uppercase">
                  <th className="p-6">Employee ID</th>
                  {data[0]?.skills?.map(s => <th key={s.skill} className="p-6 text-center">{s.skill}</th>)}
                  <th className="p-6 text-center">Avg/Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-6 font-bold text-white">{item.employee_id}</td>
                    {item.skills.map(s => (
                      <td key={s.skill} className="p-6">
                        <div className="flex justify-center">
                          <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm border-2
                            ${s.level >= 4 ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 
                              s.level === 3 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 
                              s.level === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 
                              'bg-slate-500/20 text-slate-400 border-slate-500/40'}`}>
                            {s.level}
                          </div>
                        </div>
                      </td>
                    ))}
                    <td className="p-6">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-emerald-400 font-bold">{(item.skills.reduce((acc,s)=>acc+s.level,0)/item.skills.length).toFixed(1)}</span>
                        <span className="text-[9px] uppercase text-white/20 font-bold">{item.metadata.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'kaizen_suggestion':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Total Kaizens', value: filteredData.length, color: '#6366f1' },
                { label: 'Implemented', value: filteredData.filter(k => k.status === 'implemented').length, color: '#10b981' },
                { label: 'Est. Savings', value: `₹${(filteredData.reduce((acc, k) => acc + (k.savings_estimated || 0), 0) / 1000).toFixed(1)}K`, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="bg-white/3 border border-white/10 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className="text-3xl font-black text-white" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {filteredData.map(k => (
                <div key={k.id} className="bg-white/3 border border-white/10 p-6 rounded-2xl flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Zap size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-white font-bold">{k.theme}</h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${k.status === 'implemented' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/10 text-white/40 border-white/10'}`}>
                        {k.status}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs line-clamp-1">{k.problem_description}</p>
                    <div className="flex gap-4 mt-2">
                       <p className="text-[10px] text-white/20 font-bold uppercase">{k.employee_id}</p>
                       {k.savings_estimated > 0 && <p className="text-[10px] text-amber-500/60 font-bold uppercase">Savings: ₹{k.savings_estimated}</p>}
                    </div>
                  </div>
                  <button onClick={() => fetchData()} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
                    <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'training_calendar':
        return (
          <div className="space-y-6">
            {filteredData.map(cal => (
              <div key={cal.id} className="bg-white/3 border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Calendar Year {cal.year}</h3>
                  <button onClick={() => handleApprove(cal.id)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20">
                    Audit Finalize
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cal.programs.map((p, idx) => (
                    <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-default group">
                      <p className="text-indigo-400 text-[10px] font-black uppercase mb-3 tracking-widest">{p.month}</p>
                      <h4 className="text-white font-bold text-sm mb-2 leading-tight group-hover:text-indigo-300 transition-colors">{p.topic}</h4>
                      <p className="text-white/40 text-[11px] mb-4">Audience: {p.target_audience}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                          {p.status}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono italic">{p.trainer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )

      case 'competence_matrix':
        return (
          <div className="space-y-8">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl">
              <div className="flex gap-4 items-center">
                <Info size={24} className="text-indigo-400" />
                <p className="text-sm text-white/70 italic">
                  <strong>Clause 7.2 Mapping:</strong> This matrix compares <strong>Required Competence</strong> (defined in Job Descriptions) against <strong>Actual Skills</strong> (validated via Training Records).
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { role: 'Quality Inspector', req: 'Diploma/BE', skills: [{s: 'SPC', l: 3}, {s: 'Drawing', l: 4}, {s: 'Micrometer', l: 4}], color: '#818cf8' },
                { role: 'Machine Operator', req: 'ITI/10th', skills: [{s: 'Set-up', l: 2}, {s: 'Safety', l: 4}, {s: '5S', l: 3}], color: '#10b981' },
                { role: 'HR Admin', req: 'MBA/MSW', skills: [{s: 'Payroll', l: 4}, {s: 'Compliance', l: 3}, {s: 'Audit', l: 3}], color: '#f59e0b' },
              ].map((role, idx) => (
                <div key={idx} className="bg-white/3 border border-white/10 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg mb-1">{role.role}</h4>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Min. Education: <span className="text-white/60">{role.req}</span></p>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 w-full lg:w-auto">
                    {role.skills.map((s, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-xl min-w-[100px] text-center">
                        <p className="text-[9px] text-white/30 uppercase font-bold mb-1">{s.s}</p>
                        <p className="text-white text-md font-black">Level {s.l}</p>
                      </div>
                    ))}
                  </div>
                  <button className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white tracking-widest transition-all">
                    Link to JD
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ojt_records':
        return (
          <div className="bg-white/3 border border-white/10 rounded-3xl p-8">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-bold text-white uppercase tracking-tighter">On-Job Training Tracker</h3>
               <button className="p-4 bg-indigo-600 rounded-2xl text-white text-[10px] font-black uppercase flex items-center gap-2">
                 <Plus size={14} /> New OJT Log
               </button>
             </div>
             <div className="grid grid-cols-1 gap-4">
                {data?.map(record => (
                  <div key={record.id} className="bg-white/3 border border-white/5 p-6 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-bold">{record.topic}</h4>
                      <p className="text-xs text-white/40">Employee: {record.employee_id} · {record.hours_completed} Hours</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                         <p className="text-[10px] text-white/20 uppercase font-black">Trainer Sign-off</p>
                         <p className="text-emerald-400 text-xs font-mono italic font-bold tracking-tight">VERIFIED: {record.trainer_id}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                         <CheckCircle size={20} />
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        );

      case 'responsibility_matrix':
        return (
          <div className="bg-white/3 border border-white/10 rounded-3xl overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                 <tr>
                    <th className="p-6">IATF Clause</th>
                    <th className="p-6">Responsibility Description</th>
                    <th className="p-6">Accountable Role</th>
                    <th className="p-6 text-center">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {data[0]?.clauses?.map((c, i) => (
                   <tr key={i} className="hover:bg-white/2">
                     <td className="p-6 font-mono text-indigo-400 text-xs">{c.iatf_clause}</td>
                     <td className="p-6 text-white text-sm font-medium">{c.responsibility}</td>
                     <td className="p-6 text-white/70 text-xs">{c.role}</td>
                     <td className="p-6 flex justify-center">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] uppercase font-black">Verified</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        );

      case 'training_history':
        return (
          <div className="space-y-8">
            <style>
              {`
                @media print {
                  .no-print { display: none !important; }
                  .print-only { display: block !important; }
                  .iatf-print-card {
                    background: white !important;
                    color: black !important;
                    padding: 40px !important;
                    border: 2px solid black !important;
                  }
                  body { background: white !important; }
                }
              `}
            </style>
            
            <div className="no-print bg-white/3 border border-white/10 rounded-3xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white">Employee Training History Search</h3>
                <p className="text-xs text-white/40 font-mono italic">Select employee to generate IATF F11 Format</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['EMP001 - Rahul Sharma', 'EMP042 - Sneha Patil', 'EMP105 - Amit Kumar'].map((emp, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {emp[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm mb-1">{emp}</h4>
                        <p className="text-[10px] text-white/40 uppercase font-black">7 Training Records Found</p>
                      </div>
                      <button onClick={() => { showToast("Generating F11 Report for " + emp, "success"); setTimeout(() => window.print(), 500); }} className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-600/20">
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template for Print View */}
            <div className="print-only iatf-print-card hidden bg-white text-black p-10 border-4 border-black font-sans">
                <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Training History Card</h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Document No: IATF/F/11 · Rev 03</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black italic">PRSK LOGISTICS</h2>
                    <p className="text-[10px] font-bold">16949:2016 CERTIFIED COMPANY</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 border border-black p-4">
                   <p className="text-xs"><strong>Employee Name:</strong> Amit Kumar</p>
                   <p className="text-xs"><strong>Employee ID:</strong> EMP105</p>
                   <p className="text-xs"><strong>Designation:</strong> QA Auditor</p>
                   <p className="text-xs"><strong>Department:</strong> Quality Assurance</p>
                </div>

                <table className="w-full border-collapse border border-black mb-10">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-black p-2 text-[10px] uppercase font-black">Date</th>
                      <th className="border border-black p-2 text-[10px] uppercase font-black">Training Topic</th>
                      <th className="border border-black p-2 text-[10px] uppercase font-black">Trainer</th>
                      <th className="border border-black p-2 text-[10px] uppercase font-black">Rating (1-5)</th>
                      <th className="border border-black p-2 text-[10px] uppercase font-black">Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {d: '2026-01-15', t: 'Quality Policy Awareness', tr: 'Internal', r: '4', e: 'Satisfactory'},
                      {d: '2026-02-10', t: 'Kaizen & 5S Methodology', tr: 'External', r: '5', e: 'Highly Effective'},
                      {d: '2026-03-05', t: 'ISO 45001 Safety', tr: 'Internal', r: '4', e: 'Effective'},
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="border border-black p-2 text-[10px]">{row.d}</td>
                        <td className="border border-black p-2 text-[10px] font-bold italic">{row.t}</td>
                        <td className="border border-black p-2 text-[10px]">{row.tr}</td>
                        <td className="border border-black p-2 text-[10px] text-center font-black">{row.r}</td>
                        <td className="border border-black p-2 text-[10px]">{row.e}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center mt-20">
                  <div className="text-center w-40">
                    <div className="border-t border-black pt-2 text-[9px] font-bold uppercase">Employee's Sign</div>
                  </div>
                  <div className="text-center w-40">
                    <div className="border-t border-black pt-2 text-[9px] font-bold uppercase">Section Head Sign</div>
                  </div>
                  <div className="text-center w-40">
                    <div className="border-t border-black pt-2 text-[9px] font-bold uppercase">HR Authorized Sign</div>
                  </div>
                </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-40 bg-white/2 rounded-3xl border border-dashed border-white/10">
            <Info size={48} className="text-white/10 mb-6" />
            <p className="text-white/30 text-lg font-medium italic">Content for {activeModule} module is currently in development.</p>
            <p className="text-white/10 text-sm">Please select an active module from the sidebar.</p>
          </div>
        );
    }
  };


  const pageContent = (
    <div style={{ flex: 1, overflowY: 'auto' }} className={isSubComponent ? "p-0" : "p-8 lg:p-12"}>
      <div className="max-w-7xl mx-auto">

        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40">
              <ShieldCheck size={32} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-1">IATF COMPLIANCE ENGINE</h1>
              <p className="text-blue-400/60 text-sm font-medium tracking-wide uppercase italic">Centralized Digital Audit Repository · ISO 9001:2015 / IATF 16949</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={exportToCSV} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center gap-3 group">
              <Download size={18} className="group-hover:translate-y-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Master Export</span>
            </button>
            <button className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl border border-indigo-500/20 transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/30">
              <Plus size={18} />
              <span className="text-xs font-black uppercase tracking-widest">New Document</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Compliance Navigation */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6 pl-2">Compliance Tracks</p>
            {IATF_MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`w-full group flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
                  ${activeModule === m.id ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/30' : 'bg-white/3 border-white/5 hover:border-white/20'}`}
              >
                <m.icon size={20} className={activeModule === m.id ? 'text-white' : 'text-indigo-400'} />
                <div className="text-left flex-1">
                  <p className={`text-[13px] font-black tracking-tight ${activeModule === m.id ? 'text-white' : 'text-white/80'}`}>{m.label}</p>
                  <p className={`text-[10px] font-mono ${activeModule === m.id ? 'text-white/60' : 'text-white/20'}`}>T-Code: {m.tcode}</p>
                </div>
                <ChevronRight size={14} className={`transition-transform duration-300 ${activeModule === m.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`} />
                {activeModule === m.id && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />}
              </button>
            ))}
          </div>

          <div className="col-span-1 lg:col-span-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white/3 p-4 rounded-3xl border border-white/5 mb-8">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  type="text"
                  placeholder={`Search ${activeModule.replace('_', ' ')}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border-none rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>
              <div className="flex items-center gap-4 px-4 text-xs font-mono text-white/40">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Link Active</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center animate-pulse">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                   </div>
                </div>
              ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white/2 border border-dashed border-white/10 rounded-3xl">
                   <FolderKanban size={48} className="text-white/10 mb-4" />
                   <p className="text-white/40 text-sm font-medium">No compliance records found for this module.</p>
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  {renderModuleContent()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 right-12 z-50 animate-in slide-in-from-right-12">
          <div className={`flex items-center gap-4 px-8 py-5 rounded-3xl shadow-2xl border
            ${toast.type === 'error' ? 'bg-red-500 border-red-400 text-white' : 'bg-emerald-500 border-emerald-400 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
            <span className="font-black text-sm uppercase tracking-wider">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );

  if (isSubComponent) return pageContent;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05070f', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {pageContent}
    </div>
  );
};

export default IATFHub;
