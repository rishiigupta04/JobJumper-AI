import React, { useState } from 'react';
import { LayoutDashboard, Briefcase, Award, UserCircle, LogOut, FileText, Camera, Calendar, MessageCircle, PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../context/AuthContext';
import { useJobContext } from '../context/JobContext';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { signOut, user } = useAuth();
  const { resume } = useJobContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'applications', label: 'My Applications', icon: Briefcase },
    { id: 'offers', label: 'Offers Received', icon: Award },
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'avatar', label: 'AI Avatar', icon: Camera },
    { id: 'chat', label: 'Chat with Chatur', icon: MessageCircle },
  ];

  const mobileNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'applications', icon: Briefcase, label: 'Apps' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'schedule', icon: Calendar, label: 'Plan' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar - Visible on md and up */}
      <div className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen sticky top-0 bg-[#0f172a] text-slate-300 hidden md:flex flex-col border-r border-slate-800 shadow-2xl print:hidden transition-all duration-300 z-50`}>
        {/* Header */}
        <div className={`p-6 flex items-center h-20 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden group">
              <div className="h-8 w-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 transition-transform group-hover:scale-105">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                  </svg>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight whitespace-nowrap overflow-hidden">
                JobJumper
              </h1>
            </div>
          )}
          
          <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${isCollapsed ? '' : ''}`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 mt-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} shrink-0`} />
                
                {!isCollapsed && (
                    <span className="font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                        {item.label}
                    </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800">
          <div 
              onClick={() => setView('settings')}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
              title="Go to Settings"
          >
            {resume.avatarImage ? (
              <img src={resume.avatarImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-600 shrink-0" />
            ) : (
              <UserCircle size={28} className="text-indigo-400 shrink-0" />
            )}
            
            {!isCollapsed && (
              <>
                  <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                          {resume.fullName || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{resume.jobTitle || 'Pro Plan'}</p>
                  </div>
                  <button 
                      onClick={(e) => { e.stopPropagation(); signOut(); }} 
                      title="Sign Out" 
                      className="shrink-0 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                      <LogOut size={16} className="text-slate-500 hover:text-rose-400 transition-colors" />
                  </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Hidden on md and up */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-800 z-50 px-2 py-2 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
               <button
                 key={item.id}
                 onClick={() => setView(item.id as ViewState)}
                 className={`flex flex-col items-center justify-center w-full h-full gap-1 rounded-xl transition-all duration-200 ${
                   isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                 }`}
               >
                 <div className={`p-1.5 rounded-full ${isActive ? 'bg-indigo-500/20' : ''}`}>
                   <Icon size={20} className={isActive ? 'fill-indigo-500/20' : ''} />
                 </div>
                 <span className="text-[10px] font-medium">{item.label}</span>
               </button>
            )
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;