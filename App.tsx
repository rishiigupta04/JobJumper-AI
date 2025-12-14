import React, { useState } from 'react';
import { JobProvider, useJobContext } from './context/JobContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import Offers from './components/Offers';
import ResumeBuilder from './components/ResumeBuilder';
import AvatarBuilder from './components/AvatarBuilder';
import Chatur from './components/Chatur';
import { ViewState } from './types';
import { Sun, Moon } from 'lucide-react';

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const { theme, toggleTheme } = useJobContext();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'applications':
        return <JobList />;
      case 'offers':
        return <Offers />;
      case 'resume':
        return <ResumeBuilder />;
      case 'avatar':
        return <AvatarBuilder />;
      case 'settings':
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <p>Settings coming in Phase 2</p>
            </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 relative">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
             <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                  {currentView === 'resume' ? 'Resume Builder' : 
                   currentView === 'avatar' ? 'AI Avatar Studio' :
                   currentView.replace(/([A-Z])/g, ' $1').trim()}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
             </div>
             
             <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  aria-label="Toggle Dark Mode"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* System Status */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">System Online</span>
                </div>
             </div>
          </header>

          {/* View Content */}
          {renderView()}
        </div>
      </main>

      {/* Floating Chat Component */}
      <Chatur />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <JobProvider>
      <MainContent />
    </JobProvider>
  );
};

export default App;
