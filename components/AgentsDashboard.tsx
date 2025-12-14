import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { ViewState, ResearchReport } from '../types';
import { 
  Bot, Brain, MessageSquare, FileText, Search, ArrowLeft, 
  Sparkles, Loader2, Copy, Check, AlertTriangle, Briefcase, 
  ChevronRight, Target, PenTool, Telescope, Layers, ArrowRight,
  History, Clock, Trash2, PlusCircle, CheckCircle2, XCircle, MapPin, IndianRupee, Code2, Users, Crown, Zap, RefreshCw,
  TrendingUp, Shield, BarChart3, Building2, Globe, HeartHandshake, Lightbulb, Link as LinkIcon, Star, MessageCircle, AlertOctagon, ThumbsUp, ThumbsDown, Quote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  runAgentAnalyzer, runAgentInterviewPrep, 
  runAgentDocumentGen, runAgentResearch, AnalyzerResult, ResearchResult, validateResearchResult
} from '../services/geminiService';

interface AgentsDashboardProps {
  setView: (view: ViewState) => void;
}

type AgentType = 'analyzer' | 'prep' | 'docs' | 'research';

const AgentsDashboard: React.FC<AgentsDashboardProps> = ({ setView }) => {
  const [activeAgent, setActiveAgent] = useState<AgentType>('analyzer');
  const { resume } = useJobContext();

  // Sidebar Items
  const agents = [
    { id: 'analyzer', label: 'Job Analyzer', icon: Brain, desc: 'Score & analyze job descriptions' },
    { id: 'prep', label: 'Interview Prep', icon: Target, desc: 'Generate research & questions' },
    { id: 'docs', label: 'Document Gen', icon: PenTool, desc: 'Write cover letters & messages' },
    { id: 'research', label: 'Deep Research', icon: Telescope, desc: 'Company intel & strategy' },
  ];

  const renderAgentContent = () => {
    switch (activeAgent) {
      case 'analyzer': return <AgentAnalyzer />;
      case 'prep': return <AgentPrep />;
      case 'docs': return <AgentDocs />;
      case 'research': return <AgentResearch />;
      default: return <AgentAnalyzer />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Agent Sidebar */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
               <Bot size={24} className="text-white" />
            </div>
            <div>
               <h1 className="font-bold text-lg tracking-tight">Agent Mode</h1>
               <p className="text-xs text-slate-400">Autonomous Career AI</p>
            </div>
          </div>
          <button 
            onClick={() => setView('dashboard')}
            className="w-full py-2 px-3 flex items-center gap-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium border border-slate-700"
          >
            <ArrowLeft size={16} /> Exit to Dashboard
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isActive = activeAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id as AgentType)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  isActive 
                    ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-lg shadow-indigo-900/20' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                   <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                   <span className="font-bold text-sm">{agent.label}</span>
                </div>
                <p className="text-xs opacity-70 pl-8 leading-tight">{agent.desc}</p>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles size={12} /> Powered by Gemini 2.0 Flash
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
         
         <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            {renderAgentContent()}
         </div>
      </div>
    </div>
  );
};

// --- AGENT 1: ANALYZER ---

const AgentAnalyzer = () => {
  const { resume } = useJobContext();
  const [loading, setLoading] = useState(false);
  
  // Load state from localStorage
  const [jd, setJd] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('agent_analyzer_jd') || '';
    return '';
  });

  const [result, setResult] = useState<AnalyzerResult | null>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('agent_analyzer_result');
        try {
            return saved ? JSON.parse(saved) : null;
        } catch(e) {
            return null;
        }
    }
    return null;
  });

  // Persist state
  useEffect(() => {
      localStorage.setItem('agent_analyzer_jd', jd);
  }, [jd]);

  useEffect(() => {
      if (result) {
          localStorage.setItem('agent_analyzer_result', JSON.stringify(result));
      }
  }, [result]);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    try {
      const data = await runAgentAnalyzer(jd, resume);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
      setJd('');
      setResult(null);
      localStorage.removeItem('agent_analyzer_jd');
      localStorage.removeItem('agent_analyzer_result');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
       <div className="flex justify-between items-start">
          <div>
             <h2 className="text-3xl font-bold mb-2 text-white">Application Analyzer</h2>
             <p className="text-slate-400">Deep match analysis against your current resume profile.</p>
          </div>
          <div className="flex items-center gap-3">
              {result && (
                  <button 
                    onClick={handleClear}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                  >
                    <RefreshCw size={14} /> New Analysis
                  </button>
              )}
              {resume.fullName && (
                 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-300">Analyzing as <strong>{resume.fullName}</strong></span>
                 </div>
              )}
          </div>
       </div>

       <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Paste Job Description</label>
          <textarea 
             value={jd}
             onChange={(e) => setJd(e.target.value)}
             className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-y mb-4 font-mono transition-all focus:border-indigo-500"
             placeholder="Paste the full JD here..."
          />
          <div className="flex justify-end">
             <button 
                onClick={handleAnalyze}
                disabled={loading || !jd.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20"
             >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? 'Analyzing...' : 'Analyze Match'}
             </button>
          </div>
       </div>

       {result && (
          <div className="animate-fade-in space-y-6">
             
             {/* 1. Header Banner */}
             <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg ${
                result.recommendation.status === 'Strong Apply' ? 'bg-emerald-950/30 border-emerald-500/30' :
                result.recommendation.status === 'Conditional Apply' ? 'bg-amber-950/30 border-amber-500/30' :
                'bg-rose-950/30 border-rose-500/30'
             }`}>
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-full ${
                      result.recommendation.status === 'Strong Apply' ? 'bg-emerald-500/20 text-emerald-400' :
                      result.recommendation.status === 'Conditional Apply' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                   }`}>
                      {result.recommendation.status === 'Strong Apply' ? <CheckCircle2 size={24} /> :
                       result.recommendation.status === 'Conditional Apply' ? <AlertTriangle size={24} /> : <XCircle size={24} />}
                   </div>
                   <div>
                      <h3 className={`text-xl font-bold ${
                         result.recommendation.status === 'Strong Apply' ? 'text-emerald-400' :
                         result.recommendation.status === 'Conditional Apply' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                         {result.recommendation.status.toUpperCase()}
                      </h3>
                      <p className="text-sm text-slate-300">{result.recommendation.reason}</p>
                   </div>
                </div>
                <div className="hidden md:block text-right">
                   <div className="text-3xl font-black text-white">{result.matchAnalysis.overallScore}%</div>
                   <div className="text-xs text-slate-400 uppercase tracking-widest">Match Score</div>
                </div>
             </div>

             {/* 2. Grid Layout */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Key Info & Score Breakdown */}
                <div className="space-y-6">
                   {/* Key Info */}
                   <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Key Information</h4>
                      <div className="space-y-4">
                         <div className="flex items-start gap-3">
                            <Briefcase size={18} className="text-indigo-400 mt-0.5" />
                            <div>
                               <p className="text-sm font-semibold text-white">{result.keyInfo.role}</p>
                               <p className="text-xs text-slate-500">{result.keyInfo.company}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-indigo-400 mt-0.5" />
                            <div>
                               <p className="text-sm text-slate-300">{result.keyInfo.location}</p>
                               <p className="text-xs text-slate-500">{result.keyInfo.workMode}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-3">
                            <IndianRupee size={18} className="text-indigo-400 mt-0.5" />
                            <div>
                               <p className="text-sm text-slate-300">{result.keyInfo.salary}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-3">
                            <Clock size={18} className="text-indigo-400 mt-0.5" />
                            <div>
                               <p className="text-sm text-slate-300">{result.keyInfo.experience}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Score Breakdown */}
                   <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Match Breakdown</h4>
                      <div className="space-y-5">
                         {[
                            { label: 'Technical Skills', data: result.matchAnalysis.technicalMatch },
                            { label: 'Experience Level', data: result.matchAnalysis.experienceMatch },
                            { label: 'Role Alignment', data: result.matchAnalysis.roleMatch }
                         ].map((item, i) => (
                            <div key={i}>
                               <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-300 font-medium">{item.label}</span>
                                  <span className={getScoreColor(item.data.score)}>{item.data.score}%</span>
                               </div>
                               <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                                  <div className={`h-2 rounded-full ${getScoreBg(item.data.score)}`} style={{ width: `${item.data.score}%` }}></div>
                               </div>
                               <p className="text-[10px] text-slate-500 leading-tight">{item.data.reason}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Middle Column: Skills Matrix */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Skills Matrix</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <div className="flex items-center gap-2 mb-3">
                               <Code2 size={16} className="text-blue-400" />
                               <span className="text-sm font-semibold text-white">Technical Required</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {result.skills.technical.map((s, i) => (
                                  <span key={i} className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1 ${
                                    s.status === 'matched' 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  }`}>
                                    {s.status === 'matched' ? <Check size={10} /> : <XCircle size={10} />}
                                    {s.name}
                                  </span>
                               ))}
                            </div>
                         </div>

                         <div>
                            <div className="flex items-center gap-2 mb-3">
                               <Users size={16} className="text-purple-400" />
                               <span className="text-sm font-semibold text-white">Soft Skills</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {result.skills.soft.map((s, i) => (
                                  <span key={i} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs rounded-lg">{s}</span>
                               ))}
                            </div>
                         </div>

                         <div className="md:col-span-2 pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-2 mb-3">
                               <Zap size={16} className="text-amber-400" />
                               <span className="text-sm font-semibold text-white">Nice to Have (Bonus)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {result.skills.niceToHave.length > 0 ? result.skills.niceToHave.map((s, i) => (
                                  <span key={i} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-lg">{s}</span>
                               )) : <span className="text-xs text-slate-500 italic">None specified</span>}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Competitive Analysis & Red Flags */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Competitive Analysis */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                         <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Competitive Landscape</h4>
                         <div className="flex items-center justify-between mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <span className="text-xs text-slate-400">Difficulty</span>
                            <span className={`text-sm font-bold ${
                               result.competitiveAnalysis.level === 'High' ? 'text-rose-400' : 
                               result.competitiveAnalysis.level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>{result.competitiveAnalysis.level} Competition</span>
                         </div>
                         <div className="mb-4">
                            <span className="text-xs text-slate-500 block mb-1">Est. Applicant Pool</span>
                            <span className="text-sm text-slate-300">{result.competitiveAnalysis.poolSize}</span>
                         </div>
                         <div>
                            <span className="text-xs text-slate-500 block mb-2">Your Differentiators</span>
                            <ul className="space-y-1">
                               {result.competitiveAnalysis.differentiators.map((d, i) => (
                                  <li key={i} className="text-xs text-indigo-300 flex items-start gap-1.5">
                                     <Crown size={12} className="mt-0.5 shrink-0" /> {d}
                                  </li>
                               ))}
                            </ul>
                         </div>
                      </div>

                      {/* Red Flags */}
                      <div className={`rounded-2xl p-6 border ${
                         result.redFlags.length > 0 
                         ? 'bg-rose-950/10 border-rose-900/50' 
                         : 'bg-emerald-950/10 border-emerald-900/50'
                      }`}>
                         <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
                            result.redFlags.length > 0 ? 'text-rose-400' : 'text-emerald-400'
                         }`}>
                            {result.redFlags.length > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                            {result.redFlags.length > 0 ? 'Red Flags Detected' : 'Clean Scan'}
                         </h4>
                         
                         {result.redFlags.length > 0 ? (
                            <ul className="space-y-2">
                               {result.redFlags.map((flag, i) => (
                                  <li key={i} className="text-xs text-rose-200 flex items-start gap-2">
                                     <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                     {flag}
                                  </li>
                               ))}
                            </ul>
                         ) : (
                            <p className="text-xs text-emerald-200">No major red flags found in the job description.</p>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// --- AGENT 2: INTERVIEW PREP ---

const AgentPrep = () => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const handleGenerate = async () => {
    if (!company || !role) return;
    setLoading(true);
    try {
      const text = await runAgentInterviewPrep(company, role, jd);
      setResult(text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Naive parser for tabs based on headers
  const getSection = (header: string) => {
    if (!result) return '';
    const parts = result.split(/#\s/);
    const section = parts.find(p => p.toLowerCase().includes(header.toLowerCase()));
    return section ? `# ${section}` : 'Section not found.';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
       <div>
          <h2 className="text-3xl font-bold mb-2 text-white">Interview Prep Agent</h2>
          <p className="text-slate-400">Generates research, questions, and answers using the STAR method.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Company</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Netflix" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Role</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Engineer" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">JD (Optional)</label>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white h-24 resize-none" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste JD context..." />
                   </div>
                   <button 
                      onClick={handleGenerate}
                      disabled={loading || !company || !role}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                   >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />}
                      Generate Kit
                   </button>
                </div>
             </div>
          </div>

          <div className="lg:col-span-2">
             {result ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
                   <div className="flex border-b border-slate-800 bg-slate-950/50">
                      {['Research', 'Technical', 'Behavioral', 'My Questions'].map((tab, i) => (
                         <button 
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === i ? 'border-indigo-500 text-indigo-400 bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                         >
                            {tab}
                         </button>
                      ))}
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 custom-scrollbar prose prose-invert max-w-none">
                      <ReactMarkdown>
                         {activeTab === 0 ? getSection('Company Research') :
                          activeTab === 1 ? getSection('Technical Interview') :
                          activeTab === 2 ? getSection('Behavioral Interview') :
                          getSection('Smart Questions')}
                      </ReactMarkdown>
                   </div>
                </div>
             ) : (
                <div className="h-full border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600">
                   <Target size={48} className="mb-4 opacity-50" />
                   <p>Enter details to generate your prep kit.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- AGENT 3: DOCS ---

const AgentDocs = () => {
  const [type, setType] = useState<'Cover Letter' | 'Resume Bullets' | 'LinkedIn Message'>('Cover Letter');
  const [jd, setJd] = useState('');
  const [bg, setBg] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  const handleGenerate = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    try {
      const text = await runAgentDocumentGen(type, jd, bg);
      setOutput(text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
     navigator.clipboard.writeText(output);
     alert("Copied to clipboard!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
       <div>
          <h2 className="text-3xl font-bold mb-2 text-white">Document Generator</h2>
          <p className="text-slate-400">Crafts tailored cover letters, resume bullets, and outreach messages.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Document Type</label>
                      <div className="grid grid-cols-3 gap-2">
                         {['Cover Letter', 'Resume Bullets', 'LinkedIn Message'].map(t => (
                            <button 
                               key={t}
                               onClick={() => setType(t as any)}
                               className={`py-2 px-1 text-xs font-medium rounded-lg border transition-colors ${type === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                            >
                               {t.split(' ')[0]}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Job Description</label>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white h-32 resize-none" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste JD..." />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">My Background (Resume/Notes)</label>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white h-32 resize-none" value={bg} onChange={e => setBg(e.target.value)} placeholder="Paste your resume summary or key skills..." />
                   </div>
                   <button 
                      onClick={handleGenerate}
                      disabled={loading || !jd}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                   >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <PenTool size={18} />}
                      Generate {type}
                   </button>
                </div>
             </div>
          </div>

          <div className="relative">
             <div className="absolute top-0 right-0 p-4 flex gap-2 z-10">
                {output && (
                   <button onClick={copyToClipboard} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-white hover:text-slate-900 transition-colors" title="Copy">
                      <Copy size={16} />
                   </button>
                )}
             </div>
             <textarea 
                readOnly
                value={output}
                placeholder="Generated content will appear here..."
                className="w-full h-full min-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm leading-relaxed text-slate-300 resize-none outline-none focus:border-indigo-500 font-mono"
             />
          </div>
       </div>
    </div>
  );
};

// --- AGENT 4: RESEARCH ---

const AgentResearch = () => {
  const { researchHistory, addResearchReport, deleteResearchReport } = useJobContext();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ResearchResult | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);

  const handleResearch = async () => {
    if (!company || !role) return;
    setLoading(true);
    setReport(null);
    setRawMarkdown(null);
    
    try {
      const data = await runAgentResearch(company, role);
      
      // Store result stringified in history (persistence layer uses string)
      const newReport: ResearchReport = {
          id: crypto.randomUUID(),
          company,
          role,
          date: new Date().toISOString(),
          content: JSON.stringify(data)
      };
      
      setReport(data);
      addResearchReport(newReport);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (item: ResearchReport) => {
      setCompany(item.company);
      setRole(item.role);
      
      try {
          const parsed = JSON.parse(item.content);
          // Use validator to prevent undefined errors from legacy data
          setReport(validateResearchResult(parsed));
          setRawMarkdown(null);
      } catch (e) {
          // Fallback for legacy markdown reports
          setReport(null);
          setRawMarkdown(item.content);
      }
  };

  const clearForm = () => {
      setCompany('');
      setRole('');
      setReport(null);
      setRawMarkdown(null);
  }

  // Render Metrics Helper
  const renderMetric = (label: string, value: string | number, icon: any, color: string) => (
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
         <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
            {React.createElement(icon, { size: 24 })}
         </div>
         <div>
            <p className="text-xs text-slate-500 uppercase font-bold">{label}</p>
            <p className={`text-xl font-bold ${color === 'rose' || color === 'emerald' ? `text-${color}-400` : 'text-white'}`}>{value}</p>
         </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
       <div className="flex justify-between items-start">
          <div>
             <h2 className="text-3xl font-bold mb-2 text-white">Deep Research Agent</h2>
             <p className="text-slate-400">Conducts multi-step intelligence gathering using Google Search.</p>
          </div>
          {(report || rawMarkdown) && (
             <button onClick={clearForm} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-2" title="New Search">
                 <RefreshCw size={16} /> New Search
             </button>
          )}
       </div>

       <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Main Area */}
          <div className="flex-1 space-y-6 w-full min-w-0">
             {/* Input Form */}
             {!report && !rawMarkdown && !loading && (
                 <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col gap-6 items-center text-center max-w-2xl mx-auto mt-10">
                    <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400 mb-2">
                       <Telescope size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Start New Investigation</h3>
                    <p className="text-slate-400 max-w-md">Enter a target company and role. The agent will crawl for financial health, reviews, India-specific salaries, and interviews.</p>
                    
                    <div className="w-full space-y-4 text-left">
                       <div>
                          <label className="block text-xs font-bold text-indigo-400 uppercase mb-2 ml-1">Target Company</label>
                          <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Swiggy" />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-indigo-400 uppercase mb-2 ml-1">Role Title</label>
                          <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. SDE 2" />
                       </div>
                       <button 
                          onClick={handleResearch}
                          disabled={loading || !company || !role}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-indigo-900/20"
                       >
                          <Telescope size={20} /> Launch Deep Research
                       </button>
                    </div>
                 </div>
             )}

             {/* Progress State */}
             {loading && (
                <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                   <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                      <Loader2 size={64} className="text-indigo-500 animate-spin relative z-10" />
                   </div>
                   <h3 className="text-xl font-bold text-white mt-8 mb-2">Gathering Intelligence</h3>
                   <p className="text-slate-400 animate-pulse">Analysing {company} financials, Reddit threads, and Glassdoor India...</p>
                   <div className="mt-8 flex gap-3">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700">Financials</span>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700 animate-pulse delay-75">Culture</span>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700 animate-pulse delay-150">Salaries</span>
                   </div>
                </div>
             )}

             {/* Structured JSON Report */}
             {report && (
                <div className="animate-fade-in space-y-6">
                   {/* Summary Metrics */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {renderMetric('Opportunity Score', `${report.summary.opportunityScore}/100`, TrendingUp, 'indigo')}
                      {renderMetric('Risk Level', report.risks.level, Shield, report.risks.level === 'High' ? 'rose' : report.risks.level === 'Medium' ? 'amber' : 'emerald')}
                      {renderMetric('Apply Priority', report.summary.applyPriority, BarChart3, 'blue')}
                   </div>

                   {/* Header & Verdict */}
                   <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Building2 size={120} className="text-indigo-500" />
                      </div>
                      <div className="flex justify-between items-start mb-6 relative z-10">
                         <div>
                            <h3 className="text-3xl font-bold text-white mb-1">{report.companyName}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                               <span className="flex items-center gap-1"><Briefcase size={14}/> {report.roleTitle}</span>
                               <span className="flex items-center gap-1"><Globe size={14}/> {report.companyIntelligence.overview.split('.')[0]}</span>
                            </div>
                         </div>
                      </div>
                      <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800 relative z-10 backdrop-blur-sm">
                         <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Verdict Summary</h4>
                         <p className="text-slate-300 leading-relaxed">{report.summary.verdict}</p>
                      </div>
                   </div>

                   {/* Row 1: Company & Culture */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Company & Financials */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <Building2 className="text-indigo-400" size={20} />
                            <h4 className="font-bold text-white">Company Intelligence</h4>
                         </div>
                         <div className="space-y-4 text-sm">
                            <div>
                               <span className="text-slate-500 block mb-1">Size & Stage</span>
                               <p className="text-slate-300">{report.companyIntelligence.sizeAndStage}</p>
                            </div>
                            <div>
                               <span className="text-slate-500 block mb-1">Financial Health</span>
                               <p className="text-slate-300">{report.companyIntelligence.financialHealth}</p>
                            </div>
                            <div>
                               <span className="text-slate-500 block mb-1">Competitors</span>
                               <div className="flex flex-wrap gap-2">
                                  {report.companyIntelligence.competitors.map((c, i) => (
                                     <span key={i} className="px-2 py-1 bg-slate-800 rounded text-slate-300 text-xs">{c}</span>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Culture */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <HeartHandshake className="text-pink-400" size={20} />
                            <h4 className="font-bold text-white">Culture & Values</h4>
                         </div>
                         <div className="space-y-4 text-sm">
                            <div>
                               <span className="text-slate-500 block mb-1">Work Environment</span>
                               <p className="text-slate-300">{report.culture.workEnvironment}</p>
                            </div>
                            <div>
                               <span className="text-slate-500 block mb-1">Engineering Culture</span>
                               <p className="text-slate-300">{report.culture.engineeringCulture}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Row 2: Compensation - Full Width Hero */}
                   <div className="bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-900/50 rounded-2xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                         <IndianRupee size={100} className="text-emerald-500" />
                      </div>
                      <div className="relative z-10">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                               <IndianRupee size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-white">Compensation Analysis (India)</h4>
                         </div>
                         
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                               <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider block mb-2">Estimated Total Compensation</span>
                               <p className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">{report.compensation.salaryRange}</p>
                               <p className="text-slate-400 text-sm">{report.compensation.comparison}</p>
                            </div>
                            <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/50 h-fit">
                               <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-3">Benefits & Perks</span>
                               <div className="flex flex-wrap gap-3">
                                  {report.compensation.benefits.map((b, i) => (
                                     <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-300 rounded-lg text-sm border border-emerald-500/20">
                                        <Check size={14} /> {b}
                                     </span>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Row 3: Hiring & Strategy */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <Target className="text-blue-400" size={20} />
                            <h4 className="font-bold text-white">Interview Process</h4>
                         </div>
                         <div className="space-y-4">
                            {report.hiring.process.map((step, i) => (
                               <div key={i} className="flex gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-700">
                                     {i+1}
                                  </div>
                                  <p className="text-sm text-slate-300 pt-0.5">{step}</p>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <Lightbulb className="text-amber-400" size={20} />
                            <h4 className="font-bold text-white">Winning Strategy</h4>
                         </div>
                         <div className="space-y-4">
                            <div>
                               <span className="text-slate-500 text-xs uppercase tracking-wider font-bold block mb-2">Outreach Tip</span>
                               <p className="text-sm text-slate-300 italic border-l-2 border-amber-500/50 pl-3">"{report.strategy.outreach}"</p>
                            </div>
                            <div>
                               <span className="text-slate-500 text-xs uppercase tracking-wider font-bold block mb-2">Key Differentiators</span>
                               <ul className="space-y-2">
                                  {report.strategy.differentiators.map((d, i) => (
                                     <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                        {d}
                                     </li>
                                  ))}
                               </ul>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Row 4: Employee Voices - Full Width Redesign */}
                   {report.reviews && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                         <div className="flex items-center gap-3 mb-8">
                            <MessageCircle className="text-indigo-400" size={24} />
                            <h4 className="text-xl font-bold text-white">Employee Voices</h4>
                         </div>
                         
                         {/* Metrics Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Glassdoor Card */}
                            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
                               <div className="flex justify-between items-start mb-4">
                                  <div>
                                     <h5 className="font-bold text-white text-lg mb-1">Glassdoor / AmbitionBox</h5>
                                     <p className="text-xs text-slate-500">Employee Ratings</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-black text-2xl bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-900/50">
                                     {report.reviews.glassdoor?.rating || 'N/A'} <Star size={20} fill="currentColor" />
                                  </div>
                               </div>
                               <div className="space-y-3">
                                  <div className="flex gap-3 text-sm">
                                     <ThumbsUp size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                     <div>
                                        <span className="text-slate-400 font-bold text-xs uppercase block mb-0.5">Pros</span>
                                        <p className="text-slate-300">{report.reviews.glassdoor?.pros}</p>
                                     </div>
                                  </div>
                                  <div className="flex gap-3 text-sm">
                                     <ThumbsDown size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                     <div>
                                        <span className="text-slate-400 font-bold text-xs uppercase block mb-0.5">Cons</span>
                                        <p className="text-slate-300">{report.reviews.glassdoor?.cons}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* Reddit Card */}
                            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
                               <div className="flex justify-between items-start mb-4">
                                  <div>
                                     <h5 className="font-bold text-white text-lg mb-1">Reddit Pulse</h5>
                                     <p className="text-xs text-slate-500">Community Sentiment</p>
                                  </div>
                                  <span className={`text-sm px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${
                                     report.reviews.reddit?.sentiment.toLowerCase().includes('positive') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                     report.reviews.reddit?.sentiment.toLowerCase().includes('negative') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                     'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}>
                                     {report.reviews.reddit?.sentiment}
                                  </span>
                               </div>
                               <div className="space-y-3">
                                  <span className="text-slate-400 font-bold text-xs uppercase block">Key Discussions</span>
                                  {report.reviews.reddit?.keyDiscussions.slice(0, 3).map((disc, i) => (
                                     <div key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                                        <span className="text-orange-500 font-bold">•</span>
                                        {disc}
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>

                         {/* Real Quotes Grid */}
                         {report.reviews.employeeVoices && report.reviews.employeeVoices.length > 0 && (
                            <div>
                               <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Quote size={14} /> Real Employee Quotes
                               </h5>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {report.reviews.employeeVoices.map((voice, i) => (
                                     <div key={i} className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 relative">
                                        <Quote size={20} className="text-slate-700 absolute top-4 right-4" />
                                        <p className="text-slate-300 text-sm italic mb-3 leading-relaxed">"{voice.quote}"</p>
                                        <div className="text-xs font-bold text-indigo-400">— {voice.source}</div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                   )}

                   {/* Row 5: Risks */}
                   {report.risks.concerns.length > 0 && (
                      <div className="bg-rose-950/10 border border-rose-900/30 rounded-2xl p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="text-rose-400" size={20} />
                            <h4 className="font-bold text-white">Risk Assessment</h4>
                         </div>
                         <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {report.risks.concerns.map((risk, i) => (
                               <li key={i} className="flex items-start gap-2 text-rose-200 text-sm bg-rose-950/20 p-3 rounded-lg border border-rose-900/20">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                  {risk}
                               </li>
                            ))}
                         </ul>
                      </div>
                   )}

                   {/* Row 6: Sources - Full Width & Clean */}
                   {report.sources && report.sources.length > 0 && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                         <div className="flex items-center gap-3 mb-6">
                            <LinkIcon className="text-slate-400" size={24} />
                            <h4 className="text-xl font-bold text-white">Deep Dive Sources</h4>
                         </div>
                         <div className="space-y-3">
                            {report.sources.map((source, i) => (
                               <a 
                                 key={i} 
                                 href={source.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="flex items-center justify-between p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all group"
                               >
                                  <div className="flex items-center gap-4 overflow-hidden">
                                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-indigo-400 flex items-center justify-center font-bold text-sm border border-slate-800 group-hover:border-slate-600 group-hover:text-white transition-colors">
                                        {i + 1}
                                     </div>
                                     <div>
                                        <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate transition-colors">{source.title}</p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5 max-w-xl">{source.url}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-600 group-hover:text-indigo-400 transition-colors text-xs font-medium">
                                     Read Source <ChevronRight size={14} />
                                  </div>
                               </a>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
             )}

             {/* Legacy Markdown Report Fallback */}
             {rawMarkdown && (
                <div className="animate-fade-in bg-slate-900 border border-slate-800 rounded-2xl p-8 lg:p-10 shadow-xl">
                   <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                      <div>
                         <h3 className="text-2xl font-bold text-white mb-2">Intelligence Report: {company}</h3>
                         <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><Briefcase size={14}/> {role}</span>
                         </div>
                      </div>
                   </div>
                   <div className="prose prose-invert prose-indigo max-w-none">
                      <ReactMarkdown>{rawMarkdown}</ReactMarkdown>
                   </div>
                </div>
             )}
          </div>

          {/* History Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                  <History size={16} /> Research History
              </div>
              
              <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[calc(100vh-200px)]">
                  {researchHistory.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group relative ${
                            (report?.companyName === item.company || rawMarkdown === item.content) // simplified matching
                            ? 'bg-indigo-900/20 border-indigo-500/50 shadow-md' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                        }`}
                        onClick={() => handleSelectReport(item)}
                      >
                          <h4 className="font-bold text-sm text-white truncate mb-1">{item.company}</h4>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                             <Target size={10} /> {item.role}
                          </p>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="flex items-center gap-1"><Clock size={10} /> {new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          <button 
                             onClick={(e) => { e.stopPropagation(); deleteResearchReport(item.id); if(report?.companyName === item.company) setReport(null); }}
                             className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          >
                             <Trash2 size={14} />
                          </button>
                      </div>
                  ))}
                  
                  {researchHistory.length === 0 && (
                      <div className="text-center py-8 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                          <Telescope size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No previous searches.</p>
                      </div>
                  )}
              </div>
          </div>

       </div>
    </div>
  );
};

export default AgentsDashboard;