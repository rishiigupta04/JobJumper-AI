import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { scoreResume, tailorResume, enhanceResumeText, ResumeScore } from '../services/geminiService';
import { 
  Briefcase, GraduationCap, Code2, User, Plus, Trash2, 
  Wand2, Target, Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Lightbulb
} from 'lucide-react';
import { Resume, Experience, Project, Education } from '../types';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

const ResumeBuilder: React.FC = () => {
  const { resume, updateResume } = useJobContext();
  
  const [activeSection, setActiveSection] = useState<string | null>('experience');
  const [isScoring, setIsScoring] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null); // ID of item being enhanced
  
  // Modals / Overlays
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  
  // Results
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleUpdate = (field: keyof Resume, value: any) => {
    updateResume({ ...resume, [field]: value });
  };

  // --- Actions ---

  const handleScore = async () => {
    if (!jobDescription) return;
    setIsScoring(true);
    try {
      const result = await scoreResume(resume, jobDescription);
      setScoreResult(result);
      setShowScoreModal(false); 
    } catch (e) {
      console.error(e);
      alert("Failed to score resume.");
    } finally {
      setIsScoring(false);
    }
  };

  const handleTailor = async () => {
    if (!jobDescription) return;
    setIsTailoring(true);
    try {
      const newResume = await tailorResume(resume, jobDescription);
      updateResume(newResume);
      setShowTailorModal(false);
      alert("Resume tailored successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to tailor resume.");
    } finally {
      setIsTailoring(false);
    }
  };

  const handleEnhanceText = async (id: string, text: string, type: 'summary' | 'experience' | 'project') => {
    setIsEnhancing(id);
    try {
      const improved = await enhanceResumeText(text, type);
      // Update logic based on type
      if (type === 'summary') {
        handleUpdate('summary', improved);
      } else if (type === 'experience') {
         const newExp = resume.experience.map(e => e.id === id ? { ...e, description: improved } : e);
         handleUpdate('experience', newExp);
      } else if (type === 'project') {
         const newProj = resume.projects.map(p => p.id === id ? { ...p, description: improved } : p);
         handleUpdate('projects', newProj);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(null);
    }
  };

  // --- List Management ---

  const addExperience = () => {
    const newItem: Experience = {
      id: generateId(),
      role: 'New Role',
      company: 'Company',
      startDate: '',
      endDate: '',
      description: ''
    };
    handleUpdate('experience', [newItem, ...resume.experience]);
    setActiveSection('experience');
  };

  const removeExperience = (id: string) => {
    handleUpdate('experience', resume.experience.filter(e => e.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, val: string) => {
    handleUpdate('experience', resume.experience.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const addProject = () => {
    const newItem: Project = {
      id: generateId(),
      name: 'New Project',
      technologies: '',
      link: '',
      description: ''
    };
    handleUpdate('projects', [newItem, ...resume.projects]);
    setActiveSection('projects');
  };

  const removeProject = (id: string) => {
    handleUpdate('projects', resume.projects.filter(p => p.id !== id));
  };

   const updateProject = (id: string, field: keyof Project, val: string) => {
    handleUpdate('projects', resume.projects.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const addEducation = () => {
    const newItem: Education = {
      id: generateId(),
      degree: 'Degree',
      school: 'School',
      year: 'Year'
    };
    handleUpdate('education', [newItem, ...resume.education]);
    setActiveSection('education');
  };

  const removeEducation = (id: string) => {
    handleUpdate('education', resume.education.filter(e => e.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, val: string) => {
    handleUpdate('education', resume.education.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  // Render Helpers
  const inputClass = "w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider";

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Resume Builder</h2>
                <p className="text-slate-500 dark:text-slate-400">Craft, analyze, and tailor your resume with AI.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => { setShowScoreModal(true); setScoreResult(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-700 dark:text-slate-300 font-medium"
                >
                    <Target size={18} className="text-blue-500" /> Score Resume
                </button>
                <button 
                    onClick={() => setShowTailorModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors font-medium"
                >
                    <Wand2 size={18} /> Tailor to JD
                </button>
            </div>
        </div>

        {/* Score Result Banner */}
        {scoreResult && (
            <div className="mb-8 bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl animate-fade-in relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className={`text-4xl font-black ${scoreResult.score >= 70 ? 'text-emerald-400' : scoreResult.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                 {scoreResult.score}/100
                             </div>
                             <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                                 Match Score
                             </div>
                        </div>
                        <p className="text-slate-300 max-w-2xl">{scoreResult.summary}</p>
                    </div>
                    <button onClick={() => setScoreResult(null)} className="text-slate-400 hover:text-white">Close</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="flex items-center gap-2 font-bold text-emerald-400 mb-3 text-sm uppercase tracking-wider">
                            <CheckCircle2 size={16} /> Strengths
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {scoreResult.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="flex items-center gap-2 font-bold text-rose-400 mb-3 text-sm uppercase tracking-wider">
                            <AlertTriangle size={16} /> Gaps
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {scoreResult.gaps.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="flex items-center gap-2 font-bold text-blue-400 mb-3 text-sm uppercase tracking-wider">
                            <Lightbulb size={16} /> Recommendations
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {scoreResult.recommendations.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Editor */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Summary Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => toggleSection('summary')}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <User size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Professional Summary</h3>
                        </div>
                        {activeSection === 'summary' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </button>
                    
                    {activeSection === 'summary' && (
                        <div className="p-6 pt-0 animate-fade-in border-t border-slate-100 dark:border-slate-800">
                             <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className={labelClass}>Summary Text</label>
                                    <button 
                                        onClick={() => handleEnhanceText('summary', resume.summary, 'summary')}
                                        disabled={isEnhancing === 'summary'}
                                        className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
                                    >
                                        {isEnhancing === 'summary' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                        Enhance with AI
                                    </button>
                                </div>
                                <textarea 
                                    value={resume.summary}
                                    onChange={(e) => handleUpdate('summary', e.target.value)}
                                    className="w-full h-32 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                                    placeholder="Brief overview of your career..."
                                />
                             </div>
                        </div>
                    )}
                </div>

                {/* 2. Experience Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => toggleSection('experience')}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Briefcase size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Experience</h3>
                        </div>
                        {activeSection === 'experience' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </button>
                    
                    {activeSection === 'experience' && (
                        <div className="p-6 pt-0 animate-fade-in border-t border-slate-100 dark:border-slate-800">
                             <div className="mt-6 space-y-6">
                                {resume.experience.map((exp) => (
                                    <div key={exp.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 relative group">
                                        <button 
                                            onClick={() => removeExperience(exp.id)}
                                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className={labelClass}>Role</label>
                                                <input className={inputClass} value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="Software Engineer" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Company</label>
                                                <input className={inputClass} value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Acme Inc" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Start Date</label>
                                                <input className={inputClass} value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} placeholder="Jan 2020" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>End Date</label>
                                                <input className={inputClass} value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} placeholder="Present" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className={labelClass}>Description (Bullet Points)</label>
                                                <button 
                                                    onClick={() => handleEnhanceText(exp.id, exp.description, 'experience')}
                                                    disabled={isEnhancing === exp.id}
                                                    className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
                                                >
                                                    {isEnhancing === exp.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                                    Improve Bullets
                                                </button>
                                            </div>
                                            <textarea 
                                                className="w-full h-32 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                                                value={exp.description}
                                                onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                                                placeholder="• Achieved X..."
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={addExperience}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus size={18} /> Add Experience
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                {/* 3. Projects Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => toggleSection('projects')}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Code2 size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Projects</h3>
                        </div>
                        {activeSection === 'projects' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </button>
                    
                    {activeSection === 'projects' && (
                        <div className="p-6 pt-0 animate-fade-in border-t border-slate-100 dark:border-slate-800">
                             <div className="mt-6 space-y-6">
                                {resume.projects.map((proj) => (
                                    <div key={proj.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 relative group">
                                        <button 
                                            onClick={() => removeProject(proj.id)}
                                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className={labelClass}>Project Name</label>
                                                <input className={inputClass} value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} placeholder="E-commerce App" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Link</label>
                                                <input className={inputClass} value={proj.link} onChange={e => updateProject(proj.id, 'link', e.target.value)} placeholder="github.com/..." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Technologies</label>
                                                <input className={inputClass} value={proj.technologies} onChange={e => updateProject(proj.id, 'technologies', e.target.value)} placeholder="React, Node.js" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className={labelClass}>Description</label>
                                                <button 
                                                    onClick={() => handleEnhanceText(proj.id, proj.description, 'project')}
                                                    disabled={isEnhancing === proj.id}
                                                    className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
                                                >
                                                    {isEnhancing === proj.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                                    Improve
                                                </button>
                                            </div>
                                            <textarea 
                                                className="w-full h-24 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                                                value={proj.description}
                                                onChange={e => updateProject(proj.id, 'description', e.target.value)}
                                                placeholder="Built a full-stack app..."
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={addProject}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus size={18} /> Add Project
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                {/* 4. Education Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <button 
                        onClick={() => toggleSection('education')}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <GraduationCap size={20} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Education</h3>
                        </div>
                        {activeSection === 'education' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </button>
                    
                    {activeSection === 'education' && (
                        <div className="p-6 pt-0 animate-fade-in border-t border-slate-100 dark:border-slate-800">
                             <div className="mt-6 space-y-6">
                                {resume.education.map((edu) => (
                                    <div key={edu.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 relative group">
                                        <button 
                                            onClick={() => removeEducation(edu.id)}
                                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Degree</label>
                                                <input className={inputClass} value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="B.S. Computer Science" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>School</label>
                                                <input className={inputClass} value={edu.school} onChange={e => updateEducation(edu.id, 'school', e.target.value)} placeholder="University" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Year</label>
                                                <input className={inputClass} value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} placeholder="2020" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Grade/GPA (Optional)</label>
                                                <input className={inputClass} value={edu.grade || ''} onChange={e => updateEducation(edu.id, 'grade', e.target.value)} placeholder="3.8 GPA" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={addEducation}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus size={18} /> Add Education
                                </button>
                             </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Right Column: Preview & Tips */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Preview Mini */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sticky top-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Live Preview</h3>
                    
                    <div className="aspect-[210/297] bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden relative">
                         <div className="absolute inset-0 p-3 overflow-hidden text-[6px] text-slate-800 leading-tight">
                            <h1 className="text-[10px] font-bold uppercase mb-1">{resume.fullName || 'YOUR NAME'}</h1>
                            <p className="mb-2 text-slate-500">{resume.email} | {resume.phone}</p>
                            
                            <h2 className="font-bold uppercase border-b border-slate-300 mb-1 mt-2">Summary</h2>
                            <p>{resume.summary?.substring(0, 150)}...</p>

                            <h2 className="font-bold uppercase border-b border-slate-300 mb-1 mt-2">Experience</h2>
                            {resume.experience.map(e => (
                                <div key={e.id} className="mb-1">
                                    <strong>{e.role}</strong> at {e.company}
                                </div>
                            ))}
                         </div>
                         {/* Overlay */}
                         <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center pointer-events-none">
                            <FileText className="text-slate-400 opacity-20" size={64} />
                         </div>
                    </div>
                    
                    <button className="w-full mt-4 bg-slate-800 dark:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
                        Download PDF (Coming Soon)
                    </button>
                </div>

            </div>
        </div>

        {/* Modal: Score / Tailor */}
        {(showScoreModal || showTailorModal) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                        {showTailorModal ? 'Tailor Resume' : 'Score Resume'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Paste the Job Description (JD) below. The AI will {showTailorModal ? 'optimize your resume keywords' : 'analyze how well you match'} for this specific role.
                    </p>
                    
                    <textarea 
                        className="w-full h-48 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm mb-6"
                        placeholder="Paste Job Description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                    
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => { setShowScoreModal(false); setShowTailorModal(false); }}
                            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={showTailorModal ? handleTailor : handleScore}
                            disabled={!jobDescription.trim() || isScoring || isTailoring}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {(isScoring || isTailoring) ? <Loader2 className="animate-spin" size={18} /> : (showTailorModal ? <Wand2 size={18} /> : <Target size={18} />)}
                            {showTailorModal ? (isTailoring ? 'Tailoring...' : 'Tailor Resume') : (isScoring ? 'Scoring...' : 'Analyze Match')}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ResumeBuilder;