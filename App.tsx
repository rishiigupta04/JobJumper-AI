import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { JobProvider, useJobContext } from './context/JobContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import Offers from './components/Offers';
import ResumeBuilder from './components/ResumeBuilder';
import AvatarBuilder from './components/AvatarBuilder';
import Schedule from './components/Schedule';
import Chatur from './components/Chatur';
import Settings from './components/Settings';
import Auth from './components/Auth';
import AgentsDashboard from './components/AgentsDashboard';
import { ViewState } from './types';
import { Sun, Moon, LogOut, Loader2, Settings as SettingsIcon, Heart, Github, Linkedin } from 'lucide-react';

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const { theme, toggleTheme, loading: dataLoading } = useJobContext();
  const { signOut, user } = useAuth();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setView={setCurrentView} />;
      case 'applications':
        return <JobList />;
      case 'offers':
        return <Offers />;
      case 'resume':
        return <ResumeBuilder />;
      case 'avatar':
        return <AvatarBuilder />;
      case 'schedule':
        return <Schedule />;
      case 'settings':
        return <Settings />;
      case 'chat':
        return <Chatur />;
      case 'agents':
        return <AgentsDashboard setView={setCurrentView} />;
      default:
        return <Dashboard setView={setCurrentView} />;
    }
  };

  if (dataLoading) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );
  }

  // If in Agent Mode, render full screen without standard sidebar
  if (currentView === 'agents') {
     return <AgentsDashboard setView={setCurrentView} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 relative">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      {/* Main Container - Adjusted padding for mobile/desktop breakpoint */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-screen pb-24 md:pb-12 print:h-auto print:overflow-visible flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 print:hidden">
             <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                  {currentView === 'resume' ? 'Resume Builder' : 
                   currentView === 'avatar' ? 'AI Avatar Studio' :
                   currentView === 'chat' ? 'AI Career Companion' :
                   currentView.replace(/([A-Z])/g, ' $1').trim()}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
             </div>
             
             <div className="flex items-center gap-3 self-end md:self-auto">
                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  aria-label="Toggle Dark Mode"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Settings Button (Desktop Only - Mobile has nav item) */}
                <button
                   onClick={() => setCurrentView('settings')}
                   className={`hidden md:block p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all ${
                     currentView === 'settings' 
                       ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' 
                       : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                   }`}
                   title="Settings"
                >
                   <SettingsIcon size={20} />
                </button>

                <div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-[150px] truncate">{user?.email}</span>
                </div>

                <button 
                  onClick={signOut} 
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Sign Out"
                >
                    <LogOut size={20} />
                </button>
             </div>
          </header>

          {/* View Content */}
          {renderView()}
        </div>

        {/* Custom Footer - Hidden on Mobile (< md) */}
        <footer className="hidden md:flex mt-12 py-6 border-t border-slate-200 dark:border-slate-800 flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400 print:hidden">
            <div className="flex items-center gap-2">
                <span>Made with</span>
                <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
                <span>by <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Rishi</span></span>
            </div>
            <div className="flex items-center gap-4">
                <a href="https://www.linkedin.com/in/rishirajgupta04/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Linkedin size={18} /></a>
                <a href="https://github.com/rishirajgupta04" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors"><Github size={18} /></a>
            </div>
        </footer>
      </main>
    </div>
  );
}

const AuthWrapper: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    if (!user) {
        return <Auth />;
    }

    return (
        <JobProvider>
            <MainContent />
        </JobProvider>
    );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

export default App;