import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, AlertCircle, Briefcase, ArrowRight, Sparkles, CheckCircle2, Mail, Lock } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background Gradients & Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-emerald-500/10 rounded-full blur-[100px]"></div>
        </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 z-10 items-center">
        
        {/* Left Side: Value Prop (Desktop) */}
        <div className="hidden lg:block space-y-8 animate-fade-in pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium backdrop-blur-sm">
                <Sparkles size={14} />
                <span>Powered by Google Gemini 2.0</span>
            </div>
            
            <h1 className="text-5xl font-bold text-white leading-tight">
                Master Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Career Journey</span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                JobJumper AI is your unfair advantage in the modern job market. We streamline your entire search—from parsing resumes and generating hyper-personalized cover letters to simulating interviews and crafting salary negotiation strategies.
            </p>

            <div className="space-y-4">
                {[
                    "AI Resume Parsing & Optimization",
                    "Tailored Cover Letter Generation",
                    "Smart Interview Prep & Mock Questions",
                    "Offer Analysis & Negotiation Strategies"
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-300 group">
                        <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <CheckCircle2 size={16} />
                        </div>
                        <span className="font-medium">{feature}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full max-w-md mx-auto">
            <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 p-8 rounded-3xl shadow-2xl animate-fade-in relative overflow-hidden">
                
                {/* Subtle sheen effect on card */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>

                {/* Mobile Logo/Title */}
                <div className="lg:hidden flex flex-col items-center mb-8">
                     <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4 animate-bounce">
                        <Briefcase className="text-white" size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">JobJumper AI</h1>
                    <p className="text-slate-400 text-sm mt-2">AI-Powered Career Command Center</p>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {isLogin ? 'Enter your credentials to access your workspace.' : 'Join thousands of professionals landing their dream jobs.'}
                    </p>
                </div>

                {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                             <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all hover:border-slate-600"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                             <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all hover:border-slate-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
                >
                    {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                    ) : (
                    <>
                        {isLogin ? 'Sign In' : 'Get Started'} <ArrowRight size={18} />
                    </>
                    )}
                </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-800">
                <p className="text-slate-400 text-sm">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all"
                    >
                    {isLogin ? 'Sign up for free' : 'Log in'}
                    </button>
                </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;