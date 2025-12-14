import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Job, Resume } from '../types';
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
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Jobs
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobData) {
        // Map Supabase JSON rows back to Job objects
        const loadedJobs = jobData.map(row => ({
          ...row.content,
          id: row.id // Ensure we use the DB ID
        }));
        setJobs(loadedJobs);
      } else if (jobError) {
        console.error("Error fetching jobs:", jobError);
      }

      // Fetch Profile/Resume
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('resume_data')
        .eq('user_id', user.id)
        .single();

      if (profileData && profileData.resume_data) {
        setResume({ ...DEFAULT_RESUME, ...profileData.resume_data });
      } else if (!profileData) {
        // Initialize profile if not exists
        await supabase.from('profiles').insert({ user_id: user.id, resume_data: DEFAULT_RESUME });
      }

      setLoading(false);
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
        console.error("Error adding job", error);
        // Revert on error could go here
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
            
        if (error) console.error("Error updating job", error);
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

    if (error) console.error("Error deleting job", error);
  };

  const updateResume = async (newResume: Resume) => {
    if (!user) return;
    
    setResume(newResume);
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, resume_data: newResume });
      
    if (error) console.error("Error updating resume", error);
  };

  const loadDemoData = async () => {
    if (!user) return;
    // Removing global loading toggle to prevent UI unmount
    
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
    <JobContext.Provider value={{ jobs, resume, addJob, updateJob, deleteJob, updateResume, loadDemoData, stats, theme, toggleTheme, loading }}>
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