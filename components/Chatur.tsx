import React, { useState, useEffect, useRef } from 'react';
import { useJobContext } from '../context/JobContext';
import { chatWithChatur } from '../services/geminiService';
import { ChatMessage } from '../types';
import { MessageCircle, X, Send, User, Sparkles, MinusCircle, Loader2 } from 'lucide-react';

const Chatur: React.FC = () => {
  const { stats, jobs } = useJobContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initial Proactive Message
  useEffect(() => {
    if (isOpen && !hasInitialized && messages.length === 0) {
      setHasInitialized(true);
      const conversionRate = stats.applied > 0 ? (stats.interview / stats.applied) : 0;
      
      let initialText = "Hi! I'm Chatur, your AI Career Companion. How can I help you land your dream job today?";
      
      if (conversionRate < 0.1 && stats.applied > 5) {
        initialText = "Hi there! I noticed your interview rate is a bit low. Would you like me to review your resume or suggest some improvements?";
      } else if (stats.offer > 0) {
        initialText = "Congratulations on your offers! 🎉 Need help negotiating a better salary or deciding which one to accept?";
      }

      setMessages([
        { id: 'init', role: 'model', text: initialText, timestamp: Date.now() }
      ]);
    }
  }, [isOpen, hasInitialized, messages.length, stats]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const contextData = {
      stats,
      recentJobs: jobs.slice(0, 5).map(j => ({ role: j.role, company: j.company, status: j.status }))
    };

    const responseText = await chatWithChatur(messages, userMsg.text, contextData);

    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in origin-bottom-right">
          
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Chatur AI</h3>
                <p className="text-xs text-indigo-100">Career Coach</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <MinusCircle size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for career advice..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white placeholder:text-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center ${
          isOpen ? 'bg-slate-700 text-white rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default Chatur;
