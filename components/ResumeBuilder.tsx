import React, { useState, useRef } from 'react';
import { useJobContext } from '../context/JobContext';
import { enhanceResumeText, parseResumeFromDocument, enhanceFullResume, tailorResume, scoreResume, ResumeScore } from '../services/geminiService';
import { 
  FileText, Sparkles, Plus, Trash2, MapPin, Mail, Phone, Linkedin, 
  GraduationCap, Briefcase, Loader2, FolderGit2, UploadCloud, Wand2, Download, Target, X,
  Percent, AlertTriangle, CheckCircle2, Lightbulb
} from 'lucide-react';
import { Experience, Education, Project, Resume } from '../types';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const ResumeBuilder: React.FC = () => {
  const { resume, updateResume } = useJobContext();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [isFullEnhancing, setIsFullEnhancing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Tailor Resume State
  const [isTailoring, setIsTailoring] = useState(false);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [tailorJd, setTailorJd] = useState('');
  
  // Score Resume State
  const [isScoring, setIsScoring] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreJd, setScoreJd] = useState('');
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for input styles
  const inputClass = "w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400 text-sm";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider";

  // Helper to parse **bold** markdown and format bullet points
  const renderFormattedText = (text: string | any) => {
    if (!text) return null;
    
    // Safety check: ensure text is a string
    let safeText = "";
    if (Array.isArray(text)) {
        safeText = text.join('\n');
    } else if (typeof text !== 'string') {
        safeText = String(text);
    } else {
        safeText = text;
    }

    const lines = safeText.split('\n').filter(line => line.trim());

    // Parse bold segments helper
    const parseBold = (str: string) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
      <ul className="list-none space-y-1">
        {lines.map((line, i) => {
            const trimmed = line.trim();
            // Check for common bullet markers
            const isBullet = /^[•\-\*]/.test(trimmed);
            // Remove bullet marker for clean rendering
            const cleanText = trimmed.replace(/^[•\-\*]\s?/, '');

            return (
                <li key={i} className={`flex items-start ${isBullet ? 'gap-2.5 pl-1' : ''}`}>
                    {isBullet && (
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
                    )}
                    <span className="flex-1 leading-relaxed text-slate-700 text-justify">
                        {parseBold(cleanText)}
                    </span>
                </li>
            );
        })}
      </ul>
    );
  };

  const handleEnhance = async (text: string, type: 'summary' | 'experience' | 'project', id?: string) => {
    const loadingKey = id || type;
    setIsEnhancing(loadingKey);
    const improved = await enhanceResumeText(text, type);
    
    if (type === 'summary') {
      updateResume({ ...resume, summary: improved });
    } else if (type === 'experience' && id) {
      const newExp = resume.experience.map(exp => 
        exp.id === id ? { ...exp, description: improved } : exp
      );
      updateResume({ ...resume, experience: newExp });
    } else if (type === 'project' && id) {
        const newProj = resume.projects.map(proj => 
            proj.id === id ? { ...proj, description: improved } : proj
        );
        updateResume({ ...resume, projects: newProj });
    }
    setIsEnhancing(null);
  };

  const handleFullEnhancement = async () => {
    if (!resume.experience.length && !resume.summary && !resume.projects.length) {
        alert("Please add some content to your resume first.");
        return;
    }

    if (!window.confirm("This will rewrite your resume descriptions using AI to be more professional. Your contact details will remain safe. Continue?")) return;

    setIsFullEnhancing(true);
    try {
        const enhanced = await enhanceFullResume(resume);
        applyResumeUpdates(enhanced);
        alert("Resume enhanced successfully!");
    } catch (e: any) {
        console.error(e);
        alert(`Failed to enhance resume. ${e.message || 'Please try again.'}`);
    } finally {
        setIsFullEnhancing(false);
    }
  };

  const handleTailorResume = async () => {
    if (!tailorJd.trim()) return;

    setIsTailoring(true);
    try {
        const tailored = await tailorResume(resume, tailorJd);
        applyResumeUpdates(tailored);
        setShowTailorModal(false);
        setTailorJd('');
        alert("Resume successfully tailored to the Job Description!");
    } catch (e: any) {
        console.error(e);
        alert(`Failed to tailor resume. ${e.message || 'Please try again.'}`);
    } finally {
        setIsTailoring(false);
    }
  };

  const handleScoreResume = async () => {
    if (!scoreJd.trim()) return;
    setIsScoring(true);
    setScoreResult(null);
    try {
      const result = await scoreResume(resume, scoreJd);
      setScoreResult(result);
    } catch (e: any) {
      console.error(e);
      alert("Failed to score resume. Please try again.");
    } finally {
      setIsScoring(false);
    }
  };

  const applyResumeUpdates = (enhanced: Resume) => {
      const newResume: Resume = {
          ...resume, // Keep original as base (preserves avatar, etc.)
          ...enhanced, // Apply AI changes
          avatarImage: resume.avatarImage, // Explicitly preserve avatar as it's stripped in service
          // Ensure IDs are present and valid, using AI returned IDs if available or fallback to original
          experience: (enhanced.experience || []).map((e, i) => ({
              ...e, 
              id: e.id || resume.experience[i]?.id || generateId()
          })),
          projects: (enhanced.projects || []).map((p, i) => ({
              ...p, 
              id: p.id || resume.projects[i]?.id || generateId()
          })),
          education: (enhanced.education || []).map((e, i) => ({
              ...e, 
              id: e.id || resume.education[i]?.id || generateId()
          }))
      };
      
      updateResume(newResume);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const parsedData = await parseResumeFromDocument(base64);
          
          // Merge logic: Ensure IDs are present for arrays
          const newResume: Resume = {
            ...resume,
            ...parsedData,
            experience: parsedData.experience?.map(e => ({ ...e, id: generateId() })) || [],
            projects: parsedData.projects?.map(p => ({ ...p, id: generateId() })) || [],
            education: parsedData.education?.map(ed => ({ ...ed, id: generateId() })) || [],
          };
          
          updateResume(newResume);
        } catch (err) {
          console.error("Parse error", err);
          alert("Failed to parse resume. Please ensure the file is clear.");
        }
        setIsImporting(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsImporting(false);
    }
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: generateId(),
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateResume({ ...resume, experience: [newExp, ...resume.experience] });
  };

  const removeExperience = (id: string) => {
    updateResume({ ...resume, experience: resume.experience.filter(e => e.id !== id) });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    updateResume({
      ...resume,
      experience: resume.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const addProject = () => {
    const newProj: Project = {
        id: generateId(),
        name: '',
        technologies: '',
        link: '',
        description: ''
    };
    updateResume({ ...resume, projects: [newProj, ...resume.projects] });
  };

  const removeProject = (id: string) => {
    updateResume({ ...resume, projects: resume.projects.filter(p => p.id !== id) });
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    updateResume({
      ...resume,
      projects: resume.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: generateId(),
      degree: '',
      school: '',
      year: '',
      grade: ''
    };
    updateResume({ ...resume, education: [newEdu, ...resume.education] });
  };

  const removeEducation = (id: string) => {
    updateResume({ ...resume, education: resume.education.filter(e => e.id !== id) });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    updateResume({
      ...resume,
      education: resume.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      
      {/* Mobile Tabs */}
      <div className="lg:hidden flex mb-4 border-b border-slate-200 dark:border-slate-700 print:hidden">
        <button 
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'edit' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          Editor
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'preview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          Preview
        </button>
      </div>

      {/* Editor Panel */}
      <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar print:hidden ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
        <div className="space-y-8 pb-10">
          
          {/* AI Tools Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">AI Assistant Tools</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Automate your resume creation.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {/* Intelligent Import */}
               <div className="relative">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting || isFullEnhancing || isTailoring || isScoring}
                    className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 px-2 py-3 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-sm"
                  >
                    {isImporting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={20} className="text-indigo-500" />}
                    {isImporting ? 'Analyzing' : 'Import'}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,application/pdf" 
                    onChange={handleImport}
                  />
               </div>

               {/* Score Resume */}
               <button 
                  onClick={() => setShowScoreModal(true)}
                  disabled={isImporting || isFullEnhancing || isTailoring || isScoring}
                  className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 px-2 py-3 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-sm"
               >
                  {isScoring ? <Loader2 size={16} className="animate-spin" /> : <Percent size={20} className="text-emerald-500" />}
                  {isScoring ? 'Scoring' : 'Score'}
               </button>

               {/* Tailor Resume */}
               <button 
                  onClick={() => setShowTailorModal(true)}
                  disabled={isImporting || isFullEnhancing || isTailoring || isScoring}
                  className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 text-slate-700 dark:text-slate-300 px-2 py-3 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-sm"
               >
                  {isTailoring ? <Loader2 size={16} className="animate-spin" /> : <Target size={20} className="text-purple-500" />}
                  {isTailoring ? 'Tailoring' : 'Tailor'}
               </button>

               {/* Full Enhancement */}
               <button 
                  onClick={handleFullEnhancement}
                  disabled={isImporting || isFullEnhancing || isTailoring || isScoring}
                  className="w-full h-full bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-indigo-200 dark:shadow-none"
               >
                  {isFullEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={20} />}
                  {isFullEnhancing ? 'Polishing' : 'Polish'}
               </button>
            </div>
          </div>

          {/* Personal Info */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} value={resume.fullName} onChange={e => updateResume({...resume, fullName: e.target.value})} placeholder="Rishiraj Gupta" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} value={resume.email} onChange={e => updateResume({...resume, email: e.target.value})} placeholder="rishiraj.gupta@example.com" />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={resume.phone} onChange={e => updateResume({...resume, phone: e.target.value})} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input className={inputClass} value={resume.location} onChange={e => updateResume({...resume, location: e.target.value})} placeholder="Bengaluru, Karnataka" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>LinkedIn / Portfolio</label>
                <input className={inputClass} value={resume.linkedin} onChange={e => updateResume({...resume, linkedin: e.target.value})} placeholder="https://www.linkedin.com/in/rishirajgupta04/" />
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Professional Summary</h3>
              <button 
                onClick={() => handleEnhance(resume.summary, 'summary')}
                disabled={isEnhancing === 'summary' || !resume.summary}
                className="text-xs flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
              >
                {isEnhancing === 'summary' ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                Enhance with AI
              </button>
            </div>
            <textarea 
              className={`${inputClass} min-h-[120px] resize-y`}
              value={resume.summary} 
              onChange={e => updateResume({...resume, summary: e.target.value})}
              placeholder="Briefly describe your professional background and key achievements..."
            />
          </section>

          {/* Skills */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Skills</h3>
            <textarea 
              className={`${inputClass} min-h-[80px]`}
              value={resume.skills} 
              onChange={e => updateResume({...resume, skills: e.target.value})}
              placeholder="React | TypeScript | Node.js | Project Management..."
            />
            <p className="text-xs text-slate-500 mt-2">Separate skills with vertical bars (|).</p>
          </section>

          {/* Experience */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Briefcase size={20} className="text-indigo-600" /> Experience
              </h3>
              <button onClick={addExperience} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus size={16}/> Add Role
              </button>
            </div>
            
            <div className="space-y-6">
              {resume.experience.map((exp, index) => (
                <div key={exp.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Role #{index + 1}</h4>
                    <button onClick={() => removeExperience(exp.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Role</label>
                      <input className={inputClass} value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="Software Engineer" />
                    </div>
                    <div>
                      <label className={labelClass}>Company</label>
                      <input className={inputClass} value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="TCS" />
                    </div>
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input className={inputClass} type="text" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" />
                    </div>
                    <div>
                      <label className={labelClass}>End Date</label>
                      <input className={inputClass} type="text" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} placeholder="Present" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className={labelClass}>Description</label>
                       <button 
                          onClick={() => handleEnhance(exp.description, 'experience', exp.id)}
                          disabled={isEnhancing === exp.id || !exp.description}
                          className="text-[10px] flex items-center gap-1 text-purple-600 hover:text-purple-700 disabled:opacity-50"
                        >
                          {isEnhancing === exp.id ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                          Polish
                        </button>
                    </div>
                    <textarea 
                      className={`${inputClass} min-h-[100px]`}
                      value={exp.description} 
                      onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                      placeholder="• Achievements..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FolderGit2 size={20} className="text-indigo-600" /> Projects
              </h3>
              <button onClick={addProject} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus size={16}/> Add Project
              </button>
            </div>
            
            <div className="space-y-6">
              {resume.projects && resume.projects.map((proj, index) => (
                <div key={proj.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Project #{index + 1}</h4>
                    <button onClick={() => removeProject(proj.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Project Name</label>
                      <input className={inputClass} value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} placeholder="E-commerce App" />
                    </div>
                    <div>
                      <label className={labelClass}>Technologies</label>
                      <input className={inputClass} value={proj.technologies} onChange={e => updateProject(proj.id, 'technologies', e.target.value)} placeholder="React, Node.js" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Link</label>
                      <input className={inputClass} value={proj.link} onChange={e => updateProject(proj.id, 'link', e.target.value)} placeholder="github.com/myproject" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className={labelClass}>Description</label>
                       <button 
                          onClick={() => handleEnhance(proj.description, 'project', proj.id)}
                          disabled={isEnhancing === proj.id || !proj.description}
                          className="text-[10px] flex items-center gap-1 text-purple-600 hover:text-purple-700 disabled:opacity-50"
                        >
                          {isEnhancing === proj.id ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                          Polish
                        </button>
                    </div>
                    <textarea 
                      className={`${inputClass} min-h-[80px]`}
                      value={proj.description} 
                      onChange={e => updateProject(proj.id, 'description', e.target.value)}
                      placeholder="• Built a full-stack application..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <GraduationCap size={20} className="text-indigo-600" /> Education
              </h3>
              <button onClick={addEducation} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus size={16}/> Add School
              </button>
            </div>
            
            <div className="space-y-4">
              {resume.education.map((edu, index) => (
                <div key={edu.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mr-4">
                        <div>
                          <label className={labelClass}>Degree</label>
                          <input className={inputClass} value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="B.Tech Computer Science" />
                        </div>
                        <div>
                          <label className={labelClass}>School</label>
                          <input className={inputClass} value={edu.school} onChange={e => updateEducation(edu.id, 'school', e.target.value)} placeholder="IIT Delhi" />
                        </div>
                        <div>
                          <label className={labelClass}>Year</label>
                          <input className={inputClass} value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} placeholder="2020" />
                        </div>
                        <div>
                          <label className={labelClass}>Grade / % (Optional)</label>
                          <input className={inputClass} value={edu.grade || ''} onChange={e => updateEducation(edu.id, 'grade', e.target.value)} placeholder="e.g. 9.0 CGPA or 85%" />
                        </div>
                    </div>
                    <button onClick={() => removeEducation(edu.id)} className="text-slate-400 hover:text-rose-500 transition-colors mt-6">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Preview Panel */}
      <div className={`flex-1 bg-slate-200 dark:bg-slate-900 p-4 lg:p-8 rounded-2xl overflow-y-auto print:bg-white print:p-0 print:overflow-visible ${activeTab === 'edit' ? 'hidden lg:block' : ''}`}>
        
        {/* Actions Bar */}
        <div className="mb-4 flex justify-end print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors"
          >
            <Download size={18} />
            Save as PDF
          </button>
        </div>

        {/* Resume Preview */}
        <div id="resume-preview-container">
            <div id="resume-preview" className="bg-white text-slate-900 w-full max-w-[210mm] mx-auto min-h-[297mm] p-[10mm] shadow-2xl origin-top transform scale-100 print:shadow-none print:w-full print:max-w-none print:min-h-0">
              
              {/* Header */}
              <div className="border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide mb-2">{resume.fullName}</h1>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-medium">
                  {resume.email && <span className="flex items-center gap-1"><Mail size={12}/> {resume.email}</span>}
                  {resume.phone && <span className="flex items-center gap-1"><Phone size={12}/> {resume.phone}</span>}
                  {resume.location && <span className="flex items-center gap-1"><MapPin size={12}/> {resume.location}</span>}
                  {resume.linkedin && <span className="flex items-center gap-1"><Linkedin size={12}/> {resume.linkedin}</span>}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 mb-2 pb-1">Professional Summary</h2>
                  <div className="text-sm text-slate-700 leading-relaxed text-justify">
                    {renderFormattedText(resume.summary)}
                  </div>
                </div>
              )}

              {/* Skills */}
              {resume.skills && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 mb-2 pb-1">Technical Skills</h2>
                  <p className="text-sm text-slate-700 leading-relaxed">{resume.skills}</p>
                </div>
              )}

              {/* Experience */}
              {resume.experience.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 mb-3 pb-1">Experience</h2>
                  <div className="space-y-4">
                    {resume.experience.map(exp => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                          <span className="text-xs font-semibold text-slate-500">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600 mb-2">{exp.company}</div>
                        <div className="text-sm text-slate-700 leading-relaxed">
                            {renderFormattedText(exp.description)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resume.projects && resume.projects.length > 0 && (
                 <div className="mb-6">
                   <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 mb-3 pb-1">Projects</h2>
                   <div className="space-y-4">
                     {resume.projects.map(proj => (
                       <div key={proj.id}>
                         <div className="flex justify-between items-baseline mb-1">
                           <h3 className="text-sm font-bold text-slate-900">{proj.name}</h3>
                           {proj.link && <span className="text-xs text-indigo-600 italic">{proj.link}</span>}
                         </div>
                         <div className="text-xs font-semibold text-slate-500 mb-2">{proj.technologies}</div>
                         <div className="text-sm text-slate-700 leading-relaxed">
                            {renderFormattedText(proj.description)}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              )}

              {/* Education */}
              {resume.education.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 mb-3 pb-1">Education</h2>
                  <div className="space-y-3">
                    {resume.education.map(edu => (
                      <div key={edu.id} className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{edu.school}</div>
                          <div className="text-xs text-slate-600">{edu.degree}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-xs font-semibold text-slate-500">{edu.year}</div>
                            {edu.grade && <div className="text-xs font-medium text-slate-500 mt-0.5">{edu.grade}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Tailor Resume Modal */}
      {showTailorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Target size={20} className="text-purple-600" /> Tailor to Job
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Optimize your resume for a specific role and ATS.</p>
                 </div>
                 <button onClick={() => setShowTailorModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                 </button>
              </div>

              <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                  <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                      The AI will rewrite your <strong>Summary</strong>, <strong>Experience</strong>, and <strong>Skills</strong> to match keywords from the Job Description below.
                  </p>
              </div>

              <div className="mb-6">
                 <label className={labelClass}>Job Description (JD)</label>
                 <textarea 
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-y min-h-[200px] text-sm"
                    placeholder="Paste the full job description here..."
                    value={tailorJd}
                    onChange={(e) => setTailorJd(e.target.value)}
                 />
              </div>

              <div className="flex justify-end gap-3">
                 <button 
                    onClick={() => setShowTailorModal(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleTailorResume}
                    disabled={!tailorJd.trim() || isTailoring}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-70"
                 >
                    {isTailoring ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    {isTailoring ? 'Optimizing...' : 'Tailor Resume'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Score Resume Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${scoreResult ? 'max-w-4xl' : 'max-w-lg'} p-6 animate-fade-in border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Percent size={20} className="text-emerald-600" /> Resume Score Card
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analyze your fit against a specific job.</p>
                 </div>
                 <button onClick={() => setShowScoreModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                 </button>
              </div>

              {!scoreResult ? (
                <>
                  <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                          Paste the Job Description below. The AI will act as a strict Hiring Manager and score your resume, highlighting Strengths, Gaps, and actionable fixes.
                      </p>
                  </div>

                  <div className="mb-6">
                    <label className={labelClass}>Job Description (JD)</label>
                    <textarea 
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-y min-h-[200px] text-sm"
                        placeholder="Paste the full job description here..."
                        value={scoreJd}
                        onChange={(e) => setScoreJd(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowScoreModal(false)}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleScoreResume}
                        disabled={!scoreJd.trim() || isScoring}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {isScoring ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />}
                        {isScoring ? 'Analyzing...' : 'Analyze Match'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Score Header */}
                  <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="relative h-24 w-24 flex items-center justify-center">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                          <path 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            fill="none" 
                            stroke={scoreResult.score > 75 ? '#10b981' : scoreResult.score > 50 ? '#f59e0b' : '#ef4444'} 
                            strokeWidth="3" 
                            strokeDasharray={`${scoreResult.score}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">{scoreResult.score}%</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">Match</span>
                        </div>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Verdict</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {scoreResult.summary}
                        </p>
                     </div>
                  </div>

                  {/* 3 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Strengths */}
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                       <h4 className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400 mb-3">
                          <CheckCircle2 size={18} /> Top Strengths
                       </h4>
                       <ul className="space-y-2">
                          {scoreResult.strengths.map((item, i) => (
                             <li key={i} className="text-sm text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                {item}
                             </li>
                          ))}
                       </ul>
                    </div>

                    {/* Gaps */}
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                       <h4 className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-400 mb-3">
                          <AlertTriangle size={18} /> Missing / Weak
                       </h4>
                       <ul className="space-y-2">
                          {scoreResult.gaps.map((item, i) => (
                             <li key={i} className="text-sm text-rose-900 dark:text-rose-200 flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                {item}
                             </li>
                          ))}
                       </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                       <h4 className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-400 mb-3">
                          <Lightbulb size={18} /> Recommendations
                       </h4>
                       <ul className="space-y-2">
                          {scoreResult.recommendations.map((item, i) => (
                             <li key={i} className="text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                {item}
                             </li>
                          ))}
                       </ul>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                     <button 
                        onClick={() => { setScoreResult(null); setScoreJd(''); }}
                        className="text-sm text-slate-500 hover:text-indigo-600 font-medium px-4"
                     >
                        Analyze Another Job
                     </button>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;