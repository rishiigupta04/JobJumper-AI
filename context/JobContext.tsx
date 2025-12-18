
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Job, Resume, ChatMessage, ResearchReport, InterviewPrepReport } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface JobContextType {
  jobs: Job[];
  resume: Resume;
  addJob: (job: Job) => void;
  updateJob: (id: string, updatedJob: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  updateResume: (resume: Resume) => void;
  loadDemoData: () => Promise<void>;
  stats: {
    total: number;
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  loading: boolean;
  
  // Chat Persistence
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  isChatInitialized: boolean;
  setChatInitialized: (initialized: boolean) => void;

  // Research Persistence
  researchHistory: ResearchReport[];
  addResearchReport: (report: ResearchReport) => void;
  deleteResearchReport: (id: string) => void;

  // Prep Persistence
  prepHistory: InterviewPrepReport[];
  addPrepReport: (report: InterviewPrepReport) => void;
  deletePrepReport: (id: string) => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

const DEFAULT_RESUME: Resume = {
  fullName: "",
  email: "",
  phone: "",
  linkedin: "",
  location: "",
  skills: "",
  summary: "",
  experience: [],
  projects: [],
  education: [],
  jobTitle: "",
  avatarImage: ""
};

export const JobProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resume, setResume] = useState<Resume>(DEFAULT_RESUME);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatInitialized, setChatInitialized] = useState(false);

  // Research State
  const [researchHistory, setResearchHistory] = useState<ResearchReport[]>([]);

  // Prep State
  const [prepHistory, setPrepHistory] = useState<InterviewPrepReport[]>([]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved as 'light' | 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Fetch Data from Supabase
  useEffect(() => {
    if (!user) {
        setJobs([]);
        setResume(DEFAULT_RESUME);
        setChatMessages([]);
        setResearchHistory([]);
        setPrepHistory([]);
        setLoading(false);
        isInitialLoad.current = true;
        return;
    }

    const fetchData = async () => {
      // Only set global loading for the VERY FIRST time for this user session
      if (isInitialLoad.current) {
        setLoading(true);
      }
      
      try {
          // Fetch Jobs
          const { data: jobData, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (jobData) {
            const loadedJobs = jobData.map(row => ({
              ...row.content,
              id: row.id
            }));
            setJobs(loadedJobs);
          }

          // Fetch Profile/Resume AND Chat History
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData) {
            if (profileData.resume_data) {
               setResume(prev => ({ ...DEFAULT_RESUME, ...profileData.resume_data }));
            }
            
            if (profileData.chat_history && Array.isArray(profileData.chat_history)) {
               setChatMessages(profileData.chat_history);
               if (profileData.chat_history.length > 0) {
                 setChatInitialized(true);
               }
            } else {
                const localChat = localStorage.getItem(`chat_history_${user.id}`);
                if (localChat) {
                    try {
                        const parsed = JSON.parse(localChat);
                        setChatMessages(parsed);
                        if (parsed.length > 0) setChatInitialized(true);
                    } catch (e) {}
                }
            }
          } else if (!profileError) {
             // Create profile if missing
             await supabase.from('profiles').upsert({ id: user.id, resume_data: DEFAULT_RESUME }, { onConflict: 'id' });
          }

          // Load Research Reports
          const { data: reportsData } = await supabase
            .from('research_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (reportsData) {
             const mappedReports = reportsData.map(r => ({
                 id: r.id,
                 company: r.company,
                 role: r.role,
                 date: r.created_at,
                 content: r.content
             }));
             setResearchHistory(mappedReports);
          }

          // Load Prep Reports
          const { data: prepData } = await supabase
            .from('prep_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (prepData) {
             const mappedPrep = prepData.map(r => ({
                 id: r.id,
                 company: r.company,
                 role: r.role,
                 date: r.created_at,
                 content: r.content
             }));
             setPrepHistory(mappedPrep);
          }

      } catch (err) {
          console.error("Unexpected error loading data:", err);
      } finally {
          setLoading(false);
          isInitialLoad.current = false;
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addJob = async (job: Job) => {
    if (!user) return;
    setJobs((prev) => [job, ...prev]);
    const { data, error } = await supabase.from('jobs').insert({ user_id: user.id, content: job }).select().single();
    if (data) {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, id: data.id } : j));
    }
  };

  const updateJob = async (id: string, updatedFields: Partial<Job>) => {
    if (!user) return;
    const updatedJobs = jobs.map((job) => (job.id === id ? { ...job, ...updatedFields } : job));
    setJobs(updatedJobs);
    const jobToSave = updatedJobs.find(j => j.id === id);
    if (jobToSave) {
        await supabase.from('jobs').update({ content: jobToSave }).eq('id', id);
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return;
    setJobs((prev) => prev.filter((job) => job.id !== id));
    await supabase.from('jobs').delete().eq('id', id);
  };

  const updateResume = async (newResume: Resume) => {
    if (!user) return;
    setResume(newResume);
    await supabase.from('profiles').update({ resume_data: newResume }).eq('id', user.id);
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => {
        const newHistory = [...prev, message];
        if (user) {
            supabase.from('profiles').update({ chat_history: newHistory }).eq('id', user.id).then(() => {
              localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(newHistory));
            });
        }
        return newHistory;
    });
  };

  const clearChat = () => {
    setChatMessages([]);
    setChatInitialized(false);
    if (user) {
        localStorage.removeItem(`chat_history_${user.id}`);
        supabase.from('profiles').update({ chat_history: [] }).eq('id', user.id);
    }
  };

  const addResearchReport = async (report: ResearchReport) => {
      setResearchHistory(prev => [report, ...prev]);
      if (user) {
          await supabase.from('research_reports').insert({
              id: report.id,
              user_id: user.id,
              company: report.company,
              role: report.role,
              content: report.content,
              created_at: report.date
          });
      }
  };

  const deleteResearchReport = async (id: string) => {
      setResearchHistory(prev => prev.filter(r => r.id !== id));
      if (user) {
          await supabase.from('research_reports').delete().eq('id', id).eq('user_id', user.id);
      }
  };

  const addPrepReport = async (report: InterviewPrepReport) => {
      setPrepHistory(prev => [report, ...prev]);
      if (user) {
          await supabase.from('prep_reports').insert({
              id: report.id,
              user_id: user.id,
              company: report.company,
              role: report.role,
              content: report.content,
              created_at: report.date
          });
      }
  };

  const deletePrepReport = async (id: string) => {
      setPrepHistory(prev => prev.filter(r => r.id !== id));
      if (user) {
          await supabase.from('prep_reports').delete().eq('id', id).eq('user_id', user.id);
      }
  };

  const loadDemoData = async () => {
    if (!user) return;
    try {
        const demoResume: Resume = {
            fullName: "Alex Developer",
            email: user.email || "alex@example.com",
            phone: "+1 (415) 555-0123",
            linkedin: "https://linkedin.com/in/alexdev",
            location: "San Francisco, CA",
            summary: "Product-minded Senior Software Engineer with 6+ years of experience in full-stack development. Specialized in React, TypeScript, and Node.js ecosystems.",
            skills: "React, TypeScript, Node.js, Python, PostgreSQL, AWS, System Design, GraphQL, Tailwind CSS",
            jobTitle: "Senior Frontend Engineer",
            avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
            experience: [
                { id: 'exp1', role: 'Senior Software Engineer', company: 'TechGlobal', startDate: '2021-03', endDate: 'Present', description: '• Architected the new customer dashboard reducing load times by 40%.\n• Mentored 3 junior developers.' },
                { id: 'exp2', role: 'Software Engineer', company: 'StartUp Inc', startDate: '2018-06', endDate: '2021-02', description: '• Developed core features for the e-commerce platform.' }
            ],
            projects: [
                { id: 'proj1', name: 'CloudScale', technologies: 'Go, Kubernetes, React', link: 'github.com/alex/cloudscale', description: 'Open source tool for scaling containerized applications.' }
            ],
            education: [
                { id: 'edu1', degree: 'B.S. Computer Science', school: 'University of California, Berkeley', year: '2018' }
            ]
        };
        await updateResume(demoResume);

        const demoJobs: Job[] = [
            {
                id: 'demo1',
                company: 'Google',
                role: 'Senior Software Engineer, Core UI',
                status: 'Interview',
                salary: '$320k - $450k',
                location: 'Mountain View, CA (Hybrid)',
                dateApplied: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
                description: 'Join the team building the next generation of Google Search interfaces.',
                coverLetter: '',
                origin: 'application',
                interviewDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                checklist: [{ id: 'cl1', text: 'Review Googleyness principles', completed: true }],
                contacts: [{ id: 'ct1', name: 'Jennifer Recruiter', role: 'Technical Recruiter', email: 'jen.r@google.com', phone: '', linkedin: '', history: [] }]
            }
        ];

        for (const job of demoJobs) {
            await addJob({ ...job, id: Math.random().toString(36).substring(2) + Date.now().toString(36) });
        }
    } catch (e) {
        console.error("Failed to load demo data", e);
    }
  };

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interview: jobs.filter(j => j.status === 'Interview').length,
    offer: jobs.filter(j => j.status === 'Offer' || j.status === 'Accepted').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
  };

  return (
    <JobContext.Provider value={{ 
        jobs, resume, addJob, updateJob, deleteJob, updateResume, loadDemoData, stats, theme, toggleTheme, loading,
        chatMessages, addChatMessage, clearChat, isChatInitialized, setChatInitialized,
        researchHistory, addResearchReport, deleteResearchReport,
        prepHistory, addPrepReport, deletePrepReport
    }}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
};
