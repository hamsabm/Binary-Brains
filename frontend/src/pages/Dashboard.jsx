import React, { useState, useEffect, useMemo } from 'react';
import { getStats, getFullCycle } from '../api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ShieldCheck, ShieldAlert, Cpu, Activity, 
  Map as MapIcon, Lock, ChevronUp, ChevronDown, 
  Zap, Globe, Target, AlertTriangle, Swords, Shield as ShieldIcon,
  Crosshair, Radio
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ total_events: 0, threats_detected: 0, ips_blocked: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await getStats();
        setStats(statsRes.data);
        
        setChartData(prev => {
          const newData = [...prev, { time: new Date().toLocaleTimeString().slice(0, 5), val: statsRes.data.total_events }].slice(-15);
          return newData;
        });

        const cycleRes = await getFullCycle();
        setRecentEvents(prev => [cycleRes.data, ...prev].slice(0, 10));
      } catch (err) {
        console.warn("Sync failed", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const threatRatio = useMemo(() => 
    Math.round((stats.threats_detected / Math.max(stats.total_events, 1)) * 100), 
    [stats]
  );

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in zoom-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
         <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
               WarRoomX <span className="vibrant-gradient-text glow-text">Command Center</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
               <Radio size={12} className="text-cyan-400 animate-pulse" /> Multi-Agent AI Orchestration // Node_Active
            </p>
         </div>
         <div className="flex gap-4">
            <div className="px-6 py-3 premium-glass rounded-2xl border-white/5 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 glow-emerald animate-pulse" />
               <span className="text-[10px] font-black text-white tracking-widest uppercase">System Operational</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
         
         {/* LEFT COLUMN: ATTACK ENGINE (Offensive) */}
         <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                  <Swords className="text-pink-500" size={18} />
               </div>
               <h2 className="text-xl font-black text-white uppercase tracking-widest">Offensive Engine</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <EngineKPI label="Ingress Traffic" value={stats.total_events} sub="Total Attack Vectors" color="pink" icon={<Activity />} />
               <EngineKPI label="Payload Velocity" value="2.4 MB/s" sub="Traffic Intensity" color="pink" icon={<Zap />} />
            </div>

            <div className="premium-card p-6 flex-1 min-h-[300px]">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Ingress Waveform</span>
                  <div className="flex items-center gap-2 text-[9px] text-pink-500 font-bold">
                     LIVE FEED <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  </div>
               </div>
               <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                        <defs>
                           <linearGradient id="attackGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="val" stroke="#ff3366" strokeWidth={3} fill="url(#attackGlow)" animationDuration={1000} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN: DEFENSE ENGINE (Active Measures) */}
         <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <ShieldIcon className="text-cyan-500" size={18} />
               </div>
               <h2 className="text-xl font-black text-white uppercase tracking-widest">Defense Engine</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <EngineKPI label="Threats Blocked" value={stats.threats_detected} sub="Neutralized Risks" color="cyan" icon={<ShieldAlert />} />
               <EngineKPI label="Mitigation Rate" value={`${threatRatio}%`} sub="AI Success Index" color="cyan" icon={<Cpu />} />
            </div>

            <div className="premium-card p-6 flex-1 min-h-[300px] flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Defense Resolution Mix</span>
                  <span className="text-[9px] text-cyan-500 font-bold">AUTONOMOUS MODE</span>
               </div>
               <div className="flex-1 flex items-center justify-center gap-8">
                  <div className="w-40 h-40">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie 
                              data={[{v:60},{v:25},{v:15}]} 
                              innerRadius={50} outerRadius={65} paddingAngle={10} dataKey="v" stroke="none"
                              cx="50%" cy="50%"
                           >
                              <Cell fill="#22d3ee" />
                              <Cell fill="#7d00ff" />
                              <Cell fill="#1e293b" />
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                     <LegendItem label="IP Quarantine" val="60%" color="bg-cyan-500" />
                     <LegendItem label="DNS Redirect" val="25%" color="bg-purple-500" />
                     <LegendItem label="Rate Limiting" val="15%" color="bg-slate-700" />
                  </div>
               </div>
            </div>
         </div>

         {/* BOTTOM FULL WIDTH: THE WAR ROOM LOGS */}
         <div className="col-span-12 flex flex-col gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Globe className="text-purple-500" size={18} />
               </div>
               <h2 className="text-xl font-black text-white uppercase tracking-widest">Neural War Room</h2>
            </div>

            <div className="premium-card p-0 overflow-hidden">
               <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                     <AlertTriangle size={14} className="text-pink-500 shadow-sm" /> Global Tactical Ledger
                  </h3>
                  <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-pink-500 glow-pink animate-pulse" />
                     <div className="w-2 h-2 rounded-full bg-cyan-500 glow-blue animate-pulse" />
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-black/40">
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Incident_IP</th>
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Engine_Status</th>
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Confidence</th>
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">WarRoom_Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {recentEvents.map((e, idx) => (
                           <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                              <td className="px-8 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white mono whitespace-nowrap">{e.log.ip}</span>
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{e.log.country}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${e.log.attack_type === 'sql_injection' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20 shadow-[0_0_15px_rgba(255,51,102,0.1)]' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'}`}>
                                    {e.log.attack_type.toUpperCase().replace('_',' ')}
                                 </span>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="h-2 w-32 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                       <div className={`h-full transition-all duration-1000 ${e.detection.confidence > 85 ? 'bg-pink-500' : 'bg-cyan-500'}`} style={{ width: `${e.detection.confidence}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-slate-200 mono">{e.detection.confidence}%</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${e.response.action === 'block_ip' ? 'bg-pink-500' : 'bg-cyan-500'} animate-pulse`} />
                                    <span className="text-[11px] font-black text-white uppercase italic tracking-wider">{e.response.action.replace('_',' ')}</span>
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

const EngineKPI = ({ label, value, sub, icon, color }) => {
   const variants = {
      pink: 'border-pink-500/20 from-pink-500/5 to-transparent text-pink-500',
      cyan: 'border-cyan-500/20 from-cyan-500/5 to-transparent text-cyan-500'
   };

   return (
      <div className={`premium-card p-6 bg-gradient-to-br ${variants[color]} flex flex-col gap-4 group transition-all duration-500 hover:-translate-y-1`}>
         <div className="flex justify-between items-start">
            <div className={`p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform ${variants[color].split(' ')[2]}`}>
               {React.cloneElement(icon, { size: 18 })}
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
         </div>
         <div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</div>
            <div className="text-3xl font-black text-white mono whitespace-nowrap tracking-tighter">{value}</div>
            <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">{sub}</div>
         </div>
      </div>
   );
};

const LegendItem = ({ label, val, color }) => (
   <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${color} glow-${color.split('-')[1]}`} />
      <div className="flex flex-col">
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
         <span className="text-xs font-bold text-white mono">{val}</span>
      </div>
   </div>
);

export default Dashboard;
