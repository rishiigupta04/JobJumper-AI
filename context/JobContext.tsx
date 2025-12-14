import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Job, Resume } from '../types';

interface JobContextType {
  jobs: Job[];
  resume: Resume;
  addJob: (job: Job) => void;
  updateJob: (id: string, updatedJob: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  updateResume: (resume: Resume) => void;
  stats: {
    total: number;
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

const DEFAULT_RESUME: Resume = {
  fullName: "Aryan Sharma",
  email: "aryan.sharma@example.com",
  phone: "+91 98765 43210",
  linkedin: "linkedin.com/in/aryansharma",
  location: "Bengaluru, Karnataka",
  skills: "React, TypeScript, Tailwind CSS, Node.js, Gemini API, UI/UX Design, REST APIs, GraphQL",
  summary: "Senior Frontend Engineer with 5+ years of experience building scalable web applications. Expert in React ecosystem and modern UI/UX principles. Proven track record of delivering high-performance products.",
  experience: [
    {
      id: '1',
      role: 'Senior Frontend Engineer',
      company: 'Flipkart',
      startDate: '2022-01',
      endDate: 'Present',
      description: "• Led the frontend team in rebuilding the core dashboard using React 18.\n• Improved site performance by 40% through code splitting and lazy loading.\n• Mentored junior developers and established coding standards."
    },
    {
      id: '2',
      role: 'Frontend Developer',
      company: 'Infosys',
      startDate: '2019-03',
      endDate: '2021-12',
      description: "• Developed responsive websites for 20+ clients using modern CSS frameworks.\n• Collaborated with designers to implement pixel-perfect UIs."
    }
  ],
  projects: [
    {
      id: '1',
      name: 'GetAJ*b',
      technologies: 'React 19, Tailwind, Gemini API',
      link: 'github.com/aryansharma/getajob',
      description: 'A comprehensive job application tracker featuring AI-powered cover letter generation and interview coaching.'
    }
  ],
  education: [
    {
      id: '1',
      degree: 'B.Tech Computer Science',
      school: 'IIT Bombay',
      year: '2018'
    }
  ]
};

// Dummy data for initial visualization
const INITIAL_JOBS: Job[] = [
  {
    id: '1',
    company: 'Zomato',
    role: 'Senior Frontend Engineer',
    status: 'Interview',
    salary: '₹25,00,000 - ₹30,00,000',
    location: 'Gurugram (Hybrid)',
    dateApplied: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    description: 'Building next-gen food delivery interfaces.',
    coverLetter: '',
    origin: 'application'
  },
  {
    id: '2',
    company: 'Swiggy',
    role: 'Product Designer',
    status: 'Applied',
    salary: '₹18,00,000',
    location: 'Bengaluru',
    dateApplied: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    description: 'Design system maintenance for Instamart.',
    coverLetter: '',
    origin: 'application'
  },
  {
    id: '3',
    company: 'TCS',
    role: 'Full Stack Developer',
    status: 'Offer',
    salary: '₹12,00,000',
    location: 'Pune',
    dateApplied: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
    description: 'Banking and financial services project.',
    coverLetter: '',
    origin: 'offer'
  }
];

export const JobProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [resume, setResume] = useState<Resume>(() => {
    const saved = localStorage.getItem('resume');
    return saved ? JSON.parse(saved) : DEFAULT_RESUME;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved as 'light' | 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('resume', JSON.stringify(resume));
  }, [resume]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addJob = (job: Job) => {
    setJobs((prev) => [job, ...prev]);
  };

  const updateJob = (id: string, updatedJob: Partial<Job>) => {
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...updatedJob } : job)));
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const updateResume = (newResume: Resume) => {
    setResume(newResume);
  };

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interview: jobs.filter(j => j.status === 'Interview').length,
    offer: jobs.filter(j => j.status === 'Offer' || j.status === 'Accepted').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
  };

  return (
    <JobContext.Provider value={{ jobs, resume, addJob, updateJob, deleteJob, updateResume, stats, theme, toggleTheme }}>
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