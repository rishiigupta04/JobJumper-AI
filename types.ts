export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Accepted';

export interface Attachment {
  id: string;
  name: string;
  type: 'Resume' | 'Portfolio' | 'Reference' | 'Other';
  dateAdded: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface InterviewLog {
  id: string;
  date: string; // ISO string
  note: string;
}

export interface Interaction {
  id: string;
  date: string;
  type: 'Email' | 'Call' | 'LinkedIn' | 'Meeting' | 'Other';
  notes: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  history: Interaction[];
}

export interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  salary: string;
  location: string;
  dateApplied: string;
  description: string; // Job Description
  coverLetter: string; // AI Generated
  origin: 'application' | 'offer';
  
  // New Features
  resumeVersion?: string; // e.g. "Frontend_Resume_v3"
  notes?: string; // Preparation notes, culture, research
  questions?: string; // Questions to ask interviewers
  attachments?: Attachment[]; // Repository of sent docs
  
  // Schedule & Logs
  interviewDate?: string; // ISO datetime string
  checklist?: ChecklistItem[];
  interviewLogs?: InterviewLog[];
  
  // People
  contacts?: Contact[];

  // AI Persistent Data
  interviewGuide?: string;
  negotiationStrategy?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  technologies: string;
  link: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
  grade?: string; // GPA, Percentage, etc.
}

export interface Resume {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  summary: string;
  skills: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  jobTitle?: string;
  avatarImage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type ViewState = 'dashboard' | 'applications' | 'offers' | 'resume' | 'avatar' | 'schedule' | 'settings' | 'chat';