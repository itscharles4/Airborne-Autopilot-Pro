
import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, Server, Network, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { analyzeAirspaceSafety } from '../services/geminiService';
import { Drone, Alert } from '../types';

interface DashboardProps {
  drones: Drone[];
}

const mockChartData = Array.from({ length: 20 }).map((_, i) => ({
  time: `${i}:00`,
  cpu: Math.floor(Math.random() * 20) + 10,
  memory: Math.floor(Math.random() * 30) + 40,
  latency: Math.floor(Math.random() * 15) + 5,
}));

const Dashboard: React.FC<DashboardProps> = ({ drones }) => {
  const [aiInsight, setAiInsight] = useState<string>("Standby for traffic analysis...");
  const [isRetrying, setIsRetrying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchInsight = useCallback(async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setAiInsight("Analyzing traffic patterns...");
    
    const insight = await analyzeAirspaceSafety(drones, []);
    setAiInsight(insight || "Unable to retrieve insights.");
    
    if (insight.includes("QUOTA_EXHAUSTED")) {
      setIsRetrying(true);
    } else {
      setIsRetrying(false);
    }
    
    setIsAnalyzing(false);
  }, [drones, isAnalyzing]);

  // Throttled effect: Only auto-refresh every 60 seconds
  useEffect(() => {
    fetchInsight();
    const interval = setInterval(fetchInsight, 60000); 
    return () => clearInterval(interval);
  }, []); // Run on mount and keep the interval

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
        <p className="text-slate-400 mt-1">Real-time telemetrics and computational performance.</p>
      </header>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'CPU Utilization', value: '14.2%', icon: Zap, color: 'bg-amber-500/10 text-amber-500' },
          { label: 'Memory Load', value: '41.8%', icon: Server, color: 'bg-sky-500/10 text-sky-500' },
          { label: 'Network Latency', value: '12ms', icon: Network, color: 'bg-emerald-500/10 text-emerald-500' },
          { label: 'System Health', value: 'Optimal', icon: ShieldCheck, color: 'bg-violet-500/10 text-violet-500' },
        ].map((item, idx) => (
          <div key={idx} className="glass p-6 rounded-2xl border border-slate-800 flex items-center gap-6">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</div>
              <div className="text-2xl font-bold mt-1 tracking-tight">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass rounded-2xl border border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-sky-400" />
              Computational Performance
            </h3>
            <div className="flex gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500"></div> Memory</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> CPU</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="memory" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorMemory)" />
                <Area type="monotone" dataKey="cpu" stroke="#10b981" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="glass rounded-2xl border border-slate-800 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap size={20} className="text-amber-400 fill-amber-400" />
              Gemini Safety Advisor
            </h3>
            <button 
              onClick={fetchInsight}
              disabled={isAnalyzing || isRetrying}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-30"
            >
              <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className={`flex-1 overflow-auto rounded-xl p-4 border italic text-sm leading-relaxed ${isRetrying ? 'bg-rose-500/5 border-rose-500/20 text-rose-300/70' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}>
            {aiInsight}
            {isRetrying && (
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase text-rose-500">
                <AlertCircle size={12} />
                Quota Cooldown Period Active
              </div>
            )}
            {!isRetrying && !isAnalyzing && (
              <div className="mt-3 text-[9px] text-slate-600 uppercase tracking-widest font-bold">
                Next Auto-Update in ~60s
              </div>
            )}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 text-xs text-sky-500/80">
            <strong>System Note:</strong> Periodic analysis reduces API overhead. Click refresh icon for on-demand safety auditing.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
