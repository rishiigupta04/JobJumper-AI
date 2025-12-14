import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { Job, JobStatus, Attachment, ChecklistItem, InterviewLog, Contact, Interaction } from '../types';
import { generateCoverLetter } from '../services/geminiService';
import { 
  Plus, Search, MapPin, IndianRupee, Sparkles, X, Edit2, Trash2, 
  Loader2, Copy, FileText, Briefcase, StickyNote, Paperclip, 
  CheckSquare, Square, Send, Calendar, Users, Phone, Mail, Linkedin
} from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const JobList: React.FC = () => {
  const { jobs, addJob, updateJob, deleteJob, resume } = useJobContext();
  const [filter, setFilter] = useState<JobStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'info' | 'jd' | 'prep' | 'assets' | 'people'>('info');

  // Form State
  const [formData, setFormData] = useState<Partial<Job>>({
    company: '',
    role: '',
    status: 'Applied',
    salary: '',
    location: '',
    description: '',
    coverLetter: '',
    resumeVersion: '',
    notes: '',
    questions: '',
    attachments: [],
    interviewDate: '',
    checklist: [],
    interviewLogs: [],
    contacts: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  // Contact States
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ name: '', role: '', email: '', phone: '', linkedin: '' });
  const [newInteraction, setNewInteraction] = useState<{ contactId: string, text: string, type: Interaction['type'] } | null>(null);

  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentType, setNewAttachmentType] = useState<Attachment['type']>('Resume');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newLogNote, setNewLogNote] = useState('');

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'All' || job.status === filter;
    const company = job.company || '';
    const role = job.role || '';
    const matchesSearch = company.toLowerCase().includes(search.toLowerCase()) || 
                          role.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenModal = (job?: Job) => {
    setActiveTab('info');
    setIsAddingContact(false);
    if (job) {
      setEditingJob(job);
      setFormData(JSON.parse(JSON.stringify(job))); // Deep copy to prevent mutation issues
    } else {
      setEditingJob(null);
      setFormData({
        company: '',
        role: '',
        status: 'Applied',
        salary: '',
        location: '',
        description: '',
        coverLetter: '',
        dateApplied: new Date().toISOString().split('T')[0],
        origin: 'application',
        resumeVersion: '',
        notes: '',
        questions: '',
        attachments: [],
        interviewDate: '',
        checklist: [],
        interviewLogs: [],
        contacts: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.company || !formData.role) return;

    if (editingJob) {
      updateJob(editingJob.id, formData);
    } else {
      addJob({
        ...formData as Job,
        id: generateId(),
        dateApplied: formData.dateApplied || new Date().toISOString().split('T')[0],
        attachments: formData.attachments || [],
        checklist: formData.checklist || [],
        interviewLogs: formData.interviewLogs || [],
        contacts: formData.contacts || []
      });
    }
    setIsModalOpen(false);
  };

  const handleGenerateCoverLetter = async () => {
    if (!formData.role || !formData.company) return;
    setIsGenerating(true);
    const letter = await generateCoverLetter(
      formData.role, 
      formData.company, 
      resume.skills, 
      formData.description
    );
    setFormData(prev => ({ ...prev, coverLetter: letter }));
    setIsGenerating(false);
  };

  const addAttachment = () => {
    if (!newAttachmentName) return;
    const newDoc: Attachment = {
      id: generateId(),
      name: newAttachmentName,
      type: newAttachmentType,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), newDoc]
    }));
    setNewAttachmentName('');
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(a => a.id !== id)
    }));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId(),
      text: newChecklistItem,
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      checklist: [...(prev.checklist || []), newItem]
    }));
    setNewChecklistItem('');
  };

  const toggleChecklist = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist?.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    }));
  };

  const removeChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist?.filter(item => item.id !== id)
    }));
  };

  const addInterviewLog = () => {
    if (!newLogNote.trim()) return;
    const newLog: InterviewLog = {
      id: generateId(),
      date: new Date().toISOString(),
      note: newLogNote
    };
    setFormData(prev => ({
      ...prev,
      interviewLogs: [newLog, ...(prev.interviewLogs || [])]
    }));
    setNewLogNote('');
  };

  // People & Contact Methods
  const handleAddContact = () => {
    if (!newContact.name) return;
    const contact: Contact = {
        id: generateId(),
        name: newContact.name,
        role: newContact.role || 'Recruiter',
        email: newContact.email || '',
        phone: newContact.phone || '',
        linkedin: newContact.linkedin || '',
        history: []
    };
    setFormData(prev => ({
        ...prev,
        contacts: [...(prev.contacts || []), contact]
    }));
    setNewContact({ name: '', role: '', email: '', phone: '', linkedin: '' });
    setIsAddingContact(false);
  };

  const removeContact = (id: string) => {
    setFormData(prev => ({
        ...prev,
        contacts: prev.contacts?.filter(c => c.id !== id)
    }));
  };

  const addInteraction = (contactId: string) => {
      if (!newInteraction || !newInteraction.text) return;
      
      const interaction: Interaction = {
          id: generateId(),
          date: new Date().toISOString().split('T')[0],
          type: newInteraction.type,
          notes: newInteraction.text
      };

      setFormData(prev => ({
          ...prev,
          contacts: prev.contacts?.map(c => 
             c.id === contactId 
                ? { ...c, history: [interaction, ...(c.history || [])] }
                : c
          )
      }));
      setNewInteraction(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Standard input class
  const inputClass = "w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Applications</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
        >
          <Plus size={18} />
          Add Application
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search company or role..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700 dark:text-slate-200 cursor-pointer"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="All">All Status</option>
          <option value="Applied">Applied</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
          <option value="Accepted">Accepted</option>
        </select>
      </div>

      {/* Job List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map(job => (
          <div key={job.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 md:items-center justify-between group">
            <div className="flex-1 cursor-pointer" onClick={() => handleOpenModal(job)}>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{job.role}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  job.status === 'Applied' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  job.status === 'Interview' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                  job.status === 'Offer' || job.status === 'Accepted' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {job.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">{job.company}</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><MapPin size={14}/> {job.location || 'Remote'}</span>
                {job.salary && <span className="flex items-center gap-1"><IndianRupee size={14}/> {job.salary}</span>}
                {job.interviewDate && (
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                    <Calendar size={14} /> 
                    {new Date(job.interviewDate).toLocaleDateString()}
                  </span>
                )}
                {job.contacts && job.contacts.length > 0 && (
                   <span className="flex items-center gap-1 text-indigo-500"><Users size={14} /> {job.contacts.length} Contacts</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleOpenModal(job)}
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => deleteJob(job.id)}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        {filteredJobs.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p>No applications found.</p>
          </div>
        )}
      </div>

      {/* Expanded Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingJob ? 'Manage Application' : 'New Application'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formData.company || 'Untitled Company'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-6 overflow-x-auto">
              {[
                { id: 'info', label: 'Overview', icon: Briefcase },
                { id: 'people', label: 'People', icon: Users },
                { id: 'jd', label: 'JD', icon: FileText },
                { id: 'prep', label: 'Prep', icon: StickyNote },
                { id: 'assets', label: 'Files', icon: Paperclip },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                      ${isActive 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
              
              {/* Tab: Overview */}
              {activeTab === 'info' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelClass}>Company</label>
                      <input 
                        className={inputClass}
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        placeholder="e.g. Google"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Role</label>
                      <input 
                        className={inputClass}
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        placeholder="e.g. Senior Engineer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Status</label>
                      <select 
                        className={inputClass}
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Salary (Optional)</label>
                      <input 
                        className={inputClass}
                        value={formData.salary}
                        onChange={(e) => setFormData({...formData, salary: e.target.value})}
                        placeholder="e.g. ₹25,00,000"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Location</label>
                      <input 
                        className={inputClass}
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="e.g. Remote"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Date Applied</label>
                      <input 
                        type="date"
                        className={inputClass}
                        value={formData.dateApplied}
                        onChange={(e) => setFormData({...formData, dateApplied: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Next Interview Date</label>
                      <input 
                        type="datetime-local"
                        className={inputClass}
                        value={formData.interviewDate}
                        onChange={(e) => setFormData({...formData, interviewDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: People (Recruiters) */}
              {activeTab === 'people' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Add Contact Form (Conditional) */}
                    {isAddingContact ? (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 shadow-sm mb-4">
                           <h4 className="font-bold text-slate-800 dark:text-white mb-3">Add New Contact</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <input 
                                className={inputClass}
                                value={newContact.name}
                                onChange={e => setNewContact({...newContact, name: e.target.value})}
                                placeholder="Name (Required)"
                              />
                              <input 
                                className={inputClass}
                                value={newContact.role}
                                onChange={e => setNewContact({...newContact, role: e.target.value})}
                                placeholder="Role (e.g. Recruiter)"
                              />
                              <input 
                                className={inputClass}
                                value={newContact.email}
                                onChange={e => setNewContact({...newContact, email: e.target.value})}
                                placeholder="Email"
                              />
                              <input 
                                className={inputClass}
                                value={newContact.phone}
                                onChange={e => setNewContact({...newContact, phone: e.target.value})}
                                placeholder="Phone"
                              />
                              <input 
                                className={`${inputClass} md:col-span-2`}
                                value={newContact.linkedin}
                                onChange={e => setNewContact({...newContact, linkedin: e.target.value})}
                                placeholder="LinkedIn Profile URL"
                              />
                           </div>
                           <div className="flex justify-end gap-2">
                              <button onClick={() => setIsAddingContact(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-700">Cancel</button>
                              <button onClick={handleAddContact} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg">Save Contact</button>
                           </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingContact(true)}
                            className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus size={18} /> Add Recruiter or Hiring Manager
                        </button>
                    )}

                    {/* Contacts List */}
                    <div className="space-y-4">
                        {formData.contacts && formData.contacts.map(contact => (
                            <div key={contact.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Contact Header */}
                                <div className="p-4 flex items-start justify-between bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{contact.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{contact.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeContact(contact.id)} className="text-slate-400 hover:text-rose-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                
                                {/* Contact Details */}
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    {contact.email && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Mail size={14} className="text-slate-400" /> {contact.email}
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Phone size={14} className="text-slate-400" /> {contact.phone}
                                        </div>
                                    )}
                                    {contact.linkedin && (
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                            <Linkedin size={14} /> 
                                            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">LinkedIn</a>
                                        </div>
                                    )}
                                </div>

                                {/* Interaction History */}
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                    <label className={labelClass}>Interaction History</label>
                                    
                                    <div className="space-y-2 mb-3">
                                        {contact.history && contact.history.map(item => (
                                            <div key={item.id} className="text-xs flex gap-2">
                                                <span className="text-slate-400 min-w-[70px]">{item.date}</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[50px]">{item.type}</span>
                                                <span className="text-slate-600 dark:text-slate-400">{item.notes}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Interaction Input */}
                                    <div className="flex gap-2">
                                        <select 
                                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                                            onChange={(e) => setNewInteraction(prev => ({ ...prev, contactId: contact.id, text: prev?.text || '', type: e.target.value as any }))}
                                            value={newInteraction?.contactId === contact.id ? newInteraction.type : 'Email'}
                                        >
                                            <option value="Email">Email</option>
                                            <option value="Call">Call</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="Meeting">Meeting</option>
                                        </select>
                                        <input 
                                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs bg-white dark:bg-slate-950"
                                            placeholder="Log a note (e.g. Sent follow-up)"
                                            value={newInteraction?.contactId === contact.id ? newInteraction.text : ''}
                                            onChange={(e) => setNewInteraction({ contactId: contact.id, text: e.target.value, type: newInteraction?.type || 'Email' })}
                                            onKeyDown={(e) => e.key === 'Enter' && addInteraction(contact.id)}
                                        />
                                        <button 
                                            onClick={() => addInteraction(contact.id)}
                                            className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-lg"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!formData.contacts || formData.contacts.length === 0) && !isAddingContact && (
                           <div className="text-center py-6 text-slate-400">
                              <Users size={32} className="mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No contacts added yet.</p>
                           </div>
                        )}
                    </div>
                </div>
              )}

              {/* Tab: Job Description */}
              {activeTab === 'jd' && (
                <div className="space-y-4 animate-fade-in h-full flex flex-col">
                  <div className="flex justify-between items-center">
                    <label className={labelClass}>Job Description Source</label>
                    <span className="text-xs text-slate-400">Paste the full JD here for AI context</span>
                  </div>
                  <textarea 
                    className={`${inputClass} flex-1 min-h-[300px] resize-none font-sans text-sm leading-relaxed`}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Paste the entire job description here..."
                  />
                </div>
              )}

              {/* Tab: Preparation */}
              {activeTab === 'prep' && (
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Research */}
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className={labelClass}>Research & Notes</label>
                        <textarea 
                          className={`${inputClass} min-h-[150px] resize-y`}
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="Culture notes, recent news, interviewer names..."
                        />
                     </div>
                     <div className="space-y-2">
                        <label className={labelClass}>Questions to Ask</label>
                        <textarea 
                          className={`${inputClass} min-h-[100px] resize-y`}
                          value={formData.questions}
                          onChange={(e) => setFormData({...formData, questions: e.target.value})}
                          placeholder="Questions for your interviewers..."
                        />
                     </div>
                  </div>

                  {/* Right Column: Checklist & Logs */}
                  <div className="space-y-6">
                    {/* Checklist */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className={labelClass}>Prep Checklist</label>
                        <div className="space-y-2 mb-3 max-h-[150px] overflow-y-auto">
                           {formData.checklist?.map(item => (
                             <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                                <button 
                                  onClick={() => toggleChecklist(item.id)}
                                  className="flex items-center gap-2 flex-1 text-left"
                                >
                                   <div className={`${item.completed ? 'text-emerald-500' : 'text-slate-400'}`}>
                                      {item.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                                   </div>
                                   <span className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {item.text}
                                   </span>
                                </button>
                                <button onClick={() => removeChecklistItem(item.id)} className="text-slate-400 hover:text-rose-500">
                                   <Trash2 size={14} />
                                </button>
                             </div>
                           ))}
                           {(!formData.checklist || formData.checklist.length === 0) && (
                              <p className="text-xs text-slate-400 italic">No items yet.</p>
                           )}
                        </div>
                        <div className="flex gap-2">
                           <input 
                             className={`${inputClass} text-xs py-2`}
                             value={newChecklistItem}
                             onChange={(e) => setNewChecklistItem(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                             placeholder="Add task (e.g. Mock Interview)"
                           />
                           <button onClick={addChecklistItem} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                              <Plus size={16} className="text-slate-600 dark:text-slate-300" />
                           </button>
                        </div>
                    </div>

                    {/* Interview Logs */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className={labelClass}>Post-Interview Logs</label>
                        <div className="flex gap-2 mb-4">
                           <input 
                             className={`${inputClass} text-sm`}
                             value={newLogNote}
                             onChange={(e) => setNewLogNote(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && addInterviewLog()}
                             placeholder="Quick thought after call..."
                           />
                           <button onClick={addInterviewLog} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg">
                              <Send size={16} />
                           </button>
                        </div>
                        <div className="space-y-3 max-h-[150px] overflow-y-auto">
                           {formData.interviewLogs?.map(log => (
                              <div key={log.id} className="text-sm border-l-2 border-indigo-200 dark:border-indigo-900 pl-3">
                                 <p className="text-slate-800 dark:text-slate-200">{log.note}</p>
                                 <span className="text-[10px] text-slate-400">
                                   {new Date(log.date).toLocaleString()}
                                 </span>
                              </div>
                           ))}
                           {(!formData.interviewLogs || formData.interviewLogs.length === 0) && (
                              <p className="text-xs text-slate-400 italic">No logs recorded yet.</p>
                           )}
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Assets (Docs, Resume Version, Cover Letter) */}
              {activeTab === 'assets' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Resume Version Tracker */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className={labelClass}>Resume Version Used</label>
                    <div className="flex gap-2">
                      <input 
                        className={inputClass}
                        value={formData.resumeVersion}
                        onChange={(e) => setFormData({...formData, resumeVersion: e.target.value})}
                        placeholder="e.g. Frontend_Resume_v2_Google_Specific"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Track exactly which resume file you sent for this application.</p>
                  </div>

                  {/* Documents Repository */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <label className={labelClass}>Attached Documents</label>
                    
                    {/* List */}
                    <div className="space-y-2 mb-4">
                      {formData.attachments?.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{doc.name}</p>
                              <p className="text-xs text-slate-500">{doc.type} • {doc.dateAdded}</p>
                            </div>
                          </div>
                          <button onClick={() => removeAttachment(doc.id)} className="text-slate-400 hover:text-rose-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {(!formData.attachments || formData.attachments.length === 0) && (
                        <p className="text-sm text-slate-400 italic">No documents attached.</p>
                      )}
                    </div>

                    {/* Add Doc Input */}
                    <div className="flex gap-2">
                       <input 
                         className={`${inputClass} text-sm`}
                         value={newAttachmentName}
                         onChange={(e) => setNewAttachmentName(e.target.value)}
                         placeholder="Document Name (e.g. Portfolio Link)"
                       />
                       <select 
                         className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-700 dark:text-slate-300 outline-none"
                         value={newAttachmentType}
                         onChange={(e) => setNewAttachmentType(e.target.value as any)}
                       >
                         <option value="Resume">Resume</option>
                         <option value="Cover Letter">Cover Letter</option>
                         <option value="Portfolio">Portfolio</option>
                         <option value="Reference">Reference</option>
                         <option value="Other">Other</option>
                       </select>
                       <button 
                         onClick={addAttachment}
                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg font-medium transition-colors"
                       >
                         Add
                       </button>
                    </div>
                  </div>

                  {/* AI Cover Letter */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <label className={labelClass}>AI Cover Letter Generator</label>
                      <button 
                        onClick={handleGenerateCoverLetter}
                        disabled={isGenerating || !formData.role || !formData.company}
                        className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 dark:hover:bg-purple-900/60 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                      >
                        {isGenerating ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                        Generate with Gemini
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        className={`${inputClass} min-h-[200px] resize-y font-mono text-sm`}
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                        placeholder="Generated cover letter will appear here..."
                      />
                      {formData.coverLetter && (
                        <button 
                          onClick={() => copyToClipboard(formData.coverLetter!)}
                          className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
               <div className="text-xs text-slate-400">
                 {activeTab === 'info' && 'Step 1: Basic Details'}
                 {activeTab === 'people' && 'Step 2: Key Contacts'}
                 {activeTab === 'jd' && 'Step 3: Add Context'}
                 {activeTab === 'prep' && 'Step 4: Prepare to Win'}
                 {activeTab === 'assets' && 'Step 5: Manage Files'}
               </div>
               <div className="flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-colors"
                  >
                    Save Application
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;