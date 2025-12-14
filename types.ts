export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Accepted';

export interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  salary: string;
  location: string;
  dateApplied: string;
  description: string;
  coverLetter: string; // AI Generated
  origin: 'application' | 'offer';
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
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type ViewState = 'dashboard' | 'applications' | 'offers' | 'resume' | 'avatar' | 'settings';
