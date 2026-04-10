import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getStats, getFullCycle, getPrediction, getGameStats } from '../api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  ShieldCheck, ShieldAlert, Cpu, Activity, 
  Map as MapIcon, Lock, ChevronUp, ChevronDown, 
  Zap, Globe, Target, AlertTriangle, Swords, Shield as ShieldIcon,
  Crosshair, Radio, Brain, Gauge, Play, Terminal, HelpCircle, Trophy, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({ total_events: 0, threats_detected: 0, ips_blocked: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [prediction, setPrediction] = useState({ type: "Predicting...", probability: 0 });
  const [gameStats, setGameStats] = useState({ score: 1000, badges: [] });
  const [activeReplay, setActiveReplay] = useState(null);
  const [showExplanation, setShowExplanation] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const statsRes = await getStats();
      setStats(statsRes.data);
      
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString().slice(3, 8), val: statsRes.data.total_events }].slice(-15);
        return newData;
      });

      const cycleRes = await getFullCycle();
      setRecentEvents(prev => [cycleRes.data, ...prev].slice(0, 10));

      const predRes = await getPrediction();
      setPrediction(predRes.data);

      const gameRes = await getGameStats();
      setGameStats(gameRes.data);
    } catch (err) {
      console.warn("Sync failed", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const threatRatio = useMemo(() => 
    Math.round((stats.threats_detected / Math.max(stats.total_events, 1)) * 100), 
    [stats]
  );

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in zoom-in duration-700 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
         <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
               WarRoomX <span className="vibrant-gradient-text glow-text">Command Center</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
               <Radio size={12} className="text-cyan-400 animate-pulse" /> Advanced Predictive Intelligence // Neural_Active
            </p>
         </div>

         <div className="flex gap-6 items-center">
            {/* GAMIFIED SCORE HUB */}
            <div className="premium-glass px-6 py-4 rounded-3xl border-white/5 flex flex-col items-end gap-1 shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:scale-105 transition-transform">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defense Score</span>
                  <Trophy size={16} className="text-yellow-500 glow-yellow" />
               </div>
               <div className="text-2xl font-black text-white mono tracking-tighter">{gameStats.score} <span className="text-emerald-500 text-sm">XP</span></div>
               <div className="flex gap-1 mt-1">
                  {gameStats.badges.map(b => (
                    <div key={b} className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-[8px] font-black text-yellow-500 rounded uppercase">
                       {b}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8 stagger-in">
         
         {/* LEFT COLUMN: ADVANCED OFFENSIVE INTEL */}
         <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                     <Swords className="text-pink-500" size={18} />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">Offensive Engine</h2>
               </div>
               {/* PREDICTIVE INDICATOR */}
               <div className="px-4 py-2 premium-glass rounded-xl border-pink-500/20 flex items-center gap-3 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  <Brain className="text-pink-500" size={16} />
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Predictive Threat</span>
                     <span className="text-[10px] font-bold text-white uppercase">
                        {prediction.type} <span className="text-pink-500 ml-1">{prediction.probability}% Prob</span>
                     </span>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <EngineKPI label="Ingress Traffic" value={stats.total_events} sub="Total Attack Vectors" color="pink" icon={<Activity />} className="glow-border-pink" />
               <EngineKPI label="Attacker Profile" value={recentEvents[0]?.detection.profile.type || "Scanning..."} sub="Latest Signature" color="pink" icon={<UserCheck />} className="glow-border-pink" />
            </div>

            <div className="premium-card p-6 flex-1 min-h-[300px]">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Ingress Waveform</span>
                  <div className="flex items-center gap-2 text-[9px] text-pink-500 font-bold">
                     AI ANALYSIS ACTIVE <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
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

         {/* RIGHT COLUMN: ADVANCED DEFENSE & RISK */}
         <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                     <ShieldIcon className="text-cyan-500" size={18} />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">Defense Engine</h2>
               </div>

               {/* RISK METER BADGE */}
               {recentEvents[0] && (
                 <div className={`px-4 py-2 premium-glass rounded-xl border-${recentEvents[0].detection.risk.color}-500/20 flex items-center gap-3 shadow-[0_0_15px_rgba(34,211,238,0.1)]`}>
                    <Gauge className={`text-${recentEvents[0].detection.risk.color}-500`} size={16} />
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">System Risk</span>
                       <span className={`text-[10px] font-bold text-${recentEvents[0].detection.risk.color}-500 text-white uppercase tracking-tighter`}>
                          LVL {recentEvents[0].detection.risk.score} // {recentEvents[0].detection.risk.label}
                       </span>
                    </div>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-6">
               <EngineKPI label="Threats Blocked" value={stats.threats_detected} sub="Neutralized Risks" color="cyan" icon={<ShieldAlert />} className="glow-border-cyan" />
               <EngineKPI label="Mitigation Index" value={`${threatRatio}%`} sub="Response Efficiency" color="cyan" icon={<Cpu />} className="glow-border-cyan" />
            </div>

            <div className="premium-card p-6 flex-1 min-h-[300px] flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Threat Risk Distribution</span>
                  <span className="text-[9px] text-cyan-500 font-bold">SMART PRIORITIZATION</span>
               </div>
               <div className="flex-1 flex items-center justify-center gap-8">
                  <div className="w-40 h-40 relative flex items-center justify-center">
                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-2xl font-black text-white mono">{recentEvents[0]?.detection.risk.score || 0}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Risk</span>
                     </div>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie 
                              data={[{v:recentEvents[0]?.detection.risk.score || 0},{v:100 - (recentEvents[0]?.detection.risk.score || 0)}]} 
                              innerRadius={50} outerRadius={65} paddingAngle={0} dataKey="v" stroke="none"
                              cx="50%" cy="50%" startAngle={180} endAngle={0}
                           >
                              <Cell fill={recentEvents[0]?.detection.risk.label === 'DANGEROUS' ? '#ff3366' : '#22d3ee'} />
                              <Cell fill="#1e293b" />
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                     <LegendItem label="Danger Threshold" val="75+" color="bg-pink-500" />
                     <LegendItem label="Moderate Warning" val="40-75" color="bg-yellow-500" />
                     <LegendItem label="Security Baseline" val="0-40" color="bg-emerald-500" />
                  </div>
               </div>
            </div>
         </div>

         {/* BOTTOM FULL WIDTH: INTELLIGENT LOGS & REPLAY */}
         <div className="col-span-12 flex flex-col gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Globe className="text-purple-500" size={18} />
               </div>
               <h2 className="text-xl font-black text-white uppercase tracking-widest">Advanced Tactical Ledger</h2>
            </div>

            <div className="premium-card p-0 overflow-hidden">
               <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                     <AlertTriangle size={14} className="text-pink-500" /> Multi-Layer Intelligence Analysis
                  </h3>
                  <div className="text-[10px] font-bold text-slate-500 tracking-widest">NODE_07 LIVE STREAM</div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-black/40">
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Identity / Profle</th>
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Threat Vector</th>
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Risk Analytics</th>
                           <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        <AnimatePresence>
                        {recentEvents.map((e, idx) => (
                           <motion.tr 
                             initial={{ x: -20, opacity: 0 }}
                             animate={{ x: 0, opacity: 1 }}
                             key={e.log.log_id} 
                             className="hover:bg-white/[0.03] transition-colors group relative"
                           >
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                       <span className="text-sm font-bold text-white mono">{e.log.ip}</span>
                                       <div className="flex items-center gap-2">
                                          <span className="text-[9px] text-pink-500 font-black uppercase tracking-tighter">{e.detection.profile.type}</span>
                                          <div className="w-1 h-1 rounded-full bg-slate-700" />
                                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{e.log.country}</span>
                                       </div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                       <span className={`px-3 py-0.5 rounded-lg text-[9px] font-black tracking-widest ${e.detection.priority === 'CRITICAL' ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30 shadow-[0_0_10px_rgba(255,51,102,0.15)]' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'}`}>
                                          {e.log.attack_type.toUpperCase()}
                                       </span>
                                       {e.detection.threat && (
                                         <button 
                                           onClick={() => setShowExplanation(e)}
                                           className="p-1 hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-white"
                                         >
                                            <HelpCircle size={14} />
                                         </button>
                                       )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">{e.log.event}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="h-1.5 w-24 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                       <div className={`h-full transition-all duration-1000 ${e.detection.risk.color === 'pink' ? 'bg-pink-500 shadow-[0_0_8px_#ff3366]' : 'bg-cyan-500'}`} style={{ width: `${e.detection.risk.score}%` }} />
                                    </div>
                                    <span className={`text-[10px] font-black mono text-${e.detection.risk.color}-500/80`}>{e.detection.risk.score}% RISK</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 min-w-[100px]">
                                       <div className={`w-1.5 h-1.5 rounded-full ${e.response.action === 'block_ip' ? 'bg-pink-500 glow-pink' : 'bg-cyan-500 glow-blue'} animate-pulse`} />
                                       <span className="text-[10px] font-black text-white uppercase italic tracking-widest">{e.response.action.replace('_',' ')}</span>
                                    </div>
                                    <button 
                                      onClick={() => setActiveReplay(e)}
                                      className="p-2 premium-glass border-white/5 rounded-lg hover:border-cyan-500/40 text-cyan-400 transition-all hover:scale-110 active:scale-95 group"
                                      title="Replay Attack Pulse"
                                    >
                                       <Play size={14} fill="currentColor" className="group-hover:text-cyan-300" />
                                    </button>
                                 </div>
                              </td>
                           </motion.tr>
                        ))}
                        </AnimatePresence>
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>

      {/* EXPLAINABLE AI POPUP */}
      <AnimatePresence>
        {showExplanation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setShowExplanation(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-lg premium-card p-1 overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500" />
                <div className="p-8 space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Explainable AI Insight</h3>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-widest">
                            <Brain size={12} className="text-cyan-400" /> ARIA INTEL NODE // ANALYSIS_SUCCESS
                         </div>
                      </div>
                      <button onClick={() => setShowExplanation(null)} className="text-slate-500 hover:text-white transition-colors">
                         <ChevronDown size={24} />
                      </button>
                   </div>

                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Tactical Diagnostic:</div>
                      <p className="text-slate-200 font-bold leading-relaxed italic text-sm">
                         "{showExplanation.detection.explanation}"
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                         <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Confidence Index</div>
                         <div className="text-xl font-black text-white mono">{showExplanation.detection.confidence}%</div>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                         <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Priority Level</div>
                         <div className={`text-xl font-black ${showExplanation.detection.priority === 'CRITICAL' ? 'text-pink-500' : 'text-cyan-400'} mono italic`}>
                            {showExplanation.detection.priority}
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ATTACK REPLAY TERMINAL */}
      <AnimatePresence>
        {activeReplay && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setActiveReplay(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="relative w-full max-w-2xl bg-[#0a0a0c] border border-cyan-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.2)]"
              >
                 <div className="bg-slate-900/50 p-4 border-b border-white/10 flex justify-between items-center bg-scanlines">
                    <div className="flex items-center gap-3">
                       <Terminal size={14} className="text-cyan-400" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Tactical Attack Replay // SIG_ID: {activeReplay.log.log_id.slice(0,8)}</span>
                    </div>
                    <button onClick={() => setActiveReplay(null)} className="text-slate-500 hover:text-white"><Activity size={18}/></button>
                 </div>
                 <div className="p-8 h-96 overflow-y-auto font-mono text-sm space-y-4">
                    <ReplayLine text={`[T-0s] Ingress detected from ${activeReplay.log.ip} (${activeReplay.log.country})`} delay={0} />
                    <ReplayLine text={`[T-1.2s] Packet inspection initiated... Analyzing payload entropy`} delay={1.2} />
                    <ReplayLine text={`[T-2.1s] VIOLATION: Non-standard query pattern detected: "${activeReplay.log.event.slice(0, 40)}..."`} delay={2.1} color="text-pink-500" />
                    <ReplayLine text={`[T-2.8s] HEURISTICS: Confidence ${activeReplay.detection.confidence}% Match for ${activeReplay.log.attack_type}`} delay={2.8} />
                    <ReplayLine text={`[T-3.5s] DEFENSE_TRIGGER: Executing autonomous mitigation [${activeReplay.response.action}]`} delay={3.5} color="text-cyan-400 font-bold" />
                    <ReplayLine text={`[T-4.0s] INTELLIGENCE: Profile updated to "${activeReplay.detection.profile.type}". Threat Neutralized.`} delay={4.0} color="text-emerald-400" />
                    <div className="pt-8 flex justify-center">
                       <motion.div 
                         initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 4.5 }}
                         className="px-6 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-black rounded-full text-xs uppercase"
                       >
                          Mission Success: +20 Defense Score
                       </motion.div>
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReplayLine = ({ text, delay, color = "text-slate-300" }) => (
  <motion.div 
    initial={{ x: -10, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay }}
    className={`flex gap-4 ${color}`}
  >
     <span className="opacity-30 tracking-widest">>>></span>
     <span>{text}</span>
  </motion.div>
)

const EngineKPI = ({ label, value, sub, icon, color, className = "" }) => {
   const variants = {
      pink: 'border-pink-500/20 from-pink-500/5 to-transparent text-pink-500',
      cyan: 'border-cyan-500/20 from-cyan-500/5 to-transparent text-cyan-500'
   };

   return (
      <div className={`premium-card p-6 bg-gradient-to-br ${variants[color]} flex flex-col gap-4 group transition-all duration-500 hover:-translate-y-1 ${className}`}>
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
