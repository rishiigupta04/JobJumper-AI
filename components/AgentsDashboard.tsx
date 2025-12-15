import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { ViewState, ResearchReport } from '../types';
import { 
  Bot, Brain, Target, PenTool, Telescope, ArrowLeft, 
  Sparkles, Loader2, Copy, Check, AlertTriangle, Briefcase, 
  CheckCircle2, XCircle, MapPin, IndianRupee, Code2, Users, Crown, Zap, RefreshCw,
  Clock, PanelLeftClose, Building2, MessageSquare, Globe, AlertOctagon, MessageCircle, Link as LinkIcon,
  Heart, Github, Linkedin, LogOut
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  runAgentAnalyzer, runAgentInterviewPrep, 
  runAgentDocumentGen, runAgentResearch, AnalyzerResult, ResearchResult
} from '../services/geminiService';

interface AgentsDashboardProps {
  setView: (view: ViewState) => void;
}

type AgentType = 'analyzer' | 'prep' | 'docs' | 'research';

// Define Research State Interface for hoisting
interface ResearchState {
  company: string;
  role: string;
  loading: boolean;
  report: ResearchResult | null;
  rawMarkdown: string | null;
}

const AgentsDashboard: React.FC<AgentsDashboardProps> = ({ setView }) => {
  const [activeAgent, setActiveAgent] = useState<AgentType>('analyzer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { addResearchReport } = useJobContext();

  // Hoisted Research State to persist across tab switches
  const [researchState, setResearchState] = useState<ResearchState>({
    company: '',
    role: '',
    loading: false,
    report: null,
    rawMarkdown: null
  });

  // Hoisted Research Handler
  const handleRunResearch = async () => {
    if (!researchState.company || !researchState.role) return;
    
    // Capture current values to use in async closure
    const currentCompany = researchState.company;
    const currentRole = researchState.role;

    setResearchState(prev => ({ ...prev, loading: true, report: null, rawMarkdown: null }));
    
    try {
      const data = await runAgentResearch(currentCompany, currentRole);
      
      const newReport: ResearchReport = {
          id: crypto.randomUUID(),
          company: currentCompany,
          role: currentRole,
          date: new Date().toISOString(),
          content: JSON.stringify(data)
      };
      
      // Auto-display and stop loading
      setResearchState(prev => ({ ...prev, report: data, loading: false }));
      
      // Persist to history
      addResearchReport(newReport);

    } catch (e) {
      console.error(e);
      setResearchState(prev => ({ ...prev, loading: false }));
      alert("Research failed. Please try again.");
    }
  };

  // Sidebar Items
  const agents = [
    { id: 'analyzer', label: 'Job Analyzer', shortLabel: 'Analyzer', icon: Brain, desc: 'Score & analyze job descriptions' },
    { id: 'prep', label: 'Interview Prep', shortLabel: 'Prep', icon: Target, desc: 'Generate research & questions' },
    { id: 'docs', label: 'Document Gen', shortLabel: 'Docs', icon: PenTool, desc: 'Write cover letters & messages' },
    { id: 'research', label: 'Deep Research', shortLabel: 'Research', icon: Telescope, desc: 'Company intel & strategy' },
  ];

  const renderAgentContent = () => {
    switch (activeAgent) {
      case 'analyzer': return <AgentAnalyzer />;
      case 'prep': return <AgentPrep />;
      case 'docs': return <AgentDocs />;
      case 'research': 
        return <AgentResearch 
            researchState={researchState} 
            setResearchState={setResearchState} 
            onRunResearch={handleRunResearch}
        />;
      default: return <AgentAnalyzer />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Desktop Sidebar - md:flex instead of lg:flex */}
      <div 
        className={`${isSidebarOpen ? 'w-72' : 'w-20'} hidden md:flex bg-slate-900 border-r border-slate-800 flex-col z-20 shadow-xl transition-all duration-300 ease-in-out relative flex-shrink-0`}
      >
        {/* Header */}
        <div className={`h-20 flex items-center border-b border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center'}`}>
            <div 
                className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen ? 'cursor-pointer group' : ''}`}
                onClick={() => !isSidebarOpen && setIsSidebarOpen(true)}
                title={!isSidebarOpen ? "Expand Sidebar" : "Agent Mode"}
            >
                <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30 shrink-0 transition-transform group-hover:scale-105">
                    <Bot size={24} className="text-white" />
                </div>
                
                {isSidebarOpen && (
                    <div className="overflow-hidden">
                        <h1 className="font-bold text-lg tracking-tight whitespace-nowrap">Agent Mode</h1>
                        <p className="text-xs text-slate-400 truncate">Autonomous Career AI</p>
                    </div>
                )}
            </div>

            {isSidebarOpen && (
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="text-slate-500 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                    title="Collapse Sidebar"
                >
                    <PanelLeftClose size={20} />
                </button>
            )}
        </div>

        {/* Exit Button */}
        <div className={`p-4 border-b border-slate-800 ${isSidebarOpen ? '' : 'flex justify-center px-2'}`}>
            <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium border border-slate-700 ${isSidebarOpen ? 'w-full py-2 px-3' : 'p-2 justify-center'}`}
                title="Exit to Dashboard"
            >
                <ArrowLeft size={16} /> 
                {isSidebarOpen && <span>Exit to Dashboard</span>}
            </button>
        </div>

        <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {agents.map((agent) => {
            const Icon = agent.icon;
            const isActive = activeAgent === agent.id;
            return (
            <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id as AgentType)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border group relative ${
                isActive 
                    ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-lg shadow-indigo-900/20' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
            >
                <Icon size={isSidebarOpen ? 18 : 20} className={`${isActive ? 'text-indigo-400' : 'text-slate-500'} shrink-0`} />
                
                {isSidebarOpen && (
                    <div className="text-left overflow-hidden">
                        <span className="font-bold text-sm block truncate">{agent.label}</span>
                        <p className="text-xs opacity-70 leading-tight truncate">{agent.desc}</p>
                    </div>
                )}

                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                        {agent.label}
                    </div>
                )}
            </button>
            );
        })}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-slate-800 bg-slate-900/50 ${isSidebarOpen ? '' : 'flex justify-center'}`}>
            {isSidebarOpen ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles size={12} /> Powered by Gen AI
                </div>
            ) : (
                <Sparkles size={16} className="text-slate-500" />
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative h-full">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
         
         {/* Added pb-24 for mobile bottom navigation clearance */}
         <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-10 flex flex-col pb-24 md:pb-6">
            <div className="flex-1">
                {renderAgentContent()}
            </div>
            
            {/* Rishi Footer - Hidden on Mobile */}
            <footer className="hidden md:flex mt-12 py-6 border-t border-slate-800 flex-row justify-between items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                    <span>Made with</span>
                    <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
                    <span>by <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Rishi</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="https://www.linkedin.com/in/rishirajgupta04/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors"><Linkedin size={18} /></a>
                    <a href="https://github.com/rishirajgupta04" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Github size={18} /></a>
                </div>
            </footer>
         </div>
      </div>

      {/* Mobile Bottom Navigation - Fixed Icons Only - md:hidden instead of lg:hidden */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-800 z-50 px-2 py-2 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isActive = activeAgent === agent.id;
            return (
               <button
                 key={agent.id}
                 onClick={() => setActiveAgent(agent.id as AgentType)}
                 className={`flex flex-col items-center justify-center w-full h-full gap-1 rounded-xl transition-all duration-200 ${
                   isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                 }`}
               >
                 <div className={`p-1.5 rounded-full ${isActive ? 'bg-indigo-500/20' : ''}`}>
                   <Icon size={20} className={isActive ? 'fill-indigo-500/20' : ''} />
                 </div>
                 <span className="text-[10px] font-medium">{agent.shortLabel}</span>
               </button>
            )
          })}
          
          {/* Exit Button in Bottom Nav */}
          <button
             onClick={() => setView('dashboard')}
             className="flex flex-col items-center justify-center w-full h-full gap-1 rounded-xl text-rose-400 hover:text-rose-300 transition-all duration-200"
           >
             <div className="p-1.5 rounded-full">
               <LogOut size={20} />
             </div>
             <span className="text-[10px] font-medium">Exit</span>
           </button>
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
       <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
             <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Application Analyzer</h2>
             <p className="text-slate-400 text-sm md:text-base">Deep match analysis against your current resume profile.</p>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
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

       <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-xl">
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
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20"
             >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? 'Analyzing...' : 'Analyze Match'}
             </button>
          </div>
       </div>

       {result && (
          <div className="animate-fade-in space-y-6">
             
             {/* 1. Header Banner */}
             <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg ${
                result.recommendation.status === 'Strong Apply' ? 'bg-emerald-950/30 border-emerald-500/30' :
                result.recommendation.status === 'Conditional Apply' ? 'bg-amber-950/30 border-amber-500/30' :
                'bg-rose-950/30 border-rose-500/30'
             }`}>
                <div className="flex items-center gap-4 w-full">
                   <div className={`p-3 rounded-full shrink-0 ${
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
                <div className="w-full md:w-auto flex justify-between md:block md:text-right border-t md:border-t-0 border-white/10 pt-3 md:pt-0 mt-2 md:mt-0">
                   <span className="md:hidden text-sm text-slate-400 font-bold uppercase tracking-wider self-center">Match Score</span>
                   <div>
                       <div className="text-3xl font-black text-white">{result.matchAnalysis.overallScore}%</div>
                       <div className="hidden md:block text-xs text-slate-400 uppercase tracking-widest">Match Score</div>
                   </div>
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
       <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Interview Prep Agent</h2>
          <p className="text-slate-400 text-sm md:text-base">Generates research, questions, and answers using the STAR method.</p>
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
                   <div className="flex border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
                      {['Research', 'Technical', 'Behavioral', 'My Questions'].map((tab, i) => (
                         <button 
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === i ? 'border-indigo-500 text-indigo-400 bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
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
                <div className="h-full border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-8 text-center">
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
       <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Document Generator</h2>
          <p className="text-slate-400 text-sm md:text-base">Crafts tailored cover letters, resume bullets, and outreach messages.</p>
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
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white h-32 resize-none" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste JD here..." />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Background Context</label>
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white h-24 resize-none" value={bg} onChange={e => setBg(e.target.value)} placeholder="Key achievements or tone..." />
                   </div>
                   <button 
                      onClick={handleGenerate}
                      disabled={loading || !jd.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                   >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <PenTool size={18} />}
                      Generate Document
                   </button>
                </div>
             </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative group">
             {output ? (
                 <>
                    <textarea 
                        value={output}
                        onChange={(e) => setOutput(e.target.value)}
                        className="w-full h-[300px] md:h-[500px] bg-transparent border-none outline-none resize-none text-sm text-slate-300 leading-relaxed font-mono"
                    />
                    <button 
                        onClick={copyToClipboard}
                        className="absolute top-4 right-4 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy"
                    >
                        <Copy size={16} />
                    </button>
                 </>
             ) : (
                <div className="h-[300px] md:h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                    <PenTool size={48} className="mb-4" />
                    <p>Generated content will appear here.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- AGENT 4: RESEARCH ---

const AgentResearch: React.FC<{
    researchState: ResearchState;
    setResearchState: React.Dispatch<React.SetStateAction<ResearchState>>;
    onRunResearch: () => void;
}> = ({ researchState, setResearchState, onRunResearch }) => {
    
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Deep Research Agent</h2>
                    <p className="text-slate-400 text-sm md:text-base">Autonomous web research on company culture, salaries, and interview patterns.</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Target Company</label>
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="e.g. Google"
                            value={researchState.company}
                            onChange={(e) => setResearchState(prev => ({ ...prev, company: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Role Title</label>
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="e.g. Senior Software Engineer"
                            value={researchState.role}
                            onChange={(e) => setResearchState(prev => ({ ...prev, role: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button 
                        onClick={onRunResearch}
                        disabled={researchState.loading || !researchState.company || !researchState.role}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20"
                    >
                        {researchState.loading ? <Loader2 className="animate-spin" size={18} /> : <Telescope size={18} />}
                        {researchState.loading ? 'Researching (approx. 20s)...' : 'Start Deep Research'}
                    </button>
                </div>
            </div>

            {/* Report Display */}
            {researchState.report && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Summary Banner */}
                    <div className="p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                         <div className="flex items-center gap-4">
                             <div className="p-4 bg-indigo-500/20 rounded-full text-indigo-400">
                                 <Building2 size={32} />
                             </div>
                             <div>
                                 <h3 className="text-2xl font-bold text-white mb-1">{researchState.report.companyName}</h3>
                                 <p className="text-indigo-200">{researchState.report.roleTitle}</p>
                             </div>
                         </div>
                         <div className="w-full md:w-auto flex justify-between md:block md:text-right border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                             <span className="md:hidden text-sm text-slate-400 uppercase tracking-wider self-center">Opp. Score</span>
                             <div>
                                 <div className="text-4xl font-black text-white">{researchState.report.summary.opportunityScore}/100</div>
                                 <div className="hidden md:block text-sm text-slate-400 uppercase tracking-wider mb-1">Opportunity Score</div>
                             </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Column 1: Snapshot */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MessageSquare size={16} /> Verdict
                                </h4>
                                <p className="text-sm text-white leading-relaxed mb-4">
                                    {researchState.report.summary.verdict}
                                </p>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    researchState.report.summary.applyPriority === 'High' ? 'bg-emerald-500/20 text-emerald-400' : 
                                    researchState.report.summary.applyPriority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                                }`}>
                                    {researchState.report.summary.applyPriority} Priority
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <IndianRupee size={16} /> Compensation
                                </h4>
                                <div className="mb-4">
                                    <span className="text-2xl font-bold text-white block">{researchState.report.compensation.salaryRange}</span>
                                    <span className="text-xs text-slate-500">Estimated Base + Stocks</span>
                                </div>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <div className="flex justify-between border-b border-slate-800 pb-1">
                                        <span>Fresher</span>
                                        <span className="font-mono text-emerald-400">{researchState.report.compensation.breakdown.fresher}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800 pb-1">
                                        <span>Mid-Level</span>
                                        <span className="font-mono text-emerald-400">{researchState.report.compensation.breakdown.mid}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Senior</span>
                                        <span className="font-mono text-emerald-400">{researchState.report.compensation.breakdown.senior}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Intel */}
                        <div className="space-y-6">
                             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Globe size={16} /> Company Intel
                                </h4>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-slate-500 min-w-[80px]">Size:</span>
                                        <span>{researchState.report.companyIntelligence.sizeAndStage}</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-slate-500 min-w-[80px]">Culture:</span>
                                        <span>{researchState.report.culture.workEnvironment}</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-slate-500 min-w-[80px]">Hiring:</span>
                                        <span>{researchState.report.hiring.applicationStrategy}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <AlertOctagon size={16} /> Risks & Concerns
                                </h4>
                                <ul className="space-y-2">
                                    {researchState.report.risks.concerns.map((concern, i) => (
                                        <li key={i} className="text-sm text-rose-300 flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                            {concern}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Column 3: Reviews & Sources */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MessageCircle size={16} /> Insider Sentiment
                                </h4>
                                
                                <div className="space-y-4">
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-emerald-500">Glassdoor</span>
                                            <span className="text-xs text-slate-400 font-mono">{researchState.report.reviews.glassdoor.rating}/5</span>
                                        </div>
                                        <div className="flex gap-2 text-[10px]">
                                            <div className="flex-1 bg-emerald-500/10 text-emerald-400 p-1.5 rounded">
                                                👍 {researchState.report.reviews.glassdoor.pros}
                                            </div>
                                            <div className="flex-1 bg-rose-500/10 text-rose-400 p-1.5 rounded">
                                                👎 {researchState.report.reviews.glassdoor.cons}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-orange-500">Reddit</span>
                                            <span className="text-xs text-slate-400">{researchState.report.reviews.reddit.sentiment}</span>
                                        </div>
                                        <ul className="text-[10px] text-slate-400 list-disc pl-3">
                                            {researchState.report.reviews.reddit.keyDiscussions.slice(0, 2).map((d, i) => (
                                                <li key={i}>{d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <LinkIcon size={16} /> Sources
                                </h4>
                                <ul className="space-y-2">
                                    {researchState.report.sources.map((source, i) => (
                                        <li key={i}>
                                            <a 
                                                href={source.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-400 hover:text-indigo-300 truncate block hover:underline"
                                            >
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentsDashboard;