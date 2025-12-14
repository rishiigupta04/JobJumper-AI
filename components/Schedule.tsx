import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { Calendar as CalendarIcon, Clock, CheckSquare, Square, Briefcase } from 'lucide-react';
import { Job } from '../types';

const Schedule: React.FC = () => {
  const { jobs, updateJob } = useJobContext();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  // Filter jobs that have an interview date and sort them
  const scheduledJobs = jobs
    .filter(j => j.interviewDate)
    .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime());

  const upcomingJobs = scheduledJobs.filter(j => new Date(j.interviewDate!).getTime() > Date.now());

  const nextInterview = upcomingJobs[0];

  useEffect(() => {
    if (!nextInterview || !nextInterview.interviewDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(nextInterview.interviewDate!).getTime() - now;

      if (distance < 0) {
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        });
      }
    }, 60000); // Update every minute to save resources

    // Initial call
    const now = new Date().getTime();
    const distance = new Date(nextInterview.interviewDate!).getTime() - now;
    if (distance > 0) {
        setTimeLeft({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        });
    }

    return () => clearInterval(interval);
  }, [nextInterview]);

  const toggleChecklistItem = (job: Job, itemId: string) => {
    const updatedChecklist = job.checklist?.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateJob(job.id, { checklist: updatedChecklist });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
           <CalendarIcon size={24} />
        </div>
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Interview Schedule</h2>
           <p className="text-slate-500 dark:text-slate-400">Track upcoming interviews and preparation tasks.</p>
        </div>
      </div>

      {/* Countdown Hero */}
      {nextInterview ? (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
            <Clock size={200} />
          </div>
          <div className="relative z-10">
             <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
                Next Interview
             </div>
             <h1 className="text-4xl font-bold mb-2">{nextInterview.role}</h1>
             <p className="text-indigo-100 text-lg mb-6">at {nextInterview.company}</p>
             
             {timeLeft && (
               <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[100px] text-center border border-white/10">
                     <div className="text-3xl font-bold">{timeLeft.days}</div>
                     <div className="text-xs text-indigo-200 uppercase tracking-wider">Days</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[100px] text-center border border-white/10">
                     <div className="text-3xl font-bold">{timeLeft.hours}</div>
                     <div className="text-xs text-indigo-200 uppercase tracking-wider">Hours</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[100px] text-center border border-white/10">
                     <div className="text-3xl font-bold">{timeLeft.minutes}</div>
                     <div className="text-xs text-indigo-200 uppercase tracking-wider">Mins</div>
                  </div>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-800">
           <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <CalendarIcon size={32} />
           </div>
           <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No Interviews Scheduled</h3>
           <p className="text-slate-500 dark:text-slate-400 mt-2">Add an interview date to your applications to see the countdown.</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
           <Briefcase size={20} className="text-slate-400" />
           Upcoming Timeline
        </h3>
        
        {scheduledJobs.length > 0 ? (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-4">
            {scheduledJobs.map((job) => {
               const date = new Date(job.interviewDate!);
               const isPast = date.getTime() < Date.now();

               return (
                 <div key={job.id} className="relative pl-8">
                    {/* Dot */}
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${
                        isPast ? 'bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700' : 'bg-white dark:bg-slate-950 border-indigo-600'
                    }`}></div>
                    
                    <div className={`bg-white dark:bg-slate-900 rounded-xl p-5 border shadow-sm ${
                        isPast ? 'border-slate-100 dark:border-slate-800 opacity-75' : 'border-indigo-100 dark:border-indigo-900/50'
                    }`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${
                                    isPast ? 'text-slate-500' : 'text-indigo-600 dark:text-indigo-400'
                                }`}>
                                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{job.role}</h4>
                                <p className="text-slate-600 dark:text-slate-400">{job.company}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                job.status === 'Interview' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                            }`}>
                                {job.status}
                            </span>
                        </div>

                        {/* Checklist */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-4">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preparation Checklist</h5>
                            <div className="space-y-2">
                                {job.checklist && job.checklist.length > 0 ? (
                                    job.checklist.map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => toggleChecklistItem(job, item.id)}
                                            className="flex items-center gap-3 w-full text-left hover:bg-slate-100 dark:hover:bg-slate-900 p-2 rounded transition-colors group"
                                        >
                                            <div className={`text-slate-400 ${item.completed ? 'text-emerald-500' : 'group-hover:text-indigo-500'}`}>
                                                {item.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </div>
                                            <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {item.text}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No checklist items added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>
               );
            })}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 italic">No scheduled interviews found.</p>
        )}
      </div>
    </div>
  );
};

export default Schedule;