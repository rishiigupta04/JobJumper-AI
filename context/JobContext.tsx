import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Job, Resume, ChatMessage, ResearchReport } from '../types';
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

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatInitialized, setChatInitialized] = useState(false);

  // Research State
  const [researchHistory, setResearchHistory] = useState<ResearchReport[]>([]);

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
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      try {
          // Fetch Jobs
          const { data: jobData, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (jobData) {
            // Map Supabase JSON rows back to Job objects
            const loadedJobs = jobData.map(row => ({
              ...row.content,
              id: row.id // Ensure we use the DB ID
            }));
            setJobs(loadedJobs);
          } else if (jobError) {
            console.error("Error fetching jobs:", JSON.stringify(jobError));
          }

          // Fetch Profile/Resume AND Chat History
          // Use select('*') to avoid errors if specific columns (like chat_history) are missing in the schema
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData) {
            if (profileData.resume_data) {
               setResume(prev => ({ ...DEFAULT_RESUME, ...profileData.resume_data }));
            }
            
            // Try to load chat from DB, fallback to localStorage if DB column missing or empty
            if (profileData.chat_history && Array.isArray(profileData.chat_history)) {
               setChatMessages(profileData.chat_history);
               if (profileData.chat_history.length > 0) {
                 setChatInitialized(true);
               }
            } else {
                // Fallback: Check local storage for chat history
                const localChat = localStorage.getItem(`chat_history_${user.id}`);
                if (localChat) {
                    try {
                        const parsed = JSON.parse(localChat);
                        setChatMessages(parsed);
                        if (parsed.length > 0) setChatInitialized(true);
                    } catch (e) {
                        console.error("Error parsing local chat history", e);
                    }
                }
            }
          } else {
            if (profileError) {
                console.warn("Profile fetch error (might be creating new one):", JSON.stringify(profileError));
            }
            // Initialize profile if not exists
            const { error: insertError } = await supabase
                .from('profiles')
                .upsert(
                    { id: user.id, resume_data: DEFAULT_RESUME },
                    { onConflict: 'id' }
                );
                
            if (insertError) {
                if (insertError.code !== '23505') {
                    console.error("Error creating profile:", JSON.stringify(insertError));
                }
            }
          }

          // Load Research Reports from Dedicated Table
          const { data: reportsData, error: reportsError } = await supabase
            .from('research_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (reportsData) {
             const mappedReports = reportsData.map(r => ({
                 id: r.id,
                 company: r.company,
                 role: r.role,
                 date: r.created_at, // Mapping DB 'created_at' to 'date'
                 content: r.content
             }));
             setResearchHistory(mappedReports);
          } else {
             if (reportsError) console.warn("Error fetching research reports (DB might be missing table):", reportsError);
             
             // Fallback to LocalStorage
             const localResearch = localStorage.getItem(`research_history_${user.id}`);
             if (localResearch) {
                 try {
                     setResearchHistory(JSON.parse(localResearch));
                 } catch (e) {
                     console.error("Error parsing local research history", e);
                 }
             }
          }

      } catch (err) {
          console.error("Unexpected error loading data:", err);
      } finally {
          setLoading(false);
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
    
    // Optimistic Update
    setJobs((prev) => [job, ...prev]);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        content: job
      })
      .select()
      .single();

    if (data) {
      // Update the local ID with the real DB ID
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, id: data.id } : j));
    } else if (error) {
        console.error("Error adding job", JSON.stringify(error));
    }
  };

  const updateJob = async (id: string, updatedFields: Partial<Job>) => {
    if (!user) return;

    // Optimistic Update
    const updatedJobs = jobs.map((job) => (job.id === id ? { ...job, ...updatedFields } : job));
    setJobs(updatedJobs);

    const jobToSave = updatedJobs.find(j => j.id === id);
    
    if (jobToSave) {
        const { error } = await supabase
            .from('jobs')
            .update({ content: jobToSave })
            .eq('id', id);
            
        if (error) console.error("Error updating job", JSON.stringify(error));
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return;
    
    // Optimistic Update
    setJobs((prev) => prev.filter((job) => job.id !== id));

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) console.error("Error deleting job", JSON.stringify(error));
  };

  const updateResume = async (newResume: Resume) => {
    if (!user) return;
    
    setResume(newResume);
    const { error } = await supabase
      .from('profiles')
      .update({ resume_data: newResume })
      .eq('id', user.id);
      
    if (error) console.error("Error updating resume", JSON.stringify(error));
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => {
        const newHistory = [...prev, message];
        
        if (user) {
            supabase
              .from('profiles')
              .update({ chat_history: newHistory })
              .eq('id', user.id)
              .then(({ error }) => {
                 if (error) {
                    localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(newHistory));
                 } else {
                    localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(newHistory));
                 }
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
        supabase
          .from('profiles')
          .update({ chat_history: [] })
          .eq('id', user.id)
          .then(({ error }) => {
             if (error) console.error("Failed to clear chat history in DB", JSON.stringify(error));
          });
    }
  };

  const addResearchReport = async (report: ResearchReport) => {
      // Optimistic update
      setResearchHistory(prev => [report, ...prev]);
      
      if (user) {
          const { error } = await supabase
            .from('research_reports')
            .insert({
                id: report.id,
                user_id: user.id,
                company: report.company,
                role: report.role,
                content: report.content,
                created_at: report.date
            });
            
          if (error) {
              console.error("Failed to save report to DB:", error);
              // Fallback to local storage
              const currentHistory = [report, ...researchHistory];
              localStorage.setItem(`research_history_${user.id}`, JSON.stringify(currentHistory));
          } else {
              // Sync local storage as backup
              const currentHistory = [report, ...researchHistory];
              localStorage.setItem(`research_history_${user.id}`, JSON.stringify(currentHistory));
          }
      } else {
          // Guest mode fallback
          const currentHistory = [report, ...researchHistory];
          localStorage.setItem('research_history_guest', JSON.stringify(currentHistory));
      }
  };

  const deleteResearchReport = async (id: string) => {
      // Optimistic update
      setResearchHistory(prev => prev.filter(r => r.id !== id));
      
      if (user) {
          const { error } = await supabase
            .from('research_reports')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
            
          if (error) {
             console.error("Failed to delete report from DB:", error);
             // Update local fallback just in case
             const newHistory = researchHistory.filter(r => r.id !== id);
             localStorage.setItem(`research_history_${user.id}`, JSON.stringify(newHistory));
          } else {
             const newHistory = researchHistory.filter(r => r.id !== id);
             localStorage.setItem(`research_history_${user.id}`, JSON.stringify(newHistory));
          }
      }
  };

  const loadDemoData = async () => {
    if (!user) return;
    
    try {
        // 1. Set Demo Resume
        const demoResume: Resume = {
            fullName: "Alex Developer",
            email: user.email || "alex@example.com",
            phone: "+1 (415) 555-0123",
            linkedin: "https://linkedin.com/in/alexdev",
            location: "San Francisco, CA",
            summary: "Product-minded Senior Software Engineer with 6+ years of experience in full-stack development. Specialized in React, TypeScript, and Node.js ecosystems. Proven track record of improving system performance and leading diverse engineering teams.",
            skills: "React, TypeScript, Node.js, Python, PostgreSQL, AWS, System Design, GraphQL, Tailwind CSS",
            jobTitle: "Senior Frontend Engineer",
            avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
            experience: [
                { id: 'exp1', role: 'Senior Software Engineer', company: 'TechGlobal', startDate: '2021-03', endDate: 'Present', description: '• Architected the new customer dashboard reducing load times by 40%.\n• Mentored 3 junior developers and established code review standards.' },
                { id: 'exp2', role: 'Software Engineer', company: 'StartUp Inc', startDate: '2018-06', endDate: '2021-02', description: '• Developed core features for the e-commerce platform using React and Node.js.\n• Integrated Stripe payment gateway handling $1M+ monthly volume.' }
            ],
            projects: [
                { id: 'proj1', name: 'CloudScale', technologies: 'Go, Kubernetes, React', link: 'github.com/alex/cloudscale', description: 'Open source tool for scaling containerized applications.' }
            ],
            education: [
                { id: 'edu1', degree: 'B.S. Computer Science', school: 'University of California, Berkeley', year: '2018' }
            ]
        };
        await updateResume(demoResume);

        // 2. Set Demo Jobs
        const demoJobs: Job[] = [
            {
                id: 'demo1',
                company: 'Google',
                role: 'Senior Software Engineer, Core UI',
                status: 'Interview',
                salary: '$320k - $450k',
                location: 'Mountain View, CA (Hybrid)',
                dateApplied: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
                description: 'Join the team building the next generation of Google Search interfaces. We are looking for experts in performance, accessibility, and modern web frameworks.',
                coverLetter: 'I am writing to express my strong interest in the Senior Software Engineer position...',
                origin: 'application',
                interviewDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
                checklist: [
                    { id: 'cl1', text: 'Review Googleyness principles', completed: true },
                    { id: 'cl2', text: 'System Design: Design a News Feed', completed: false },
                    { id: 'cl3', text: 'Mock Interview with Peers', completed: false }
                ],
                contacts: [
                    { id: 'ct1', name: 'Jennifer Recruiter', role: 'Technical Recruiter', email: 'jen.r@google.com', phone: '', linkedin: '', history: [] }
                ]
            },
            {
                id: 'demo2',
                company: 'Netflix',
                role: 'Senior UI Engineer',
                status: 'Offer',
                salary: '$480,000',
                location: 'Los Gatos, CA',
                dateApplied: new Date(Date.now() - 86400000 * 25).toISOString().split('T')[0],
                description: 'The Netflix TV UI team is responsible for the 10-foot experience on millions of devices...',
                coverLetter: '',
                origin: 'application',
                negotiationStrategy: '## Market Analysis\nNetflix pays top of market. Focus on personal impact and competing offers from Big Tech.\n\n## Script\n"I am thrilled about the offer. However, considering the scope..."'
            },
            {
                id: 'demo3',
                company: 'OpenAI',
                role: 'Product Engineer',
                status: 'Applied',
                salary: '',
                location: 'San Francisco, CA',
                dateApplied: new Date().toISOString().split('T')[0],
                description: 'Help us build the interface for AGI.',
                coverLetter: 'As a long-time user of GPT-3, I have been fascinated by...',
                origin: 'application'
            },
            {
                id: 'demo4',
                company: 'Amazon',
                role: 'Frontend Engineer II',
                status: 'Rejected',
                salary: '',
                location: 'Seattle, WA',
                dateApplied: new Date(Date.now() - 86400000 * 45).toISOString().split('T')[0],
                description: 'AWS Console team.',
                coverLetter: '',
                origin: 'application'
            }
        ];

        for (const job of demoJobs) {
            // Generate unique ID
            const jobWithId = { ...job, id: Math.random().toString(36).substring(2) + Date.now().toString(36) };
            await addJob(jobWithId);
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
        researchHistory, addResearchReport, deleteResearchReport
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