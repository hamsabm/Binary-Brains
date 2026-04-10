import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ShieldCheck, ShieldAlert, Cpu, Activity, 
  Map as MapIcon, Lock, ChevronUp, ChevronDown, 
  Zap, Globe, Target, AlertTriangle, Swords, Shield as ShieldIcon,
  Crosshair, Radio, Brain, Gauge, Play, Terminal, HelpCircle, Trophy, UserCheck, Power, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({ total_events: 0, threats_detected: 0, ips_blocked: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [simulationActive, setSimulationActive] = useState(true);
  const [prediction, setPrediction] = useState({ type: "Predicting...", probability: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [sRes, lRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/dashboard/stats', { headers }),
        axios.get('http://127.0.0.1:8000/dashboard/logs', { headers })
      ]);

      setStats(sRes.data);
      setRecentEvents(lRes.data);
      
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString().slice(3, 8), val: sRes.data.total_events }].slice(-15);
        return newData;
      });
    } catch (err) {
      console.warn("Sync failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleSimulation = async () => {
    const token = localStorage.getItem('access_token');
    const endpoint = simulationActive ? 'stop' : 'start';
    try {
      await axios.post(`http://127.0.0.1:8000/simulate/${endpoint}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSimulationActive(!simulationActive);
    } catch (e) {
      console.error("Simulation signal failure", e);
    }
  };

  const threatRatio = useMemo(() => 
    Math.round((stats.threats_detected / Math.max(stats.total_events, 1)) * 100), 
    [stats]
  );

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in zoom-in duration-700 pb-20">
      
      {/* HEADER SECTION WITH SIMULATION OVERRIDE */}
      <div className="flex justify-between items-center bg-black/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
         <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
               WarRoomX <span className="vibrant-gradient-text glow-text">Command Center</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
               <Radio size={12} className="text-cyan-400 animate-pulse" /> Advanced Neural Engagement // Node_Active
            </p>
         </div>

         <div className="flex gap-4 items-center">
            {/* SIMULATION TOGGLE HUD */}
            <div className="flex items-center gap-4 premium-glass px-6 py-3 rounded-2xl border-white/10 bg-white/2">
                <div className="flex flex-col text-right">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Simulation Protocol</span>
                   <span className={`text-xs font-black uppercase tracking-tighter ${simulationActive ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {simulationActive ? 'AUTO_GENERATION_ON' : 'MANUAL_MODE_IDLE'}
                   </span>
                </div>
                <button 
                  onClick={toggleSimulation}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${simulationActive ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500'}`}
                >
                   <Power size={20} />
                </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8 stagger-in">
         
         {/* KPI GRID */}
         <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <EngineKPI label="Ingress Traffic" value={stats.total_events} sub="Attack Vectors" color="pink" icon={<Activity />} />
            <EngineKPI label="Threats Blocked" value={stats.threats_detected} sub="Secured Triage" color="cyan" icon={<ShieldAlert />} />
            <EngineKPI label="Mitigation Index" value={`${threatRatio}%`} sub="Neural Efficiency" color="cyan" icon={<Cpu />} />
         </div>

         {/* WAVEFORM ANALYSIS */}
         <div className="col-span-12 lg:col-span-6">
            <div className="premium-card p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                   <div className="flex items-center gap-3">
                      <Target className="text-pink-500" size={18} />
                      <span className="text-sm font-black text-white uppercase tracking-widest italic">Traffic Waveform</span>
                   </div>
                   <div className="flex items-center gap-2 text-[9px] text-pink-500 font-black animate-pulse">
                      SECURE_ENCRYPTED_STREAM
                   </div>
                </div>
                <div className="flex-1 min-h-[240px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                         <defs>
                            <linearGradient id="attackGlow" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <Area type="monotone" dataKey="val" stroke="#ff3366" strokeWidth={4} fill="url(#attackGlow)" animationDuration={1000} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
            </div>
         </div>

         {/* RISK Triage */}
         <div className="col-span-12 lg:col-span-3">
            <div className="premium-card p-8 h-full flex flex-col items-center justify-between text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5">
                   <Settings size={120} className="animate-spin-slow" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10 font-mono">Neural Prioritization</span>
                <div className="w-44 h-44 relative flex items-center justify-center my-6 z-10">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={[{v:0+stats.threats_detected},{v:10}]} innerRadius={60} outerRadius={75} startAngle={180} endAngle={0} dataKey="v" stroke="none">
                            <Cell fill="#22d3ee" />
                            <Cell fill="#1e293b" />
                         </Pie>
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white tracking-tighter mono">{threatRatio}%</span>
                      <span className="text-[8px] font-black text-cyan-400 uppercase">SAFE</span>
                   </div>
                </div>
                <button className="w-full py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all z-10">
                   Analyze Drift
                </button>
            </div>
         </div>

         {/* LIVE LEDGER */}
         <div className="col-span-12">
            <div className="premium-card p-0 overflow-hidden border-white/5">
                <div className="p-8 border-b border-white/5 bg-white/2 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                         <Terminal size={20} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Tactical Stream</h3>
                         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Real-time situational awareness ledger</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                       {['CRITICAL', 'WARNING', 'INFO'].map(l => (
                         <div key={l} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">{l}</div>
                       ))}
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-black/40">
                            <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Source Vector</th>
                            <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Incursion Class</th>
                            <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mitigation Path</th>
                            <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stability</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {recentEvents.length === 0 ? (
                            <tr><td colSpan="4" className="p-20 text-center text-slate-700 italic text-sm">Awaiting neural pulse data from ingress nodes...</td></tr>
                         ) : recentEvents.map(e => (
                            <tr key={e.log_id || Math.random()} className="hover:bg-white/[0.03] transition-colors group">
                               <td className="px-10 py-6">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-black text-white mono">{e.ip}</span>
                                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{e.country} // NODE_0{Math.floor(Math.random()*9)}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <span className={`px-4 py-1 rounded-full text-[9px] font-black tracking-widest ${e.attack_type === 'sql_injection' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                                     {e.attack_type.toUpperCase().replace('_',' ')}
                                  </span>
                               </td>
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-3">
                                     <Zap size={14} className="text-yellow-500" />
                                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest underline decoration-cyan-500/30 decoration-2 underline-offset-4">EXECUTE_TRIAGE</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="flex-1 h-3 bg-black/60 rounded-full border border-white/5 p-0.5 max-w-[120px]">
                                        <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" style={{ width: '92%' }} />
                                     </div>
                                     <span className="text-[10px] font-black text-emerald-500">92%</span>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const EngineKPI = ({ label, value, sub, icon, color }) => (
  <div className={`premium-card p-10 flex flex-col gap-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
     {/* Decorative pulse background */}
     <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700 bg-${color}-500`} />
     
     <div className="flex justify-between items-start relative z-10">
        <div className={`p-4 rounded-2xl bg-${color === 'pink' ? 'pink' : 'cyan'}-500/10 text-${color === 'pink' ? 'pink-500' : 'cyan-400'} border border-${color === 'pink' ? 'pink' : 'cyan'}-500/20 shadow-xl`}>
           {React.cloneElement(icon, { size: 24 })}
        </div>
        <div className="flex gap-1">
           {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/10" />)}
        </div>
     </div>
     <div className="relative z-10">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{label}</div>
        <div className="text-4xl font-black text-white tracking-tighter mono">{value}</div>
        <div className="text-[9px] font-bold text-slate-600 uppercase mt-1 italic">{sub}</div>
     </div>
  </div>
);

export default Dashboard;
