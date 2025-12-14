import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Phone, MapPin, Linkedin, Globe, Save, 
  Loader2, Moon, Sun, Download, Trash2, Shield, Layout,
  Briefcase, Award, Terminal, Database, Code2
} from 'lucide-react';
import { Resume } from '../types';

const Settings: React.FC = () => {
  const { resume, updateResume, theme, toggleTheme, jobs, stats, loadDemoData } = useJobContext();
  const { user, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'app' | 'data'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local state for form to prevent context thrashing
  const [formData, setFormData] = useState<Partial<Resume>>({});

  useEffect(() => {
    setFormData(resume);
  }, [resume]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateResume({ ...resume, ...formData } as Resume);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    if (window.confirm("This will add dummy data to your account. Continue?")) {
        setIsDemoLoading(true);
        await loadDemoData();
        setIsDemoLoading(false);
        alert("Demo data loaded successfully!");
    }
  };

  const handleExportData = () => {
    const data = {
      userProfile: resume,
      jobApplications: jobs,
      stats: stats,
      exportDate: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `JobJumperAI_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const inputClass = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your profile, preferences, and data.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <User size={18} /> Profile Details
          </button>
          <button 
            onClick={() => setActiveTab('app')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'app' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Layout size={18} /> App Preferences
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Shield size={18} /> Data & Privacy
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
               <div className="flex items-center gap-4 mb-2">
                 {formData.avatarImage ? (
                     <img src={formData.avatarImage} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900" />
                 ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
                        {formData.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                 )}
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formData.fullName || 'Your Name'}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Full Name</label>
                    <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         className={`${inputClass} pl-10`}
                         value={formData.fullName || ''}
                         onChange={e => setFormData({...formData, fullName: e.target.value})}
                         placeholder="e.g. John Doe"
                       />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Job Title / Target Role</label>
                    <div className="relative">
                       <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         className={`${inputClass} pl-10`}
                         value={formData.jobTitle || ''}
                         onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                         placeholder="e.g. Senior Frontend Engineer"
                       />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Location</label>
                    <div className="relative">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         className={`${inputClass} pl-10`}
                         value={formData.location || ''}
                         onChange={e => setFormData({...formData, location: e.target.value})}
                         placeholder="e.g. New York, USA"
                       />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <div className="relative">
                       <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         className={`${inputClass} pl-10`}
                         value={formData.phone || ''}
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                         placeholder="+1 (555) 000-0000"
                       />
                    </div>
                  </div>

                   <div>
                    <label className={labelClass}>Contact Email</label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         className={`${inputClass} pl-10`}
                         value={formData.email || ''}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         placeholder="contact@example.com"
                       />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>LinkedIn URL</label>
                    <div className="relative">
                       <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         className={`${inputClass} pl-10`}
                         value={formData.linkedin || ''}
                         onChange={e => setFormData({...formData, linkedin: e.target.value})}
                         placeholder="https://linkedin.com/in/..."
                       />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className={labelClass}>Core Skills (Comma Separated)</label>
                    <div className="relative">
                       <Terminal className="absolute left-3 top-3 text-slate-400" size={18} />
                       <textarea 
                         className={`${inputClass} pl-10 min-h-[100px]`}
                         value={formData.skills || ''}
                         onChange={e => setFormData({...formData, skills: e.target.value})}
                         placeholder="React, TypeScript, Node.js, Python, AWS..."
                       />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">These skills are used by the AI to tailor your cover letters.</p>
                  </div>
               </div>

               <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  {successMsg && <span className="text-emerald-500 text-sm font-medium animate-fade-in">{successMsg}</span>}
                  <div className="flex-1"></div>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Changes
                  </button>
               </div>
            </div>
          )}

          {/* APP PREFERENCES TAB */}
          {activeTab === 'app' && (
             <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Appearance & Behavior</h3>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                         {theme === 'dark' ? <Moon size={24} className="text-indigo-400" /> : <Sun size={24} className="text-orange-400" />}
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800 dark:text-white">Theme Preference</h4>
                         <p className="text-sm text-slate-500">Switch between light and dark mode.</p>
                      </div>
                   </div>
                   <button 
                     onClick={toggleTheme}
                     className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                   >
                     {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                   </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                         <Award size={24} className="text-emerald-500" />
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800 dark:text-white">Currency</h4>
                         <p className="text-sm text-slate-500">Default currency for salary inputs.</p>
                      </div>
                   </div>
                   <div className="text-sm font-bold text-slate-500">
                     INR (₹)
                   </div>
                </div>
             </div>
          )}

          {/* DATA & PRIVACY TAB */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              {/* Developer Tools */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-950/50 dark:to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-200 dark:border-indigo-500/30">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/10 rounded-xl text-white">
                       <Code2 size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-white">Developer Access</h3>
                       <p className="text-sm text-slate-300">Tools for development and testing.</p>
                    </div>
                 </div>
                 
                 <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                    <p className="text-sm text-slate-300 mb-2">
                        <strong className="text-white">Demo Data Population:</strong> This will seed your account with a complete persona ("Alex Developer"), including a filled resume, multiple job applications in different states (Interview, Offer, etc.), and interview checklist items.
                    </p>
                 </div>

                 <button 
                    onClick={handleLoadDemo}
                    disabled={isDemoLoading}
                    className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-70"
                 >
                    {isDemoLoading ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                    {isDemoLoading ? 'Seeding Database...' : 'Load Demo Data'}
                 </button>
              </div>

              {/* Export */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                       <Download size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white">Export Your Data</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400">Download a copy of all your jobs, resume data, and interview logs.</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-400 mb-6 font-mono border border-slate-100 dark:border-slate-800">
                    <p>{jobs.length} Applications</p>
                    <p>{resume.experience.length} Experience Entries</p>
                    <p>{resume.projects.length} Projects</p>
                 </div>
                 <button 
                   onClick={handleExportData}
                   className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                 >
                   <Download size={18} /> Download JSON Backup
                 </button>
              </div>

              {/* Danger Zone */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-rose-100 dark:border-rose-900/30">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                       <Trash2 size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white">Danger Zone</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400">Irreversible actions regarding your account.</p>
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                       onClick={signOut}
                       className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                       Sign Out
                    </button>
                    <button 
                       className="px-6 py-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-50 cursor-not-allowed"
                       title="Account deletion coming soon"
                    >
                       Delete Account
                    </button>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;