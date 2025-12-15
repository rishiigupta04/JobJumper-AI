import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, AlertCircle, ArrowRight, Sparkles, Mail, Lock, Zap, TrendingUp, MessageCircle, Github, Linkedin, Heart } from 'lucide-react';

// Moved outside to prevent re-rendering on mouse move
const FuturisticFooter = () => (
  <div className="flex flex-col gap-4 animate-fade-in delay-500 pt-6 pb-2">
      <div className="h-px w-24 bg-gradient-to-r from-indigo-500 to-transparent mb-2"></div>
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span>Crafted with</span>
          <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
          <span>by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold hover:text-indigo-400 transition-colors cursor-default">Rishi</span></span>
      </div>
      
      <div className="flex items-center gap-3">
          <a href="https://www.linkedin.com/in/rishirajgupta04/" target="_blank" rel="noopener noreferrer" className="group relative block w-auto">
              <div className="absolute inset-0 bg-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 group-hover:text-white group-hover:border-indigo-500/50 transition-all duration-300 flex items-center gap-2">
                  <Linkedin size={18} />
                  <span className="text-xs font-bold pr-1">LinkedIn</span>
              </div>
          </a>
          
          <a href="https://github.com/rishiigupta04" target="_blank" rel="noopener noreferrer" className="group relative block w-auto">
              <div className="absolute inset-0 bg-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 group-hover:text-white group-hover:border-purple-500/50 transition-all duration-300 flex items-center gap-2">
                  <Github size={18} />
                  <span className="text-xs font-bold pr-1">GitHub</span>
              </div>
          </a>
      </div>
  </div>
);

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mouse Parallax State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only do parallax on desktop to save battery/performance on mobile
      if (window.innerWidth < 1024) return;
      
      // Normalize mouse position from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-x-hidden font-sans selection:bg-indigo-500/30">
        
        {/* CSS for custom animations */}
        <style>{`
          @keyframes float {
            0% { transform: translateY(0px) rotate(-6deg); }
            50% { transform: translateY(-20px) rotate(-6deg); }
            100% { transform: translateY(0px) rotate(-6deg); }
          }
          @keyframes float-delayed {
            0% { transform: translateY(0px) rotate(3deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
            100% { transform: translateY(0px) rotate(3deg); }
          }
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 10s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .animate-float { animation: float 8s ease-in-out infinite; }
          .animate-float-delayed { animation: float-delayed 9s ease-in-out infinite; }
          .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 15s ease infinite; }
          @keyframes gradient-x {
            0% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
            100% { background-position: 0% 50% }
          }
        `}</style>

        {/* Dynamic Background Mesh */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px] mix-blend-screen animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] mix-blend-screen animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[128px] mix-blend-screen animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>

      {/* Brand Header */}
      <nav className="w-full max-w-7xl mx-auto z-50 flex-shrink-0 flex justify-between items-center p-6 lg:px-12">
         <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                 <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                 </svg>
             </div>
             <span className="text-2xl font-black text-white tracking-tight">Job<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Jumper</span></span>
         </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 px-6 lg:px-12 z-10 py-8 lg:py-16">
        
        {/* Left Side: Landing Copy */}
        <div className="flex-1 flex flex-col justify-center space-y-6 lg:space-y-6 w-full">
            
            <div className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-slate-900/40 border border-slate-700/50 text-indigo-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg shadow-indigo-900/20 transform hover:scale-105 transition-transform duration-300">
                <Zap size={14} className="fill-indigo-400 animate-pulse" />
                <span>The Career Cheat Code</span>
            </div>
            
            {/* Typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight">
                Job Hunt on <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                    Autopilot.
                </span>
            </h1>
            
            <p className="text-lg lg:text-lg xl:text-xl text-slate-400 leading-relaxed max-w-lg font-medium">
                Stop spamming "Easy Apply". <br className="hidden lg:block"/>
                We built the ultimate <strong className="text-indigo-400">Gen AI solution</strong> to roast your resume, write cover letters that actually slap, and help you secure the bag. 💰
            </p>

            {/* Interactive Floating Cards - Desktop Only */}
            <div className="hidden lg:block relative h-48 xl:h-64 w-full mt-2 pointer-events-none select-none perspective-1000">
                {/* Card 1: Offer */}
                <div 
                    className="absolute top-0 left-0 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-4 xl:p-5 rounded-2xl shadow-2xl w-64 xl:w-72 animate-float z-10 transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px) rotate(-6deg)` }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/20">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Offer</p>
                            <p className="text-white font-bold text-base">Netflix</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full w-[90%] bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <p className="text-right text-[10px] text-emerald-400 mt-2 font-mono font-bold flex justify-end items-center gap-1">
                        <span className="animate-pulse">●</span> +45% Salary Hike
                    </p>
                </div>

                {/* Card 2: AI Chat */}
                <div 
                    className="absolute bottom-4 right-12 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-4 xl:p-5 rounded-2xl shadow-2xl w-72 xl:w-80 animate-float-delayed z-20 transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px) rotate(3deg)` }}
                >
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg ring-2 ring-slate-900">
                            <MessageCircle size={20} />
                        </div>
                        <div className="text-xs xl:text-sm text-slate-200 bg-slate-800/80 p-3 rounded-2xl rounded-tl-none border border-slate-700/50 leading-relaxed shadow-sm">
                            <p>Yo, your resume's impact score just hit <span className="text-emerald-400 font-bold">98/100</span>. Apply now? 🔥</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Footer (Integrated into left column for consistent alignment) */}
            <div className="hidden lg:block mt-8">
                <FuturisticFooter />
            </div>
        </div>

        {/* Right Side: Auth Form */}
        {/* Adjusted positioning: Moved up (-translate-y) and slightly left (-translate-x) on desktop */}
        <div className="w-full max-w-sm mx-auto relative perspective-1000 lg:-translate-y-12 lg:-translate-x-8">
            {/* Form Container */}
            <div 
                className="backdrop-blur-3xl bg-slate-900/70 border border-white/10 p-6 lg:p-8 rounded-[1.5rem] shadow-2xl relative overflow-hidden group transition-all duration-300 ease-out hover:shadow-indigo-500/10 hover:border-white/20"
                style={{ 
                    // Only apply 3D transform on desktop to avoid weird scroll issues on mobile
                    transform: typeof window !== 'undefined' && window.innerWidth > 1024 
                        ? `rotateX(${mousePos.y * -2}deg) rotateY(${mousePos.x * 2}deg)` 
                        : 'none',
                    transformStyle: 'preserve-3d'
                }}
            >
                
                {/* Spotlight effect */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/30 transition-all duration-500"></div>

                <div className="mb-6 lg:mb-6 relative z-10 text-center">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 lg:mb-4 group-hover:scale-105 transition-transform duration-500">
                        <Sparkles className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">
                        {isLogin ? 'Welcome Back.' : 'Join the Club.'}
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        {isLogin ? 'Ready to make some moves?' : 'Your dream job is loading...'}
                    </p>
                </div>

                {error && (
                <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs animate-fade-in">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4 lg:space-y-4 relative z-10">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                             <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-2.5 lg:py-3 rounded-xl bg-slate-950/50 border border-slate-700/50 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:border-slate-600 text-sm"
                            placeholder="you@future-ceo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                             <Lock size={16} />
                        </div>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-2.5 lg:py-3 rounded-xl bg-slate-950/50 border border-slate-700/50 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 group-hover:border-slate-600 text-sm"
                            placeholder="shhh... it's a secret"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 lg:py-3 bg-white hover:bg-indigo-50 text-slate-900 rounded-xl font-black text-sm lg:text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4 relative overflow-hidden group"
                >
                    {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                    ) : (
                    <>
                        <span className="relative z-10 flex items-center gap-2">{isLogin ? 'Let\'s Go' : 'Start Free'} <ArrowRight size={16} /></span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </>
                    )}
                </button>
                </form>

                <div className="mt-5 lg:mt-6 text-center relative z-10">
                    <p className="text-slate-500 text-xs">
                        {isLogin ? "New here? " : "Already familiar? "}
                        <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white hover:text-indigo-400 font-bold hover:underline transition-all"
                        >
                        {isLogin ? 'Create an account' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
            
            {/* Trust badge below form */}
            <div className="mt-6 flex justify-center gap-6 opacity-60">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    <ShieldIcon /> Secure
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    <ZapIcon /> Fast
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    <GlobeIcon /> Global
                </div>
            </div>
        </div>
      </main>

       {/* Mobile Footer */}
       <div className="lg:hidden p-6 text-center border-t border-slate-800/50 bg-slate-950/30 backdrop-blur-sm mt-8">
           <FuturisticFooter />
       </div>

    </div>
  );
};

// Mini Components for icons
const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)
const ZapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
)
const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>
)

export default Auth;