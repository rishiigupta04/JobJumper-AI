
import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { ViewState, ResearchReport, InterviewPrepReport } from '../types';
import { 
  Bot, Brain, Target, PenTool, Telescope, ArrowLeft, 
  Sparkles, Loader2, Copy, Check, AlertTriangle, Briefcase, 
  CheckCircle2, XCircle, MapPin, IndianRupee, Code2, Users, Crown, Zap, RefreshCw,
  Clock, PanelLeftClose, Building2, MessageSquare, Globe, AlertOctagon, MessageCircle, Link as LinkIcon,
  Heart, Github, Linkedin, LogOut, FileText, Settings as SettingsIcon, Languages, ThumbsUp, ThumbsDown, Minus, Trash2, History,
  ChevronDown, ChevronUp, BookOpen, MessageCircleQuestion
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  runAgentAnalyzer, runAgentInterviewPrep, 
  runAgentDocumentGen, runAgentResearch, AnalyzerResult, ResearchResult, validateResearchResult, InterviewPrepResult
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
  error: string | null;
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
    rawMarkdown: null,
    error: null
  });

  // Hoisted Research Handler
  const handleRunResearch = async () => {
    if (!researchState.company || !researchState.role) return;
    
    // Capture current values to use in async closure
    const currentCompany = researchState.company;
    const currentRole = researchState.role;

    setResearchState(prev => ({ ...prev, loading: true, report: null, rawMarkdown: null, error: null }));
    
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

    } catch (e: any) {
      console.error(e);
      setResearchState(prev => ({ 
          ...prev, 
          loading: false, 
          error: e.message || "An unexpected error occurred. Please try again." 
      }));
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

// ... (Analyzer, Prep, Docs Components remain the same as previous) ...

const AgentAnalyzer = () => {
  const { resume } = useJobContext();
  const { isDemoMode } = useAuth();
  const [loading, setLoading] = useState(false);
  
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

  const DEMO_JD = `Senior Frontend Engineer
  
  We are looking for a Senior Frontend Engineer to join our team.
  
  Requirements:
  - 5+ years of experience with React, TypeScript, and modern CSS.
  - Experience with Next.js and Tailwind CSS.
  - Strong understanding of web performance and accessibility.
  - Experience with state management (Redux, Zustand, Context).
  - Ability to mentor junior developers.
  
  Bonus:
  - Experience with AI/LLM integration.
  - Knowledge of WebGL or Three.js.`;

  const DEMO_RESULT: AnalyzerResult = {
    matchAnalysis: {
        overallScore: 85,
        technicalMatch: { score: 90, reason: "Strong match on React, TypeScript, and Tailwind." },
        experienceMatch: { score: 80, reason: "Meets the 5+ years requirement." },
        roleMatch: { score: 85, reason: "Good fit for Senior level responsibilities." }
    },
    skills: {
        technical: [
            { name: "React", status: "matched" },
            { name: "TypeScript", status: "matched" },
            { name: "Tailwind CSS", status: "matched" },
            { name: "Next.js", status: "missing" },
            { name: "WebGL", status: "missing" }
        ],
        soft: ["Mentorship", "Communication"],
        niceToHave: ["AI Integration"]
    },
    keyInfo: {
        role: "Senior Frontend Engineer",
        company: "Tech Corp (Demo)",
        location: "Remote",
        salary: "$140k - $180k",
        workMode: "Remote",
        experience: "5+ Years"
    },
    competitiveAnalysis: {
        level: "Medium",
        poolSize: "50-100 Applicants",
        differentiators: ["Strong React Portfolio", "Open Source Contributions"]
    },
    redFlags: [],
    recommendation: {
        status: "Strong Apply",
        reason: "Your profile is a very strong match for this role."
    }
  };

  const loadDemoData = () => {
      setJd(DEMO_JD);
      setResult(null); // Clear previous result to force re-analysis simulation
  };

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

    if (isDemoMode && jd === DEMO_JD) {
        setTimeout(() => {
            setResult(DEMO_RESULT);
            setLoading(false);
        }, 1500);
        return;
    }

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
              {isDemoMode && !result && (
                  <button 
                    onClick={loadDemoData}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400 transition-colors"
                  >
                    <Sparkles size={14} /> Load Demo Data
                  </button>
              )}
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

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
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

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

// ... (AgentPrep and AgentDocs components) ...

const AgentPrep = () => {
  const { prepHistory, addPrepReport, deletePrepReport } = useJobContext();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterviewPrepResult | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!company || !role) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await runAgentInterviewPrep(company, role, jd);
      setResult(data);
      
      const newReport: InterviewPrepReport = {
          id: crypto.randomUUID(),
          company: company,
          role: role,
          date: new Date().toISOString(),
          content: JSON.stringify(data)
      };
      
      addPrepReport(newReport);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPrep = (item: InterviewPrepReport) => {
      setCompany(item.company);
      setRole(item.role);
      try {
          const parsed = JSON.parse(item.content);
          setResult(parsed);
      } catch(e) { console.error("Failed to load prep report", e); }
  };

  const toggleQuestion = (idx: string) => {
      setExpandedQuestion(expandedQuestion === idx ? null : idx);
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

             {/* Prep History List */}
             {prepHistory.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <History size={14} /> Recent Kits
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {prepHistory.map((item) => (
                              <div 
                                  key={item.id}
                                  onClick={() => loadPrep(item)}
                                  className={`p-3 rounded-xl cursor-pointer transition-all border group relative ${
                                      result && company === item.company && role === item.role
                                      ? 'bg-indigo-900/20 border-indigo-500/50' 
                                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                                  }`}
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-sm text-white truncate pr-6">{item.company}</span>
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); deletePrepReport(item.id); }}
                                          className="text-slate-600 hover:text-rose-500 p-1 rounded transition-colors"
                                      >
                                          <Trash2 size={12} />
                                      </button>
                                  </div>
                                  <p className="text-xs text-slate-400 truncate mb-1">{item.role}</p>
                                  <p className="text-[10px] text-slate-600">{new Date(item.date).toLocaleDateString()}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
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
                   
                   <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      
                      {/* Research Tab */}
                      {activeTab === 0 && (
                          <div className="space-y-6 animate-fade-in">
                              <div>
                                  <h3 className="text-sm font-bold text-indigo-400 uppercase mb-2">Mission & Culture</h3>
                                  <p className="text-sm text-white bg-slate-950 p-4 rounded-xl border border-slate-800">
                                      {result.companyResearch.mission}
                                  </p>
                              </div>
                              <div>
                                  <h3 className="text-sm font-bold text-indigo-400 uppercase mb-2">Key Products</h3>
                                  <div className="flex flex-wrap gap-2">
                                      {result.companyResearch.products.map((p, i) => (
                                          <span key={i} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 border border-slate-700">{p}</span>
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <h3 className="text-sm font-bold text-indigo-400 uppercase mb-2">Culture Notes</h3>
                                  <p className="text-sm text-slate-300">{result.companyResearch.culture}</p>
                              </div>
                              <div>
                                  <h3 className="text-sm font-bold text-indigo-400 uppercase mb-2">Recent News</h3>
                                  <ul className="space-y-2">
                                      {result.companyResearch.recentNews.map((news, i) => (
                                          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                              <span className="text-indigo-500 mt-1">•</span> {news}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          </div>
                      )}

                      {/* Technical Tab */}
                      {activeTab === 1 && (
                          <div className="space-y-4 animate-fade-in">
                              <div className="flex flex-wrap gap-2 mb-4">
                                  {result.technical.topics.map((topic, i) => (
                                      <span key={i} className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-900/50">{topic}</span>
                                  ))}
                              </div>
                              {result.technical.questions.map((item, i) => (
                                  <div key={i} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                                      <button 
                                          onClick={() => toggleQuestion(`tech-${i}`)}
                                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/50 transition-colors"
                                      >
                                          <span className="font-medium text-slate-200 text-sm pr-4">{item.question}</span>
                                          {expandedQuestion === `tech-${i}` ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                      </button>
                                      {expandedQuestion === `tech-${i}` && (
                                          <div className="p-4 pt-0 text-sm text-slate-400 border-t border-slate-800/50 bg-slate-900/20">
                                              <p className="font-mono text-xs text-indigo-400 mb-1">Suggested Answer:</p>
                                              {item.answer}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Behavioral Tab */}
                      {activeTab === 2 && (
                          <div className="space-y-4 animate-fade-in">
                              <div className="flex flex-wrap gap-2 mb-4">
                                  {result.behavioral.competencies.map((comp, i) => (
                                      <span key={i} className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded border border-purple-900/50">{comp}</span>
                                  ))}
                              </div>
                              {result.behavioral.questions.map((item, i) => (
                                  <div key={i} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                                      <button 
                                          onClick={() => toggleQuestion(`beh-${i}`)}
                                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/50 transition-colors"
                                      >
                                          <span className="font-medium text-slate-200 text-sm pr-4">{item.question}</span>
                                          {expandedQuestion === `beh-${i}` ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                      </button>
                                      {expandedQuestion === `beh-${i}` && (
                                          <div className="p-4 pt-0 text-sm text-slate-400 border-t border-slate-800/50 bg-slate-900/20">
                                              <p className="font-bold text-xs text-emerald-400 mb-1 flex items-center gap-1"><Sparkles size={10} /> STAR Guide:</p>
                                              {item.starGuide}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Questions to Ask Tab */}
                      {activeTab === 3 && (
                          <div className="space-y-4 animate-fade-in">
                              <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/20 mb-6">
                                  <p className="text-sm text-indigo-200">
                                      Asking smart questions shows you've done your homework. Pick 2-3 of these to ask at the end.
                                  </p>
                              </div>
                              <ul className="space-y-3">
                                  {result.questionsToAsk.map((q, i) => (
                                      <li key={i} className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                          <MessageCircleQuestion size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                                          <span className="text-sm text-slate-300">{q}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}

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

const AgentDocs = () => {
  const { resume } = useJobContext();
  const { isDemoMode } = useAuth();
  const [docType, setDocType] = useState('Cover Letter');
  const [template, setTemplate] = useState('Direct & Impactful');
  const [tone, setTone] = useState('Professional');
  const [jd, setJd] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const docTypes = ['Cover Letter', 'Resume Bullets', 'LinkedIn Message', 'Follow-up Email'];
  const templates = {
    'Cover Letter': ['Direct & Impactful', 'T-Format', 'Pain Letter'],
    'Resume Bullets': ['STAR Method', 'Data-Driven', 'Leadership Focus'],
    'LinkedIn Message': ['Referral Request', 'Hiring Manager Outreach', 'Coffee Chat Request'],
    'Follow-up Email': ['Post-Interview Thanks', 'Checking Status']
  };
  const tones = ['Professional', 'Enthusiastic', 'Confident', 'Creative'];

  const DEMO_JD = `Senior Product Manager
  
  We are looking for a Senior Product Manager to lead our mobile app team.
  
  Responsibilities:
  - Define product strategy and roadmap.
  - Work closely with engineering and design teams.
  - Analyze user data to drive product decisions.
  - Launch new features and improvements.
  
  Requirements:
  - 5+ years of product management experience.
  - Experience with mobile apps (iOS/Android).
  - Strong analytical skills (SQL, Amplitude).
  - Excellent communication and leadership skills.`;

  const DEMO_OUTPUTS = {
      'Cover Letter': `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Product Manager role at your company. With over 6 years of experience leading mobile product teams and a proven track record of launching successful features, I am confident in my ability to drive your mobile app strategy forward.

In my current role, I led the redesign of our core mobile app, resulting in a 20% increase in user retention and a 15% boost in daily active users. I worked closely with engineering to implement a new analytics framework, enabling us to make data-driven decisions that reduced churn by 10%.

I am particularly drawn to this opportunity because of your commitment to user-centric design and innovation. My experience aligns perfectly with your requirements for mobile expertise and analytical rigor.

I would welcome the opportunity to discuss how my background and skills can contribute to your team's success. Thank you for considering my application.

Sincerely,
[Your Name]`,
      'Resume Bullets': `• Spearheaded the launch of a new mobile feature that increased daily active users by 15% within the first quarter.
• Defined and executed the product roadmap for the mobile team, aligning with company-wide strategic goals.
• Analyzed user behavior using SQL and Amplitude to identify friction points, leading to a 10% reduction in churn.
• Collaborated cross-functionally with engineering and design to deliver high-quality mobile experiences on time and within budget.`,
      'LinkedIn Message': `Hi [Hiring Manager Name],

I hope you're having a great week.

I've been following [Company Name]'s work in the mobile space for a while, and I'm really impressed by your recent [Specific Feature/Launch].

I'm a Senior Product Manager with 6 years of experience building mobile apps, and I recently saw the opening for the Senior PM role on your team. I believe my background in data-driven product development and mobile strategy would be a great fit.

I'd love to connect and learn more about the team's vision for the upcoming year.

Best regards,
[Your Name]`,
      'Follow-up Email': `Subject: Follow-up on Senior Product Manager Interview - [Your Name]

Dear [Interviewer Name],

Thank you so much for taking the time to speak with me yesterday about the Senior Product Manager role. I really enjoyed learning more about the team's focus on [Specific Topic Discussed] and the challenges you're tackling with the mobile app.

Our conversation further reinforced my interest in the position. I am confident that my experience in [Key Skill 1] and [Key Skill 2] would allow me to hit the ground running and make an immediate impact.

Please let me know if you have any additional questions or need any further information from me. I look forward to hearing from you soon.

Best regards,
[Your Name]`
  };

  const loadDemoData = () => {
      setJd(DEMO_JD);
      setOutput('');
  };

  const handleGenerate = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setCopied(false);

    if (isDemoMode && jd === DEMO_JD) {
        setTimeout(() => {
            // @ts-ignore
            const demoOutput = DEMO_OUTPUTS[docType] || "Demo content not available for this type.";
            setOutput(demoOutput);
            setLoading(false);
        }, 1500);
        return;
    }

    try {
      const text = await runAgentDocumentGen({
        type: docType,
        template,
        tone,
        jd,
        resume,
        additionalContext: context
      });
      setOutput(text);
    } catch (e) {
      console.error(e);
      alert("Generation failed. Check API Key or Input length.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">
            <Crown size={14} className="fill-indigo-400" /> Premium Content Studio
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Strategic Document Architect</h2>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
           {isDemoMode && (
               <button 
                onClick={loadDemoData}
                className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-colors border border-emerald-500/30"
               >
                 <Sparkles size={12} /> DEMO
               </button>
           )}
           <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold">
              <Check size={12} /> RESUME LOADED
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold">
              <Zap size={12} /> AUTO-FILL ACTIVE
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                <FileText size={12} /> Document Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {docTypes.map(t => (
                  <button 
                    key={t}
                    onClick={() => {
                      setDocType(t);
                      setTemplate(templates[t as keyof typeof templates][0]);
                    }}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all ${docType === t ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                <SettingsIcon size={12} /> Strategic Template
              </label>
              <div className="space-y-2">
                {(templates[docType as keyof typeof templates] || []).map(t => (
                  <button 
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`w-full text-left px-4 py-2 text-xs font-medium rounded-xl border transition-all flex items-center justify-between group ${template === t ? 'bg-slate-800 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}
                  >
                    {t}
                    <div className={`w-1.5 h-1.5 rounded-full ${template === t ? 'bg-indigo-500' : 'bg-slate-700 group-hover:bg-slate-500'}`}></div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                <Languages size={12} /> Style Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {tones.map(t => (
                  <button 
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${tone === t ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 space-y-4 flex-1">
            <div>
              <label className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <span>Job Description Source</span>
                <span className="text-indigo-500 lowercase opacity-60">paste to analyze</span>
              </label>
              <textarea 
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-slate-700"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the target JD here..."
              />
            </div>
            <div>
              <label className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <span>Refining Context</span>
                <span className="text-slate-600 lowercase font-normal italic">optional</span>
              </label>
              <textarea 
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-slate-700"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Focus on my experience with Python and my latest project..."
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading || !jd.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-indigo-900/30 group active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />}
              {loading ? 'Strategizing...' : 'Generate Document'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-[2rem] p-4 flex flex-col h-full relative">
            <div className="absolute top-0 right-10 w-40 h-40 bg-indigo-500/5 blur-3xl rounded-full"></div>
            
            <div className="flex justify-between items-center mb-4 px-2">
               <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
               </div>
               
               {output && (
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition-all border border-slate-700"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all"
                      onClick={() => window.print()}
                    >
                      Print
                    </button>
                 </div>
               )}
            </div>

            <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-inner relative flex flex-col p-8 md:p-12 text-slate-800 custom-scrollbar mx-2 mb-2 group">
               {output ? (
                 <div className="animate-fade-in relative z-10 h-full flex flex-col">
                    <textarea 
                        className="w-full flex-1 bg-transparent border-none outline-none resize-none font-serif text-base leading-[1.8] text-slate-800 placeholder:text-slate-300"
                        value={output}
                        onChange={(e) => setOutput(e.target.value)}
                        placeholder="Generated document..."
                    />
                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot size={16} className="text-indigo-600" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Architected by JobJumper v2.5</span>
                        </div>
                        <span className="text-[10px] text-slate-300 font-mono">Character Count: {output.length}</span>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
                    <div className="p-8 bg-slate-50 rounded-full mb-6">
                        <PenTool size={64} className="text-slate-100" />
                    </div>
                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest mb-2">Paper is Blank</h3>
                    <p className="max-w-xs text-center text-slate-400 text-sm leading-relaxed">
                        Select a strategy and paste a job description on the left to start drafting.
                    </p>
                 </div>
               )}
            </div>
        </div>
      </div>
    </div>
  );
};

const AgentResearch: React.FC<{
  researchState: ResearchState;
  setResearchState: React.Dispatch<React.SetStateAction<ResearchState>>;
  onRunResearch: () => void;
}> = ({ researchState, setResearchState, onRunResearch }) => {
  const { researchHistory, deleteResearchReport } = useJobContext();
  const { company, role, loading, report, error } = researchState;
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'market', label: 'Market & News' },
      { id: 'culture', label: 'Culture & Comp' },
      { id: 'reviews', label: 'Reviews & Risks' },
  ];

  const loadReport = (item: ResearchReport) => {
       try {
           const parsed = JSON.parse(item.content);
           const validated = validateResearchResult(parsed);
           
           setResearchState({
               company: item.company,
               role: item.role,
               loading: false,
               report: validated,
               rawMarkdown: null,
               error: null
           });
       } catch(e) { console.error("Failed to load report", e); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Company Intelligence Agent</h2>
            <p className="text-slate-400 text-sm md:text-base">Deep-dive research on potential employers.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Target Company</label>
                       <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                             value={company} 
                             onChange={e => setResearchState(prev => ({...prev, company: e.target.value}))} 
                             placeholder="e.g. Airbnb" 
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Target Role</label>
                       <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                             value={role} 
                             onChange={e => setResearchState(prev => ({...prev, role: e.target.value}))} 
                             placeholder="e.g. Staff Software Engineer" 
                          />
                       </div>
                    </div>
                    <button 
                       onClick={onRunResearch}
                       disabled={loading || !company || !role}
                       className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-indigo-900/20"
                    >
                       {loading ? <Loader2 className="animate-spin" size={18} /> : <Telescope size={18} />}
                       {loading ? 'Gathering Intel...' : 'Start Deep Scan'}
                    </button>
                 </div>
              </div>

              {/* Research History List */}
              {researchHistory.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <History size={14} /> Recent Intel
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {researchHistory.map((item) => (
                              <div 
                                  key={item.id}
                                  onClick={() => loadReport(item)}
                                  className={`p-3 rounded-xl cursor-pointer transition-all border group relative ${
                                      report && company === item.company && role === item.role
                                      ? 'bg-indigo-900/20 border-indigo-500/50' 
                                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                                  }`}
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-sm text-white truncate pr-6">{item.company}</span>
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); deleteResearchReport(item.id); }}
                                          className="text-slate-600 hover:text-rose-500 p-1 rounded transition-colors"
                                      >
                                          <Trash2 size={12} />
                                      </button>
                                  </div>
                                  <p className="text-xs text-slate-400 truncate mb-1">{item.role}</p>
                                  <p className="text-[10px] text-slate-600">{new Date(item.date).toLocaleDateString()}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Sources Widget (if report exists) */}
              {report && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sources Analyzed</h4>
                      <ul className="space-y-3">
                          {report.sources.map((source, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs">
                                  <LinkIcon size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-400 truncate hover:underline block max-w-[250px]">
                                      {source.title}
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8">
              {error ? (
                  <div className="h-full border-2 border-dashed border-rose-900/30 bg-rose-950/10 rounded-2xl flex flex-col items-center justify-center text-rose-400 p-8 text-center space-y-4">
                      <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-rose-200">Analysis Halted</h3>
                      <p className="text-sm text-rose-300/80 max-w-sm">{error}</p>
                      <button 
                          onClick={onRunResearch} 
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-300 text-sm transition-colors"
                      >
                          Try Again
                      </button>
                  </div>
              ) : report ? (
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[700px]">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 bg-slate-950/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{report.companyName}</h3>
                                <p className="text-indigo-400 font-medium">{report.roleTitle}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-white">{report.summary.opportunityScore}/10</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Opportunity Score</div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                        activeTab === tab.id 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <Bot size={16} className="text-indigo-400" /> Executive Summary
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{report.companyIntelligence.overview}</p>
                                    
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className={`px-2 py-1 rounded bg-slate-950 border border-slate-800 font-medium ${
                                            report.summary.applyPriority === 'High' ? 'text-emerald-400' : 
                                            report.summary.applyPriority === 'Medium' ? 'text-amber-400' : 'text-slate-400'
                                        }`}>
                                            Priority: {report.summary.applyPriority}
                                        </span>
                                        <span className="text-slate-500">Verdict: {report.summary.verdict}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Financial Health</p>
                                        <p className="text-sm text-white font-medium">{report.companyIntelligence.financialHealth}</p>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Size & Stage</p>
                                        <p className="text-sm text-white font-medium">{report.companyIntelligence.sizeAndStage}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recommended Next Steps</h4>
                                    <ul className="space-y-2">
                                        {report.summary.nextSteps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* MARKET TAB */}
                        {activeTab === 'market' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3">Market Position</h4>
                                    <p className="text-sm text-slate-400 p-4 bg-slate-950 rounded-xl border border-slate-800">{report.marketAnalysis.marketPosition}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3">Recent News & Signals</h4>
                                    <div className="space-y-3">
                                        {report.marketAnalysis.recentNews.map((news, i) => (
                                            <div key={i} className="flex gap-3 items-start p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                <Globe size={16} className="text-blue-500 mt-1 shrink-0" />
                                                <p className="text-sm text-slate-300">{news}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3">Key Competitors</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {report.companyIntelligence.competitors.map((comp, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">{comp}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CULTURE & COMP TAB */}
                        {activeTab === 'culture' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-xl p-5">
                                        <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-sm">
                                            <IndianRupee size={16} /> Compensation Analysis
                                        </div>
                                        <div className="text-2xl font-bold text-white mb-1">{report.compensation.salaryRange}</div>
                                        <p className="text-xs text-slate-500 mb-4">{report.compensation.comparison}</p>
                                        
                                        <div className="space-y-2 pt-4 border-t border-white/10">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Junior</span>
                                                <span className="text-slate-200">{report.compensation.breakdown.fresher}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Mid-Level</span>
                                                <span className="text-slate-200">{report.compensation.breakdown.mid}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Senior</span>
                                                <span className="text-slate-200">{report.compensation.breakdown.senior}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Work Environment</h5>
                                            <p className="text-sm text-slate-300">{report.culture.workEnvironment}</p>
                                        </div>
                                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Engineering Culture</h5>
                                            <p className="text-sm text-slate-300">{report.culture.engineeringCulture}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3">Benefits & Perks</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {report.compensation.benefits.map((benefit, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-slate-800 text-indigo-200 text-xs rounded-lg border border-slate-700">{benefit}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* REVIEWS & RISKS TAB */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center font-bold text-white">GD</div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Glassdoor</p>
                                                <p className="text-xs text-slate-400">{report.reviews.glassdoor.rating} Rating</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <p className="text-emerald-400"><strong className="text-slate-500">PROS:</strong> {report.reviews.glassdoor.pros}</p>
                                            <p className="text-rose-400"><strong className="text-slate-500">CONS:</strong> {report.reviews.glassdoor.cons}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center font-bold text-white">RD</div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Reddit Sentiment</p>
                                                <p className="text-xs text-slate-400">{report.reviews.reddit.sentiment}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            {report.reviews.reddit.keyDiscussions.map((d, i) => (
                                                <p key={i} className="text-xs text-slate-300">• {d}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-5 rounded-xl border ${
                                    report.risks.level === 'High' ? 'bg-rose-950/20 border-rose-500/30' : 
                                    report.risks.level === 'Medium' ? 'bg-amber-950/20 border-amber-500/30' : 'bg-emerald-950/20 border-emerald-500/30'
                                }`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${
                                        report.risks.level === 'High' ? 'text-rose-400' : 
                                        report.risks.level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                                    }`}>
                                        <AlertOctagon size={16} /> Risk Analysis: {report.risks.level}
                                    </h4>
                                    <ul className="space-y-2">
                                        {report.risks.concerns.map((risk, i) => (
                                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0"></span>
                                                {risk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3">Employee Voices</h4>
                                    <div className="space-y-3">
                                        {report.reviews.employeeVoices.map((voice, i) => (
                                            <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                <p className="text-xs text-slate-400 italic mb-2">"{voice.quote}"</p>
                                                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold">
                                                    <span>{voice.source}</span>
                                                    <span className={
                                                        voice.sentiment === 'Positive' ? 'text-emerald-500' : 
                                                        voice.sentiment === 'Negative' ? 'text-rose-500' : 'text-amber-500'
                                                    }>{voice.sentiment}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
              ) : (
                 <div className="h-full border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-8 text-center bg-slate-900/20">
                    <Telescope size={64} className="mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-slate-500">No Intelligence Data</h3>
                    <p className="text-sm text-slate-600 max-w-sm mt-2">Enter a company and role on the left to deploy the deep research agent.</p>
                 </div>
              )}
          </div>
       </div>
    </div>
  );
};

export default AgentsDashboard;
