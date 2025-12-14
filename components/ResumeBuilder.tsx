import React, { useState, useRef } from 'react';
import { useJobContext } from '../context/JobContext';
import { enhanceResumeText, parseResumeFromImage } from '../services/geminiService';
import { 
  FileText, Sparkles, Plus, Trash2, MapPin, Mail, Phone, Linkedin, 
  GraduationCap, Briefcase, Loader2, FolderGit2, UploadCloud 
} from 'lucide-react';
import { Experience, Education, Project, Resume } from '../types';

const ResumeBuilder: React.FC = () => {
  const { resume, updateResume } = useJobContext();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for input styles
  const inputClass = "w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400 text-sm";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider";

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const parsedData = await parseResumeFromImage(base64);
          
          // Merge logic: Ensure IDs are present for arrays
          const newResume: Resume = {
            ...resume,
            ...parsedData,
            experience: parsedData.experience?.map(e => ({ ...e, id: crypto.randomUUID() })) || [],
            projects: parsedData.projects?.map(p => ({ ...p, id: crypto.randomUUID() })) || [],
            education: parsedData.education?.map(ed => ({ ...ed, id: crypto.randomUUID() })) || [],
          };
          
          updateResume(newResume);
        } catch (err) {
          console.error("Parse error", err);
          alert("Failed to parse resume. Please ensure the image is clear.");
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
      id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
      degree: '',
      school: '',
      year: ''
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
      <div className="lg:hidden flex mb-4 border-b border-slate-200 dark:border-slate-700">
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
      <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
        <div className="space-y-8 pb-10">
          
          {/* Header Action */}
          <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <div>
              <h3 className="font-bold text-indigo-900 dark:text-indigo-100">Intelligent Import</h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">Upload a resume image to auto-fill details.</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
              >
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {isImporting ? 'Analyzing...' : 'Upload Resume'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImport}
              />
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
                <input className={inputClass} value={resume.fullName} onChange={e => updateResume({...resume, fullName: e.target.value})} placeholder="Aryan Sharma" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} value={resume.email} onChange={e => updateResume({...resume, email: e.target.value})} placeholder="aryan.sharma@example.com" />
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
                <input className={inputClass} value={resume.linkedin} onChange={e => updateResume({...resume, linkedin: e.target.value})} placeholder="linkedin.com/in/aryansharma" />
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
              placeholder="React, TypeScript, Node.js, Project Management..."
            />
            <p className="text-xs text-slate-500 mt-2">Separate skills with commas.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mr-4">
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
      <div className={`flex-1 bg-slate-200 dark:bg-slate-900 p-4 lg:p-8 rounded-2xl overflow-y-auto ${activeTab === 'edit' ? 'hidden lg:block' : ''}`}>
        <div className="bg-white text-slate-900 w-full max-w-[210mm] mx-auto min-h-[297mm] p-[10mm] shadow-2xl origin-top transform scale-100">
          
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
              <p className="text-sm text-slate-700 leading-relaxed text-justify">{resume.summary}</p>
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
                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{exp.description}</div>
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
                     <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{proj.description}</div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 mb-3 pb-1">Education</h2>
              <div className="space-y-2">
                {resume.education.map(edu => (
                  <div key={edu.id} className="flex justify-between items-baseline">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{edu.school}</div>
                      <div className="text-xs text-slate-600">{edu.degree}</div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
