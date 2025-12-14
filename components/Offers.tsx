import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { generateOfferStrategy } from '../services/geminiService';
import { CheckCircle, Award, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Offers: React.FC = () => {
  const { jobs } = useJobContext();
  const offers = jobs.filter(j => j.status === 'Offer' || j.status === 'Accepted');
  
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [advice, setAdvice] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleGenerateAdvice = async (jobId: string, role: string, company: string, salary: string) => {
    setLoading(prev => ({ ...prev, [jobId]: true }));
    const result = await generateOfferStrategy(role, company, salary);
    setAdvice(prev => ({ ...prev, [jobId]: result }));
    setLoading(prev => ({ ...prev, [jobId]: false }));
  };

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
          <Award size={48} className="text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">No Offers Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Keep applying! Once you mark a job as "Offer" or "Accepted", it will appear here with AI negotiation tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
           <Award size={24} />
        </div>
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Offers & Negotiation</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage your wins and get AI-powered negotiation tactics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
           {offers.map(job => (
             <div 
                key={job.id} 
                onClick={() => setSelectedOfferId(job.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  selectedOfferId === job.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-700' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md'
                }`}
             >
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{job.role}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{job.company}</p>
                   </div>
                   <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                      {job.status}
                   </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                   <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm">
                      {job.salary || 'Salary N/A'}
                   </span>
                   <ArrowRight size={18} className={`text-slate-400 ${selectedOfferId === job.id ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                </div>
             </div>
           ))}
        </div>

        {/* Details & AI Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 min-h-[500px]">
           {selectedOfferId ? (
             (() => {
                const job = offers.find(j => j.id === selectedOfferId)!;
                return (
                   <div className="space-y-6">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           {job.company} 
                           {job.status === 'Accepted' && <CheckCircle size={20} className="text-emerald-500" />}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">{job.role}</p>
                      </div>

                      {/* AI Action */}
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                               <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
                               AI Career Advisor
                            </h4>
                            {!advice[job.id] && (
                               <button 
                                  onClick={() => handleGenerateAdvice(job.id, job.role, job.company, job.salary)}
                                  disabled={loading[job.id]}
                                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                               >
                                  {loading[job.id] && <Loader2 className="animate-spin" size={14} />}
                                  {loading[job.id] ? 'Analyzing...' : 'Analyze Offer'}
                               </button>
                            )}
                         </div>
                         
                         {loading[job.id] && (
                            <div className="text-center py-8 text-purple-600 dark:text-purple-400">
                               <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                               <p className="text-sm">Generating negotiation strategy...</p>
                            </div>
                         )}

                         {advice[job.id] && (
                            <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 animate-fade-in bg-white dark:bg-slate-900 p-4 rounded-lg border border-purple-100 dark:border-purple-900 shadow-sm dark:prose-invert">
                               <ReactMarkdown>
                                  {advice[job.id]}
                               </ReactMarkdown>
                            </div>
                         )}

                         {!advice[job.id] && !loading[job.id] && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                               Click "Analyze Offer" to get a negotiation strategy, questions to ask, and a 90-day success plan using Gemini AI.
                            </p>
                         )}
                      </div>
                   </div>
                );
             })()
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p>Select an offer from the list to view details and AI insights.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Offers;