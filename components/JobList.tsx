import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { Job, JobStatus } from '../types';
import { generateCoverLetter } from '../services/geminiService';
import { Plus, Search, MapPin, DollarSign, Sparkles, X, Edit2, Trash2, Loader2, Copy } from 'lucide-react';

const JobList: React.FC = () => {
  const { jobs, addJob, updateJob, deleteJob, resume } = useJobContext();
  const [filter, setFilter] = useState<JobStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Job>>({
    company: '',
    role: '',
    status: 'Applied',
    salary: '',
    location: '',
    description: '',
    coverLetter: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'All' || job.status === filter;
    const matchesSearch = job.company.toLowerCase().includes(search.toLowerCase()) || 
                          job.role.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData(job);
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
        origin: 'application'
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
        id: crypto.randomUUID(),
        ...formData as Job,
        dateApplied: formData.dateApplied || new Date().toISOString().split('T')[0]
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Standard input class to ensure readability in both light and dark modes
  const inputClass = "w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400";

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
          <div key={job.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{job.role}</h3>
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
                {job.salary && <span className="flex items-center gap-1"><DollarSign size={14}/> {job.salary}</span>}
                <span>Applied: {job.dateApplied}</span>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingJob ? 'Edit Application' : 'New Application'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                  <input 
                    className={inputClass}
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g. TCS"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                  <input 
                    className={inputClass}
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    placeholder="e.g. Senior Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Salary (Optional)</label>
                  <input 
                    className={inputClass}
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    placeholder="e.g. ₹15,00,000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job Description</label>
                <textarea 
                  className={`${inputClass} h-24 resize-none`}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Paste the job description here..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                    Cover Letter
                  </label>
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
                    className={`${inputClass} h-48 resize-none font-mono text-sm`}
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

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800">
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
      )}
    </div>
  );
};

export default JobList;