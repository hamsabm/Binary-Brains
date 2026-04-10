import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, Calendar, Clock, User, 
  Search, Shield, AlertCircle, Terminal, ClipboardList
} from 'lucide-react';
import axios from 'axios';

const AdminActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://127.0.0.1:8000/admin/activity', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setActivities(res.data);
      } catch (err) {
        console.error("Failed to fetch activity logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const filtered = activities.filter(a => 
    a.username.toLowerCase().includes(filter.toLowerCase()) ||
    a.action.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      {/* HEADER HUD */}
      <div className="flex justify-between items-center">
         <div className="space-y-1">
            <h1 className="text-4xl font-black text-white italic tracking-tighter">Operational Audit Log</h1>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em] flex items-center gap-2">
               <Shield size={12} className="text-cyan-500" /> Administrative Governance Protocol // NODE_01
            </p>
         </div>

         <div className="relative w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
            <input 
               type="text" 
               placeholder="Filter by Identity/Vector..." 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:border-cyan-500 transition-all outline-none"
            />
         </div>
      </div>

      {/* ACTIVITY TABLE */}
      <div className="premium-card p-0 overflow-hidden">
         <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <ClipboardList size={18} className="text-cyan-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Activity Stream</span>
            </div>
            <div className="text-[9px] font-bold text-slate-600">RETRIEVED: {activities.length} SESSIONS</div>
         </div>

         <div className="overflow-x-auto min-h-[500px]">
            {loading ? (
               <div className="flex items-center justify-center h-96">
                  <div className="w-10 h-10 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
               </div>
            ) : activities.length === 0 ? (
               <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-600 italic">
                  <AlertCircle size={40} />
                  <span>No operational telemetry recorded in this epoch.</span>
               </div>
            ) : (
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-black/40">
                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Operator Identity</th>
                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Action Vector</th>
                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Protocol Details</th>
                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     <AnimatePresence>
                     {filtered.map((log) => (
                        <motion.tr 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          key={log.id} 
                          className="hover:bg-white/[0.03] transition-colors group"
                        >
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className={`p-2 rounded-xl h-fit ${log.username === 'admin' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-pink-500/10 text-pink-500'}`}>
                                    <User size={18} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black text-white">{log.username.toUpperCase()}</span>
                                    <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">
                                       {log.username === 'admin' ? 'Superuser' : 'Analyst'}
                                    </span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${getActionColor(log.action)}`}>
                                 {log.action}
                              </span>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <Terminal size={14} className="text-slate-600" />
                                 <span className="text-xs font-bold text-slate-300 italic">"{log.details}"</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-2 text-white font-bold text-xs mono">
                                    <Calendar size={12} className="text-slate-700" />
                                    {new Date(log.timestamp).toLocaleDateString()}
                                 </div>
                                 <div className="flex items-center gap-2 text-slate-500 text-[10px] mono">
                                    <Clock size={12} className="text-slate-700" />
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                 </div>
                              </div>
                           </td>
                        </motion.tr>
                     ))}
                     </AnimatePresence>
                  </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
};

const getActionColor = (action) => {
   if (action === 'LOGIN') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
   if (action === 'SIM_START') return 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20';
   if (action === 'SIM_STOP') return 'bg-pink-500/10 text-pink-500 border border-pink-500/20';
   if (action === 'GAME_ACTION') return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
   return 'bg-slate-500/10 text-slate-500 border border-white/10';
}

export default AdminActivity;
