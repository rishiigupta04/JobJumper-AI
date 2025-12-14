import React, { useState, useEffect, useRef } from 'react';
import { useJobContext } from '../context/JobContext';
import { chatWithChatur } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Sparkles, Loader2, Bot, User, Trash2 } from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const Chatur: React.FC = () => {
  const { stats, jobs, resume, chatMessages, addChatMessage, clearChat, isChatInitialized, setChatInitialized } = useJobContext();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  // Initial Proactive Message
  useEffect(() => {
    if (!isChatInitialized && chatMessages.length === 0) {
      // Add a small delay to make the "reset" feel more natural if clearing
      const timer = setTimeout(() => {
          setChatInitialized(true);
          const conversionRate = stats.applied > 0 ? (stats.interview / stats.applied) : 0;
          
          let initialText = "Hi! I'm Chatur, your AI Career Companion. I have access to your resume and job applications. How can I help you land your dream job today?";
          
          if (conversionRate < 0.1 && stats.applied > 5) {
            initialText = "Hi there! I noticed your interview rate is a bit low. Would you like me to analyze your resume against your recent applications to suggest improvements?";
          } else if (stats.offer > 0) {
            initialText = "Congratulations on your offers! 🎉 Do you need help analyzing the compensation packages or drafting a negotiation script?";
          } else if (jobs.some(j => j.status === 'Interview' && j.interviewDate && new Date(j.interviewDate) > new Date())) {
            const nextInterview = jobs.find(j => j.status === 'Interview' && j.interviewDate && new Date(j.interviewDate) > new Date());
            if (nextInterview) {
                initialText = `I see you have an interview with ${nextInterview.company} coming up. Shall we do a quick mock interview round for the ${nextInterview.role} role?`;
            }
          }

          addChatMessage({ id: 'init', role: 'model', text: initialText, timestamp: Date.now() });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isChatInitialized, chatMessages.length, stats, jobs, setChatInitialized, addChatMessage]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    // Prepare rich context
    const activeOffers = jobs.filter(j => j.status === 'Offer' || j.status === 'Accepted');
    
    // Sort jobs to determine priority for context window inclusion
    const sortedJobs = [...jobs].sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());

    const contextData = {
      userProfile: {
        name: resume.fullName,
        title: resume.jobTitle,
        skills: resume.skills,
        summary: resume.summary,
        // Pass FULL objects so the AI sees descriptions, not just titles/dates
        experience: resume.experience,
        projects: resume.projects,
        education: resume.education
      },
      stats,
      // Separate active offers for high-priority attention
      offers: activeOffers.map(j => ({
        company: j.company,
        role: j.role,
        salary: j.salary,
        negotiationStrategy: j.negotiationStrategy,
        notes: j.notes
      })),
      // Pass comprehensive details to allow differentiation
      jobs: sortedJobs.map(j => {
        // Optimization: Pass full details for Active jobs or recent applications (last 5).
        // For older/rejected jobs, we can truncate descriptions to save context if needed, 
        // but Gemini 2.0 Flash has a huge window, so let's pass as much as possible for accuracy.
        const isPriority = ['Interview', 'Offer', 'Accepted'].includes(j.status);
        
        return {
            company: j.company,
            role: j.role,
            status: j.status,
            location: j.location,
            salary: j.salary,
            dateApplied: j.dateApplied,
            interviewDate: j.interviewDate,
            // Pass FULL description for better context awareness
            description: j.description || 'No description provided',
            notes: j.notes,
            negotiationStrategy: j.negotiationStrategy,
            interviewGuide: j.interviewGuide,
            // Pass FULL cover letter so the user can ask "Critique this cover letter"
            coverLetter: j.coverLetter || 'Not generated yet',
            contacts: j.contacts?.map(c => ({ name: c.name, role: c.role })),
            checklist: j.checklist?.filter(c => !c.completed).map(c => c.text), // Pending items
        };
      }),
      currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };

    const responseText = await chatWithChatur(chatMessages, userMsg.text, contextData);

    const botMsg: ChatMessage = {
      id: generateId(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    addChatMessage(botMsg);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (window.confirm("Start a new conversation? History will be cleared.")) {
      clearChat();
      // Reset local state to ensure UI feels responsive
      setIsTyping(false);
      setInput('');
    }
  };

  // Render markdown bold helper
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="h-[calc(100vh-170px)] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    <Bot size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Chatur <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider">AI Agent</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Context-aware career guidance</p>
                </div>
            </div>
            <button 
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" 
                title="Reset Chat"
            >
                <Trash2 size={18} />
            </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
            {chatMessages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                    {/* Avatar */}
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                        ${msg.role === 'user' 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        }
                    `}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    {/* Bubble */}
                    <div className={`
                        max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                        ${msg.role === 'user' 
                            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                        }
                    `}>
                        <div className="whitespace-pre-wrap">
                            {renderFormattedText(msg.text)}
                        </div>
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                         <Loader2 size={16} className="animate-spin text-indigo-500" />
                         <span className="text-xs text-slate-400">Thinking...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                <div className="absolute left-4 text-indigo-500 pointer-events-none">
                    <Sparkles size={18} />
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Chatur about your applications, interviews, or resume..."
                    className="flex-1 w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default Chatur;