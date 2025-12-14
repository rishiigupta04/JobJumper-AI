import React from 'react';
import { LayoutDashboard, Briefcase, Award, Settings, UserCircle, LogOut, FileText, Camera } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'My Applications', icon: Briefcase },
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'avatar', label: 'AI Avatar', icon: Camera },
    { id: 'offers', label: 'Offers Received', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen sticky top-0 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl">
      {/* Brand */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
            G
          </span>
          GetAJ*b
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors">
          <UserCircle size={32} className="text-indigo-400" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Aryan Sharma</p>
            <p className="text-xs text-slate-500 truncate">Pro Plan</p>
          </div>
          <LogOut size={16} className="text-slate-500 hover:text-white" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
