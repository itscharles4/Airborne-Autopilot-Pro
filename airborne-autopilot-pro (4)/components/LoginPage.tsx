
import React, { useState } from 'react';
import { Cpu, ShieldCheck, ArrowRight, Lock, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      onLogin();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-10"></div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="relative w-full max-w-md p-8">
        <div className="glass p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-8">
          <header className="text-center space-y-4">
            <div className="inline-flex w-16 h-16 bg-sky-600 rounded-2xl items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.4)] mb-2">
              <Cpu className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">Airborne</h1>
            <p className="text-slate-400 font-medium">Authentication Portal • V2.5.0</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Credentials</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Operational ID" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="Security Key" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold transition-all shadow-[0_10px_30px_-10px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <footer className="pt-4 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                <ShieldCheck size={14} className="text-emerald-500" />
                Quantum Encryption Active
             </div>
             <button type="button" className="text-xs text-sky-400/60 hover:text-sky-400 transition-colors">Emergency Bypass Mode</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
