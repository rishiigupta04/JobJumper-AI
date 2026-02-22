import React, { useState, useMemo, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { generateInterviewGuide, generateNegotiationStrategy } from '../services/geminiService';
import { 
  Search, Plus, MapPin, Calendar, IndianRupee, Trash2, X, 
  Sparkles, RefreshCw, User, Mail, Phone, ExternalLink,
  ChevronRight, Building2, BookOpen, HandCoins, FileText, ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Job } from '../types';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const Offers: React.FC = () => {
  const { jobs, deleteJob, addJob, updateJob } = useJobContext();
  const offers = jobs.filter(j => j.status === 'Offer' || j.status === 'Accepted');
  
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State
  const [activeTab, setActiveTab] = useState<'interview' | 'negotiation' | 'details'>('interview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // AI State - Loading only (Data is now in Job object)
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Add Offer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOffer, setNewOffer] = useState<Partial<Job>>({
    company: '',
    role: '',
    salary: '',
    location: '',
    description: '',
    status: 'Offer'
  });

  const selectedJob = useMemo(() => 
    jobs.find(j => j.id === selectedOfferId) || null, // Don't auto-select first on mobile logic
  [jobs, selectedOfferId]);

  // Auto-select first offer on Desktop only initially
  useEffect(() => {
    if (window.innerWidth >= 1024 && !selectedOfferId && offers.length > 0) {
      setSelectedOfferId(offers[0].id);
    }
  }, [offers]);

  const filteredOffers = offers.filter(job => 
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateInterview = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedJob) return;

    const jobId = selectedJob.id;
    setLoading(prev => ({ ...prev, [`int_${jobId}`]: true }));
    
    const guide = await generateInterviewGuide(
        selectedJob.role, 
        selectedJob.company, 
        selectedJob.description
    );
    
    // Persist to Job Context
    updateJob(jobId, { interviewGuide: guide });
    setLoading(prev => ({ ...prev, [`int_${jobId}`]: false }));
  };

  const handleGenerateNegotiation = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedJob) return;

    const jobId = selectedJob.id;
    setLoading(prev => ({ ...prev, [`neg_${jobId}`]: true }));
    
    const strategy = await generateNegotiationStrategy(
        selectedJob.role, 
        selectedJob.company, 
        selectedJob.salary || "Not specified",
        selectedJob.description
    );
    
    // Persist to Job Context
    updateJob(jobId, { negotiationStrategy: strategy });
    setLoading(prev => ({ ...prev, [`neg_${jobId}`]: false }));
  };

  const handleExportPDF = async () => {
      if (!selectedJob) return;
      const element = document.getElementById('offer-content-export');
      if (element) {
          const opt = {
              margin: 1,
              filename: `${selectedJob.company}_${activeTab}_Guide.pdf`,
              image: { type: 'jpeg' as const, quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
          };
          
          try {
              // @ts-ignore
              const html2pdf = (await import('html2pdf.js')).default;
              html2pdf().set(opt).from(element).save();
          } catch (e) {
              console.error("Failed to load html2pdf", e);
              window.print();
          }
      }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this offer?')) {
      deleteJob(id);
      if (selectedOfferId === id) setSelectedOfferId(null);
    }
  };

  const handleSaveNewOffer = () => {
    if (!newOffer.company || !newOffer.role) return;
    
    const job: Job = {
      id: generateId(),
      company: newOffer.company,
      role: newOffer.role,
      status: 'Offer',
      salary: newOffer.salary || '',
      location: newOffer.location || '',
      dateApplied: new Date().toISOString().split('T')[0],
      description: newOffer.description || '',
      coverLetter: '',
      origin: 'offer',
      resumeVersion: '',
      attachments: [],
      contacts: [],
      checklist: [],
      interviewLogs: []
    };
    
    addJob(job);
    setIsAddModalOpen(false);
    setSelectedOfferId(job.id);
    setNewOffer({ company: '', role: '', salary: '', location: '', description: '', status: 'Offer' });
  };

  const cardBase = "p-4 rounded-xl border transition-all cursor-pointer relative group";
  const activeCard = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500 shadow-sm";
  const inactiveCard = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md";

  // Markdown Custom Styling
  const MarkdownComponents = {
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-slate-800 dark:text-emerald-400 mt-8 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-6 mb-3" {...props} />,
    ul: ({node, ...props}: any) => <ul className="space-y-3 mb-6" {...props} />,
    li: ({node, ...props}: any) => (
      <li className="flex gap-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
        <span className="flex-1" {...props} />
      </li>
    ),
    strong: ({node, ...props}: any) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
    blockquote: ({node, ...props}: any) => (
      <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg italic text-slate-600 dark:text-slate-300 shadow-sm" {...props} />
    ),
    p: ({node, ...props}: any) => <p className="mb-4 leading-relaxed text-slate-600 dark:text-slate-400" {...props} />
  };

  if (offers.length === 0 && !isAddModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-full animate-pulse">
           <Sparkles size={64} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">No Offers Yet?</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mt-2 mx-auto">
            Keep applying! When you get an offer, log it here to unlock AI negotiation superpowers.
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Log First Offer
        </button>
        
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Log New Offer</h3>
                <div className="space-y-4">
                   <input className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" placeholder="Company Name" value={newOffer.company} onChange={e => setNewOffer({...newOffer, company: e.target.value})} />
                   <input className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" placeholder="Role Title" value={newOffer.role} onChange={e => setNewOffer({...newOffer, role: e.target.value})} />
                   <input className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" placeholder="Salary (e.g. ₹12,00,000)" value={newOffer.salary} onChange={e => setNewOffer({...newOffer, salary: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                   <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500">Cancel</button>
                   <button onClick={handleSaveNewOffer} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Save Offer</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className={`flex justify-between items-center mb-6 ${selectedOfferId ? 'hidden lg:flex' : 'flex'}`}>
         <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Offers Received</h2>
            <p className="text-slate-500 text-sm">{offers.length} Active Offers</p>
         </div>
         <button 
           onClick={() => setIsAddModalOpen(true)}
           className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-emerald-200 dark:shadow-none transition-colors flex items-center gap-2"
         >
           <Plus size={18} /> Log New Offer
         </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden relative">
        
        {/* Left Column: List (Hidden on mobile when an offer is selected) */}
        <div className={`w-full lg:w-1/3 flex flex-col gap-4 overflow-hidden ${selectedOfferId ? 'hidden lg:flex' : 'flex'}`}>
           {/* Search */}
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Search by company or role..." 
                 className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           {/* Cards Container */}
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-20 lg:pb-0">
              {filteredOffers.map(job => (
                 <div 
                    key={job.id}
                    onClick={() => setSelectedOfferId(job.id)}
                    className={`${cardBase} ${selectedOfferId === job.id ? activeCard : inactiveCard}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${selectedOfferId === job.id ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                             {job.company.charAt(0)}
                          </div>
                          <div>
                             <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{job.role}</h3>
                             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{job.company}</p>
                          </div>
                       </div>
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                          {job.status}
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-4 px-1">
                       <span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500"/> {job.location || 'Remote'}</span>
                       {job.salary && <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300"><IndianRupee size={14} className="text-emerald-500"/> {job.salary}</span>}
                    </div>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-slate-300">
                        <ChevronRight size={20} />
                    </div>

                    <button 
                       onClick={(e) => handleDelete(e, job.id)}
                       className="absolute bottom-4 right-4 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 hidden lg:block"
                    >
                       <Trash2 size={16} />
                    </button>
                 </div>
              ))}
           </div>
        </div>

        {/* Right Column: Details - MAXIMIZED SPACE (Full width on mobile when selected) */}
        <div className={`flex-1 bg-white dark:bg-slate-900 lg:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden fixed inset-0 z-50 lg:static lg:z-0 lg:flex ${selectedOfferId ? 'flex' : 'hidden lg:flex'} ${isFullscreen ? 'fixed inset-0 z-[100] !rounded-none' : ''}`}>
           {selectedJob ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                 
                 {/* Navigation Bar (Clean, Minimal) */}
                 <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 px-2 lg:px-4 py-2 lg:py-0">
                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-hidden">
                        {/* Mobile Back Button */}
                        <button 
                            onClick={() => setSelectedOfferId(null)} 
                            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        
                        {/* Tabs */}
                        <div className="flex gap-1 overflow-x-auto flex-1 no-scrollbar">
                            <button 
                                onClick={() => setActiveTab('interview')}
                                className={`px-3 lg:px-4 py-4 text-xs lg:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'interview' 
                                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <BookOpen size={16} /> 
                                <span className="hidden sm:inline">Interview Prep</span>
                                <span className="sm:hidden">Prep</span>
                                {selectedJob.interviewGuide && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('negotiation')}
                                className={`px-3 lg:px-4 py-4 text-xs lg:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'negotiation' 
                                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <HandCoins size={16} /> 
                                <span className="hidden sm:inline">Negotiation</span>
                                <span className="sm:hidden">Negotiate</span>
                                {selectedJob.negotiationStrategy && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('details')}
                                className={`px-3 lg:px-4 py-4 text-xs lg:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'details' 
                                        ? 'border-slate-400 text-slate-800 dark:text-white bg-white dark:bg-slate-900' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <FileText size={16} /> Details
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 ml-2 gap-1">
                        {(activeTab === 'interview' || activeTab === 'negotiation') && (
                            <>
                                <button onClick={handleExportPDF} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Export PDF">
                                    <FileText size={18} />
                                </button>
                                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                                    {isFullscreen ? <X size={18} /> : <ExternalLink size={18} />}
                                </button>
                            </>
                        )}
                        <button onClick={(e) => handleDelete(e, selectedJob.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Delete Offer">
                            <Trash2 size={18} />
                        </button>
                    </div>
                 </div>

                 {/* Content Area - Full Height */}
                 <div id="offer-content-export" className="flex-1 overflow-y-auto p-4 md:p-8 bg-white dark:bg-slate-900 custom-scrollbar pb-24 lg:pb-0">
                    
                    {/* Interview Guide Tab */}
                    {activeTab === 'interview' && (
                        <div className="animate-fade-in max-w-4xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{selectedJob.role} Guide</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">AI-generated strategy based on the JD.</p>
                                </div>
                                <button 
                                    onClick={handleGenerateInterview}
                                    disabled={loading[`int_${selectedJob.id}`]}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none w-full sm:w-auto"
                                >
                                    {loading[`int_${selectedJob.id}`] ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    {loading[`int_${selectedJob.id}`] ? 'Analyzing...' : (selectedJob.interviewGuide ? 'Regenerate' : 'Generate Guide')}
                                </button>
                            </div>
                            
                            {selectedJob.interviewGuide ? (
                                <div className="prose prose-emerald max-w-none dark:prose-invert prose-sm md:prose-base">
                                    <ReactMarkdown components={MarkdownComponents}>
                                        {selectedJob.interviewGuide}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-full mb-4 shadow-sm">
                                        <BookOpen size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Ready to Prep?</h3>
                                    <p className="text-sm max-w-xs text-center mb-6">Generate a tailored interview guide covering core competencies and likely questions.</p>
                                    <button 
                                        onClick={handleGenerateInterview}
                                        className="text-emerald-600 font-bold hover:underline"
                                    >
                                        Generate Guide Now &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Negotiation Tab */}
                    {activeTab === 'negotiation' && (
                        <div className="animate-fade-in max-w-4xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Negotiation Strategy</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Maximize your offer for {selectedJob.company}.</p>
                                </div>
                                <button 
                                    onClick={handleGenerateNegotiation}
                                    disabled={loading[`neg_${selectedJob.id}`]}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-purple-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none w-full sm:w-auto"
                                >
                                    {loading[`neg_${selectedJob.id}`] ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    {loading[`neg_${selectedJob.id}`] ? 'Analyzing...' : (selectedJob.negotiationStrategy ? 'Regenerate' : 'Create Strategy')}
                                </button>
                            </div>
                            
                            {selectedJob.negotiationStrategy ? (
                                <div className="prose prose-purple max-w-none dark:prose-invert prose-sm md:prose-base">
                                    <ReactMarkdown components={MarkdownComponents}>
                                        {selectedJob.negotiationStrategy}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-full mb-4 shadow-sm">
                                        <HandCoins size={40} className="text-purple-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Negotiate Better</h3>
                                    <p className="text-sm max-w-xs text-center mb-6">Get a market analysis, leverage points, and a specific script to ask for more.</p>
                                    <button 
                                        onClick={handleGenerateNegotiation}
                                        className="text-purple-600 font-bold hover:underline"
                                    >
                                        Create Strategy Now &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Job Details Tab */}
                    {activeTab === 'details' && (
                         <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
                             
                             {/* Key Info Cards */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-xs tracking-wider mb-2">
                                        <IndianRupee size={14} /> Salary Offer
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {selectedJob.salary || 'Not specified'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider mb-2">
                                        <User size={14} /> Primary Contact
                                    </div>
                                    <div className="text-sm">
                                        {selectedJob.contacts && selectedJob.contacts.length > 0 ? (
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-lg">{selectedJob.contacts[0].name}</p>
                                                <div className="flex items-center gap-2 text-slate-500 mt-1">
                                                    <Mail size={14} /> {selectedJob.contacts[0].email}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">No contact info available</span>
                                        )}
                                    </div>
                                </div>
                             </div>

                             <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Job Description</h3>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    {selectedJob.description ? (
                                        <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {selectedJob.description}
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 italic text-sm text-center py-8">
                                            No description provided. Add one to get better AI insights.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                 </div>
              </div>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                 <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
                    <Sparkles size={32} className="text-emerald-400" />
                 </div>
                 <p className="font-medium">Select an offer to view details & strategy</p>
              </div>
           )}
        </div>
      </div>

      {/* Add Offer Modal */}
      {isAddModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Log New Offer</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
                         <input 
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                            placeholder="e.g. Acme Corp" 
                            value={newOffer.company} 
                            onChange={e => setNewOffer({...newOffer, company: e.target.value})} 
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                         <input 
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                            placeholder="e.g. Product Designer" 
                            value={newOffer.role} 
                            onChange={e => setNewOffer({...newOffer, role: e.target.value})} 
                         />
                      </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salary / Package</label>
                     <input 
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="e.g. ₹12,00,000 + Equity" 
                        value={newOffer.salary} 
                        onChange={e => setNewOffer({...newOffer, salary: e.target.value})} 
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                     <input 
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="e.g. Remote" 
                        value={newOffer.location} 
                        onChange={e => setNewOffer({...newOffer, location: e.target.value})} 
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Description</label>
                     <textarea 
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-y" 
                        placeholder="Paste the JD here to generate better AI advice..." 
                        value={newOffer.description} 
                        onChange={e => setNewOffer({...newOffer, description: e.target.value})} 
                     />
                  </div>
               </div>

               <div className="flex justify-end gap-3 mt-8">
                  <button 
                     onClick={() => setIsAddModalOpen(false)} 
                     className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={handleSaveNewOffer} 
                     className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                  >
                     Save Offer
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Offers;