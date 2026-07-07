import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Activity, AlertTriangle, MessageSquare, Map as MapIcon, TrendingUp, Download, Sparkles, AlertCircle, X } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [rankedProjects, setRankedProjects] = useState<any[]>([]);
  const [digest, setDigest] = useState<string>('Analyzing recent trends...');
  const [activeTab, setActiveTab] = useState<'ranking' | 'feed' | 'map' | 'trends'>('ranking');
  const [budget, setBudget] = useState<number>(50000000); // Default 5 Crore
  const [actionPlan, setActionPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();

    const apiUrl = import.meta.env.VITE_API_URL || 'https://peoples-priorities-backend-ejsprvcwza-el.a.run.app';
    const socket = io(apiUrl);
    socket.on('new_submission', (sub) => {
      setSubmissions(prev => [sub, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const apiUrl = import.meta.env.VITE_API_URL || 'https://peoples-priorities-backend-ejsprvcwza-el.a.run.app';
      
      const [subsRes, rankRes, digestRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/submissions`, { headers }),
        fetch(`${apiUrl}/api/admin/ranking`, { headers }),
        fetch(`${apiUrl}/api/admin/digest`, { headers })
      ]);
      
      if (subsRes.ok) setSubmissions(await subsRes.json());
      if (rankRes.ok) setRankedProjects(await rankRes.json());
      if (digestRes.ok) {
        const { digest } = await digestRes.json();
        setDigest(digest);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGeneratePlan = async (project: any) => {
    setIsGeneratingPlan(project._id);
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const apiUrl = import.meta.env.VITE_API_URL || 'https://peoples-priorities-backend-ejsprvcwza-el.a.run.app';
      
      const res = await fetch(`${apiUrl}/api/admin/action-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectName: project.projectName,
          category: project.category,
          justification: project.justification
        })
      });
      
      if (res.ok) {
        const plan = await res.json();
        setActionPlan({ ...plan, projectName: project.projectName });
      }
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingPlan(null);
  };

  const exportCSV = () => {
    const headers = ["ID", "Timestamp", "Ward", "Category", "Theme", "Urgency", "Original Text", "Translated Text"];
    const rows = submissions.map(s => [
      s._id,
      new Date(s.timestamp || Date.now()).toISOString(),
      s.wardNumber,
      s.category,
      s.aiExtractedTheme,
      s.aiUrgencyScore,
      `"${(s.originalText || '').replace(/"/g, '""')}"`,
      `"${(s.translatedText || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "submissions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // 📊 DATA PROCESSING & SEMANTIC CLUSTERING
  // ==========================================
  // Process data for charts & clustering
  const themeCounts = submissions.reduce((acc, sub) => {
    const theme = sub.aiExtractedTheme || 'Other';
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.keys(themeCounts).map(key => ({ name: key, count: themeCounts[key] })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Group similar submissions
  // Hackathon Feature: Instead of showing 10 identical complaints, we semantically group them
  // based on the AI-extracted theme and Ward number.
  const clusteredFeed = Object.values(submissions.reduce((acc, sub) => {
    const key = `${sub.wardNumber}-${sub.aiExtractedTheme}`;
    if (!acc[key]) acc[key] = { ...sub, count: 0 };
    acc[key].count++;
    // Keep the most recent timestamp
    if (new Date(sub.timestamp) > new Date(acc[key].timestamp)) {
      acc[key].timestamp = sub.timestamp;
      acc[key].translatedText = sub.translatedText; // latest text
    }
    return acc;
  }, {})).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Trend Data for 30 days
  const trendData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const subsOnDay = submissions.filter(s => new Date(s.timestamp).toDateString() === d.toDateString());
    const avgUrg = subsOnDay.length ? subsOnDay.reduce((sum, s) => sum + s.aiUrgencyScore, 0) / subsOnDay.length : 0;
    trendData.push({ date: dateStr, volume: subsOnDay.length, urgency: parseFloat(avgUrg.toFixed(1)) });
  }

  // ==========================================
  // 💰 BUDGET SIMULATOR LOGIC
  // Dynamically subtracts project costs from the user's input budget
  // ==========================================
  let remainingBudget = budget;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 text-slate-800">
      <div className="max-w-7xl mx-auto relative">
        
        {/* Action Plan Modal */}
        {actionPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setActionPlan(null)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition"><X size={20}/></button>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full"><Sparkles size={24}/></div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800">AI Action Plan</h2>
                  <p className="text-slate-500 font-medium">{actionPlan.projectName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/60 border border-slate-200 p-4 rounded-2xl">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Est. Budget</p>
                  <p className="text-lg font-bold text-slate-800">{actionPlan.budgetEstimate}</p>
                </div>
                <div className="bg-white/60 border border-slate-200 p-4 rounded-2xl">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Timeline</p>
                  <p className="text-lg font-bold text-slate-800">{actionPlan.estimatedTimeline}</p>
                </div>
              </div>
              <div className="space-y-4">
                {actionPlan.steps?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm z-10">{i + 1}</div>
                      {i !== actionPlan.steps.length - 1 && <div className="w-0.5 h-full bg-indigo-100 mt-2"></div>}
                    </div>
                    <div className="pb-4">
                      <h4 className="font-bold text-slate-800">{step.title}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            AI EXECUTIVE DIGEST
            Hackathon Feature: Generates a natural language summary
            of the last 7 days of complaints vs the previous 30 days.
            ========================================== */}
        <div className="glass-panel p-6 rounded-3xl mb-8 flex items-start gap-4 border-l-4 border-l-indigo-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={100} />
          </div>
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100 shrink-0 mt-1">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 mb-2">AI Executive Digest &mdash; What Changed Since Last Week</h3>
            <p className="text-lg font-medium text-slate-700 leading-relaxed">{digest}</p>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-3xl flex items-center transform transition duration-300 hover:scale-[1.02]">
            <div className="bg-indigo-500/10 p-4 rounded-2xl mr-5 border border-indigo-500/20">
              <MessageSquare className="text-indigo-600 w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Submissions</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{submissions.length}</h3>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-3xl flex items-center transform transition duration-300 hover:scale-[1.02]">
            <div className="bg-orange-500/10 p-4 rounded-2xl mr-5 border border-orange-500/20">
              <AlertTriangle className="text-orange-500 w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">High Urgency</p>
              <h3 className="text-3xl font-extrabold text-slate-800">
                {submissions.filter(s => s.aiUrgencyScore >= 4).length}
              </h3>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-3xl flex items-center md:col-span-2">
            <div className="w-full h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', color: '#1e293b' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/60 bg-white/30 px-2 pt-2 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveTab('ranking')}
              className={`px-8 py-5 font-bold text-sm flex items-center gap-3 rounded-t-2xl transition duration-300 whitespace-nowrap ${activeTab === 'ranking' ? 'bg-indigo-500/10 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 border-b-2 border-transparent'}`}
            >
              <Activity size={20} /> Priority Ranking Engine
            </button>
            <button 
              onClick={() => setActiveTab('feed')}
              className={`px-8 py-5 font-bold text-sm flex items-center gap-3 rounded-t-2xl transition duration-300 whitespace-nowrap ${activeTab === 'feed' ? 'bg-indigo-500/10 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 border-b-2 border-transparent'}`}
            >
              <MessageSquare size={20} /> Live Feed & Clusters
            </button>
            <button 
              onClick={() => setActiveTab('trends')}
              className={`px-8 py-5 font-bold text-sm flex items-center gap-3 rounded-t-2xl transition duration-300 whitespace-nowrap ${activeTab === 'trends' ? 'bg-indigo-500/10 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 border-b-2 border-transparent'}`}
            >
              <TrendingUp size={20} /> Trend Analysis
            </button>
            <button 
              onClick={() => setActiveTab('map')}
              className={`px-8 py-5 font-bold text-sm flex items-center gap-3 rounded-t-2xl transition duration-300 whitespace-nowrap ${activeTab === 'map' ? 'bg-indigo-500/10 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 border-b-2 border-transparent'}`}
            >
              <MapIcon size={20} /> Demand Hotspots
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'ranking' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 border border-slate-200 p-6 rounded-2xl">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-lg">Constituency Budget Simulator</h4>
                    <p className="text-sm text-slate-500 font-medium">Input your available budget to see what gets funded.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-600">₹</span>
                    <input 
                      type="number" 
                      className="glass-input rounded-xl px-4 py-3 w-48 font-bold text-lg"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      step={1000000}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/40 text-slate-500 text-xs uppercase tracking-widest border-b border-white/60">
                        <th className="p-5 font-bold rounded-tl-2xl w-16">Rank</th>
                        <th className="p-5 font-bold">Project / Issue</th>
                        <th className="p-5 font-bold w-48 text-right">Estimated Cost</th>
                        <th className="p-5 font-bold text-center">Score</th>
                        <th className="p-5 font-bold rounded-tr-2xl w-32 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedProjects.map((project, index) => {
                        const isFunded = remainingBudget >= (project.estimatedCost || 0);
                        if (isFunded) remainingBudget -= (project.estimatedCost || 0);
                        
                        return (
                          <tr key={project._id} className={`border-b border-slate-200/50 hover:bg-white/60 transition duration-300 ${!isFunded ? 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0' : ''}`}>
                            <td className="p-5">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${index === 0 ? 'bg-indigo-600 text-white shadow-[0_4px_10px_rgba(79,70,229,0.3)]' : index < 3 ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white/80 border border-slate-200 text-slate-500'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="p-5">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                      {project.projectName}
                                      {isFunded ? 
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-widest">Funded</span> : 
                                        <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full border border-slate-300 uppercase tracking-widest">Deferred</span>
                                      }
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">{project.category}</span>
                                      <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">Ward {project.wardNumber}</span>
                                    </div>
                                  </div>
                                </div>
                                {project.clashDetected && (
                                  <div className="mt-2 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex gap-3 items-start">
                                    <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 font-medium leading-relaxed">{project.clashDetected}</p>
                                  </div>
                                )}
                                <p className="text-sm text-slate-500 mt-2">{project.justification}</p>
                              </div>
                            </td>
                            <td className="p-5 text-right font-bold text-slate-700">
                              ₹ {(project.estimatedCost || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-5">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{project.compositeScore}</span>
                              </div>
                              <div className="flex text-[10px] font-bold text-slate-400 justify-center gap-2 mt-1">
                                <span>R: {project.demandCount}</span>
                                <span>D: {project.dataNeedScore}</span>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <button 
                                onClick={() => handleGeneratePlan(project)}
                                disabled={isGeneratingPlan === project._id}
                                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl shadow-sm transition flex items-center justify-center w-full disabled:opacity-50 disabled:animate-pulse"
                                title="Generate Action Plan"
                              >
                                {isGeneratingPlan === project._id ? <Activity size={20}/> : <Sparkles size={20} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'feed' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-3">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                      </span>
                      Live Semantic Clusters
                    </h3>
                    <button 
                      onClick={exportCSV}
                      className="flex items-center gap-2 bg-white/60 hover:bg-white text-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 shadow-sm transition"
                    >
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                    {clusteredFeed.map((sub: any, i) => (
                      <div key={sub._id || i} className="bg-white/60 border border-white/80 rounded-2xl p-6 shadow-sm hover:bg-white/80 transition duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-3 py-1 rounded-full font-bold">Ward {sub.wardNumber}</span>
                            {sub.count > 1 && (
                              <span className="bg-orange-100 text-orange-700 border border-orange-200 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                +{sub.count - 1} similar reports
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{new Date(sub.timestamp || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-800 text-lg font-medium leading-relaxed mb-4">"{sub.translatedText}"</p>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/50">
                          <div className="flex gap-3">
                            <span className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full font-bold border border-purple-100">
                              {sub.aiExtractedTheme}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${sub.aiUrgencyScore >= 4 ? 'bg-red-50 text-red-700 border-red-100 shadow-sm' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                              Max Urgency: {sub.aiUrgencyScore}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/60 rounded-3xl p-6 border border-white/80 h-fit backdrop-blur-sm shadow-sm">
                  <h3 className="font-extrabold text-xl text-slate-800 mb-6">Theme Clusters</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: -20, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis type="number" stroke="rgba(0,0,0,0.3)" />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: 'rgba(0,0,0,0.6)'}} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', color: '#1e293b' }} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-8">
                <h3 className="font-extrabold text-2xl text-slate-800 mb-6">30-Day Trend Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/60 p-6 rounded-3xl border border-white/80 shadow-sm">
                    <h4 className="font-bold text-slate-600 mb-6 text-sm uppercase tracking-wider">Submission Volume</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white/60 p-6 rounded-3xl border border-white/80 shadow-sm">
                    <h4 className="font-bold text-slate-600 mb-6 text-sm uppercase tracking-wider">Average Urgency Score</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} />
                        <YAxis domain={[0, 5]} tick={{fontSize: 12, fill: '#64748b'}} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        <Line type="monotone" dataKey="urgency" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 0}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-white/60 relative z-0 shadow-lg">
                <MapContainer center={[28.61, 77.20]} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {submissions.filter(s => s.geolocation?.lat).map((sub, i) => (
                    <CircleMarker 
                      key={i} 
                      center={[sub.geolocation.lat, sub.geolocation.lng]}
                      radius={sub.aiUrgencyScore >= 4 ? 8 : 5}
                      pathOptions={{
                        color: sub.aiUrgencyScore >= 4 ? '#ef4444' : '#4f46e5',
                        fillColor: sub.aiUrgencyScore >= 4 ? '#ef4444' : '#4f46e5',
                        fillOpacity: 0.7
                      }}
                    >
                      <Popup>
                        <div className="p-1">
                          <p className="font-bold text-sm mb-1">{sub.aiExtractedTheme}</p>
                          <p className="text-xs mb-1">Ward: {sub.wardNumber}</p>
                          <p className="text-xs italic text-slate-500">Urgency: {sub.aiUrgencyScore}/5</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
