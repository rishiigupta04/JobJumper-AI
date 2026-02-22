
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
  const { user, isDemoMode } = useAuth();
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

  // Fetch Data from Supabase or Load Demo Data
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
          if (isDemoMode) {
              await loadIndianDemoData();
          } else {
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
          }

      } catch (err) {
          console.error("Unexpected error loading data:", err);
      } finally {
          setLoading(false);
          isInitialLoad.current = false;
      }
    };

    fetchData();
  }, [user, isDemoMode]);

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
    setJobs((prev) => {
        const newJobs = [job, ...prev];
        if (isDemoMode) {
            localStorage.setItem('demo_jobs_cache', JSON.stringify(newJobs));
        }
        return newJobs;
    });
    if (!isDemoMode) {
        const { data, error } = await supabase.from('jobs').insert({ user_id: user.id, content: job }).select().single();
        if (data) {
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, id: data.id } : j));
        }
    }
  };

  const updateJob = async (id: string, updatedFields: Partial<Job>) => {
    if (!user) return;
    const updatedJobs = jobs.map((job) => (job.id === id ? { ...job, ...updatedFields } : job));
    setJobs(updatedJobs);
    
    if (isDemoMode) {
        localStorage.setItem('demo_jobs_cache', JSON.stringify(updatedJobs));
    } else {
        const jobToSave = updatedJobs.find(j => j.id === id);
        if (jobToSave) {
            await supabase.from('jobs').update({ content: jobToSave }).eq('id', id);
        }
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return;
    const filteredJobs = jobs.filter((job) => job.id !== id);
    setJobs(filteredJobs);
    
    if (isDemoMode) {
        localStorage.setItem('demo_jobs_cache', JSON.stringify(filteredJobs));
    } else {
        await supabase.from('jobs').delete().eq('id', id);
    }
  };

  const updateResume = async (newResume: Resume) => {
    if (!user) return;
    setResume(newResume);
    if (!isDemoMode) {
        await supabase.from('profiles').update({ resume_data: newResume }).eq('id', user.id);
    }
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => {
        const newHistory = [...prev, message];
        if (user && !isDemoMode) {
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
    if (user && !isDemoMode) {
        localStorage.removeItem(`chat_history_${user.id}`);
        supabase.from('profiles').update({ chat_history: [] }).eq('id', user.id);
    }
  };

  const addResearchReport = async (report: ResearchReport) => {
      setResearchHistory(prev => [report, ...prev]);
      if (user && !isDemoMode) {
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
      if (user && !isDemoMode) {
          await supabase.from('research_reports').delete().eq('id', id).eq('user_id', user.id);
      }
  };

  const addPrepReport = async (report: InterviewPrepReport) => {
      setPrepHistory(prev => [report, ...prev]);
      if (user && !isDemoMode) {
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
      if (user && !isDemoMode) {
          await supabase.from('prep_reports').delete().eq('id', id).eq('user_id', user.id);
      }
  };

  const loadIndianDemoData = async () => {
      // Check for cached demo jobs first
      const cachedJobs = localStorage.getItem('demo_jobs_cache');
      if (cachedJobs) {
          try {
              setJobs(JSON.parse(cachedJobs));
          } catch (e) {
              console.error("Failed to parse cached demo jobs", e);
          }
      } else {
          const demoJobs: Job[] = [
              {
                  id: 'demo1',
                  company: 'Google',
                  role: 'Senior AI Engineer',
                  status: 'Interview',
                  salary: '₹45L - ₹60L',
                  location: 'Bangalore (Hybrid)',
                  dateApplied: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
                  description: 'Join the Google Research India team to work on LLMs for Indian languages.',
                  coverLetter: 'I am excited to apply for the Senior AI Engineer role...',
                  origin: 'application',
                  interviewDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                  checklist: [{ id: 'cl1', text: 'Review Transformer architecture', completed: true }, { id: 'cl2', text: 'Prepare system design for LLM serving', completed: false }],
                  contacts: [{ id: 'ct1', name: 'Priya Singh', role: 'Technical Recruiter', email: 'priya.s@google.com', phone: '', linkedin: '', history: [] }]
              },
              {
                  id: 'demo2',
                  company: 'Swiggy',
                  role: 'Lead Data Scientist',
                  status: 'Offer',
                  salary: '₹55L',
                  location: 'Bangalore (Remote)',
                  dateApplied: new Date(Date.now() - 86400000 * 25).toISOString().split('T')[0],
                  description: 'Lead the delivery optimization team using RL.',
                  coverLetter: '',
                  origin: 'offer',
                  interviewDate: undefined,
                  checklist: [],
                  contacts: []
              },
              {
                  id: 'demo3',
                  company: 'Zomato',
                  role: 'Machine Learning Engineer',
                  status: 'Applied',
                  salary: '₹35L - ₹50L',
                  location: 'Gurgaon',
                  dateApplied: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
                  description: 'Work on personalization and search.',
                  coverLetter: '',
                  origin: 'application',
                  interviewDate: undefined,
                  checklist: [],
                  contacts: []
              },
              {
                  id: 'demo4',
                  company: 'Microsoft',
                  role: 'Applied Scientist II',
                  status: 'Rejected',
                  salary: '₹50L',
                  location: 'Hyderabad',
                  dateApplied: new Date(Date.now() - 86400000 * 45).toISOString().split('T')[0],
                  description: 'Bing Search team.',
                  coverLetter: '',
                  origin: 'application',
                  interviewDate: undefined,
                  checklist: [],
                  contacts: []
              }
          ];
          setJobs(demoJobs);
          localStorage.setItem('demo_jobs_cache', JSON.stringify(demoJobs));
      }

      const demoResume: Resume = {
          fullName: "Rishiraj Gupta",
          email: "rishiraj.gupta@example.com",
          phone: "+91 98765 43210",
          linkedin: "https://linkedin.com/in/rishirajgupta-ds",
          location: "Bangalore, India",
          summary: "Senior Data Scientist with 5+ years of experience in Machine Learning, NLP, and Predictive Analytics. Proven track record of deploying scalable AI models in production for e-commerce and fintech sectors.",
          skills: "Python, TensorFlow, PyTorch, SQL, AWS SageMaker, NLP, Computer Vision, Docker, Kubernetes, React (Basic)",
          jobTitle: "Lead Data Scientist",
          avatarImage: "",
          experience: [
              { id: 'exp1', role: 'Senior Data Scientist', company: 'Flipkart', startDate: '2022-01', endDate: 'Present', description: '• Led the development of a new recommendation engine improving conversion by 15%.\n• Managed a team of 4 junior data scientists.\n• Optimized search ranking algorithms using BERT models.' },
              { id: 'exp2', role: 'Data Scientist', company: 'Paytm', startDate: '2019-06', endDate: '2021-12', description: '• Built fraud detection models reducing transaction fraud by 25%.\n• Collaborated with engineering teams to deploy models on AWS.' }
          ],
          projects: [
              { id: 'proj1', name: 'IndicNLP Library', technologies: 'Python, PyTorch, HuggingFace', link: 'github.com/aarav/indic-nlp', description: 'Open source library for NLP tasks in Indian languages.' },
              { id: 'proj2', name: 'StockPred', technologies: 'LSTM, Python, Pandas', link: 'github.com/aarav/stockpred', description: 'Time-series forecasting tool for NSE/BSE stocks.' }
          ],
          education: [
              { id: 'edu1', degree: 'M.Tech in Artificial Intelligence', school: 'IIT Bombay', year: '2019' },
              { id: 'edu2', degree: 'B.Tech in Computer Science', school: 'NIT Trichy', year: '2017' }
          ]
      };
      setResume(demoResume);
      
      // Add some dummy chat history
      setChatMessages([
          { id: 'msg1', role: 'user', text: 'Can you help me prepare for my Google interview?', timestamp: Date.now() - 10000 },
          { id: 'msg2', role: 'model', text: 'Certainly! For a Senior AI Engineer role at Google Research India, you should focus on: \n\n1. **Deep Learning Fundamentals**: Transformers, Attention mechanisms, Backpropagation.\n2. **System Design**: How to serve LLMs at scale, inference optimization.\n3. **Coding**: LeetCode Hard problems (Graphs, DP).\n\nWould you like a mock interview question?', timestamp: Date.now() }
      ]);
      setChatInitialized(true);

      // Add demo Research Reports
      const demoResearch: ResearchReport[] = [
          {
              id: 'res1',
              company: 'Google',
              role: 'Senior AI Engineer',
              date: new Date(Date.now() - 86400000 * 2).toISOString(),
              content: JSON.stringify({
                  companyName: 'Google',
                  roleTitle: 'Senior AI Engineer',
                  summary: {
                      opportunityScore: 9,
                      applyPriority: "High",
                      verdict: "Excellent opportunity for AI research impact.",
                      nextSteps: ["Review Transformer papers", "Practice System Design"]
                  },
                  companyIntelligence: {
                      overview: "Google is a global tech leader in AI, Search, and Cloud.",
                      sizeAndStage: "Public, 100k+ employees",
                      competitors: ["Microsoft", "OpenAI", "Meta"],
                      financialHealth: "Strong, consistent growth"
                  },
                  marketAnalysis: {
                      recentNews: ["Gemini model launch", "Focus on AI integration across products"],
                      marketPosition: "Market Leader in Search & AI"
                  },
                  culture: {
                      workEnvironment: "Hybrid (3 days office)",
                      engineeringCulture: "Engineering-driven, innovative, collaborative"
                  },
                  compensation: {
                      salaryRange: "₹50L - ₹80L",
                      breakdown: { fresher: "₹30L", mid: "₹50L", senior: "₹80L+" },
                      comparison: "Top Tier",
                      benefits: ["Free food", "Health insurance", "Stock options"]
                  },
                  hiring: {
                      process: ["Recruiter Screen", "Coding Rounds (x2)", "System Design", "Googlyness (Behavioral)"],
                      applicationStrategy: "Referrals are very effective."
                  },
                  risks: {
                      level: "Low",
                      concerns: ["High competition"]
                  },
                  strategy: {
                      outreach: "Connect with current AI researchers on LinkedIn.",
                      differentiators: ["Published papers", "Open source contributions"]
                  },
                  reviews: {
                      glassdoor: { rating: "4.5", pros: "Great perks, smart people", cons: "Bureaucracy" },
                      reddit: { sentiment: "Positive", keyDiscussions: ["Best place for AI research", "Good WLB"] },
                      employeeVoices: [{ source: "Blind", quote: "Amazing learning opportunities.", sentiment: "Positive" }]
                  },
                  sources: [{ title: "Google Careers", url: "https://careers.google.com" }]
              })
          }
      ];
      setResearchHistory(demoResearch);

      // Add demo Prep Reports
      const demoPrep: InterviewPrepReport[] = [
          {
              id: 'prep1',
              company: 'Swiggy',
              role: 'Lead Data Scientist',
              date: new Date(Date.now() - 86400000 * 5).toISOString(),
              content: JSON.stringify({
                  companyResearch: {
                      mission: "To elevate the quality of life for the urban consumer with unparalleled convenience.",
                      products: ["Food Delivery", "Instamart", "Genie"],
                      culture: "Fast-paced, data-driven, customer-obsessed.",
                      recentNews: ["IPO plans", "Expansion of Instamart"]
                  },
                  technical: {
                      topics: ["Reinforcement Learning", "Optimization", "A/B Testing"],
                      questions: [
                          { question: "How would you optimize delivery times using RL?", answer: "Model the problem as an MDP where agents (drivers) take actions (routes) to maximize reward (on-time delivery)." },
                          { question: "Explain the Multi-Armed Bandit problem in the context of food recommendations.", answer: "Balancing exploration (new restaurants) vs exploitation (user favorites) to maximize order value." }
                      ]
                  },
                  behavioral: {
                      competencies: ["Leadership", "Stakeholder Management", "Bias for Action"],
                      questions: [
                          { question: "Tell me about a time you had to convince a product manager to change a feature based on data.", starGuide: "Situation: PM wanted feature X. Task: Prove Y is better. Action: Ran A/B test. Result: Y showed 10% lift. PM agreed." }
                      ]
                  },
                  questionsToAsk: [
                      "How is the data science team structured?",
                      "What is the biggest technical challenge in last-mile delivery right now?"
                  ]
              })
          }
      ];
      setPrepHistory(demoPrep);
  };

  // Keep the old loadDemoData for backward compatibility or remove it if not needed. 
  // I'll leave it as a stub or alias if other components use it, but currently only used internally or via context.
  const loadDemoData = async () => {
      await loadIndianDemoData();
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
