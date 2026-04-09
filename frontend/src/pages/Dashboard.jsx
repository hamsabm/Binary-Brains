import React, { useState, useEffect, useMemo } from 'react';
import { getStats, getFullCycle } from '../api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  ShieldCheck, ShieldAlert, Cpu, Activity, 
  Map as MapIcon, Lock, ChevronUp, ChevronDown, 
  Zap, Globe, Target, AlertTriangle
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
      
      {/* CINEMATIC HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
               Operational <span className="vibrant-gradient-text glow-text">Intelligence</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
               <Activity size={14} className="text-cyan-400 animate-pulse" /> Unified Neural Threat Monitoring // Section_07
            </p>
         </div>
         <div className="flex items-center gap-4 premium-glass px-6 py-3 rounded-2xl border-white/5 shadow-2xl">
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Trust Index</span>
               <div className="text-xl font-black text-white mono">99.2%</div>
            </div>
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
               <Zap className="text-cyan-400" size={20} />
            </div>
         </div>
      </div>

      {/* KPI GRID - VIBRANT & LARGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIBox label="Data Ingress" value={stats.total_events} sub="Active Flow" icon={<Activity className="text-cyan-500" />} color="cyan" />
        <KPIBox label="Threats Intercepted" value={stats.threats_detected} sub="Neutralized" icon={<ShieldAlert className="text-pink-500" />} color="pink" />
        <KPIBox label="Security Blocks" value={stats.ips_blocked || 14} sub="Perimeter Stays" icon={<Lock className="text-purple-500" />} color="purple" />
        <KPIBox label="AI Logic Confidence" value={`${threatRatio}%`} sub="Neural Health" icon={<Cpu className="text-emerald-500" />} color="emerald" />
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* BIG CHART AREA */}
        <div className="col-span-12 lg:col-span-8 premium-card p-8 flex flex-col gap-6">
           <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                 <Target size={18} className="text-cyan-400" /> Real-time Traffic Waveform
              </h3>
              <div className="flex gap-2">
                 <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase">Live_Telemetry</div>
              </div>
           </div>
           
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="glowVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00eaff" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00eaff" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis dataKey="val" hide />
                    <ChartTooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                       itemStyle={{ color: '#00eaff' }}
                    />
                    <Area type="monotone" dataKey="val" stroke="url(#glowVal)" strokeWidth={4} fillOpacity={1} fill="url(#glowVal)" animationDuration={1000} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* SIDE METRICS */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
           <div className="premium-card p-6 flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Asset Distribution</h3>
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                 <div className="w-48 h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie 
                            data={[{v:40},{v:30},{v:30}]} 
                            innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="v" stroke="none"
                            cx="50%" cy="50%"
                          >
                             <Cell fill="var(--accent-cyan)" />
                             <Cell fill="var(--accent-purple)" />
                             <Cell fill="var(--accent-pink)" />
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-2xl font-black text-white leading-none">88%</span>
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Efficiency</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-8 w-full">
                    <PieStat label="Cloud" val="40" color="bg-cyan-500" />
                    <PieStat label="Edge" val="30" color="bg-purple-500" />
                    <PieStat label="Core" val="30" color="bg-pink-500" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* RECENT ACTIONS LOG */}
      <div className="premium-card p-0 overflow-hidden">
         <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
               <AlertTriangle size={16} className="text-pink-500" /> Neural Decision Logs
            </h3>
            <span className="text-[10px] text-slate-500 font-bold mono">SYSTEM_STABLE_V4.8</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-black/20">
                     <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target_Origin</th>
                     <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Incident_Vector</th>
                     <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">AI_Confidence</th>
                     <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Automated_Response</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {recentEvents.map((e, idx) => (
                     <tr key={idx} className="hover:bg-white/2 transition-colors group">
                        <td className="px-6 py-5">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-200 mono tracking-tighter">{e.log.ip}</span>
                              <span className="text-[10px] text-slate-500 uppercase font-medium">{e.log.country}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${e.log.attack_type === 'sql_injection' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'}`}>
                              {e.log.attack_type.toUpperCase().replace('_',' ')}
                           </span>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                 <div className={`h-full transition-all duration-1000 ${e.detection.confidence > 80 ? 'bg-pink-500' : 'bg-cyan-500'}`} style={{ width: `${e.detection.confidence}%` }} />
                              </div>
                              <span className="text-xs font-black text-slate-300 mono">{e.detection.confidence}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${e.response.action === 'block_ip' ? 'bg-pink-500 glow-pink' : 'bg-cyan-500'} pulse-soft`} />
                              {e.response.action.replace('_',' ')}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

const KPIBox = ({ label, value, sub, icon, color }) => {
  const colorMap = {
     cyan: 'from-cyan-500/10 to-transparent border-cyan-500/10',
     pink: 'from-pink-500/10 to-transparent border-pink-500/10',
     purple: 'from-purple-500/10 to-transparent border-purple-500/10',
     emerald: 'from-emerald-500/10 to-transparent border-emerald-500/10'
  };
  
  return (
    <div className={`premium-card bg-gradient-to-br ${colorMap[color]} relative group border-t-2 overflow-hidden`}>
      <div className="flex justify-between items-start mb-6">
         <div className="p-3 bg-black/20 rounded-2xl border border-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            {icon}
         </div>
         <div className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-black text-slate-500 tracking-widest">LIVE</div>
      </div>
      <div className="space-y-1">
         <div className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</div>
         <div className="text-4xl font-black text-white mono tracking-tighter">{value}</div>
         <div className="text-[10px] text-slate-500 font-medium">{sub}</div>
      </div>
      <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-125">
         {icon}
      </div>
    </div>
  );
};

const PieStat = ({ label, val, color }) => (
  <div className="flex flex-col items-center gap-1">
     <div className={`w-3 h-3 rounded-full ${color}`} />
     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
     <span className="text-xs font-bold text-white mono">{val}%</span>
  </div>
);

export default Dashboard;
