import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Zap, Activity, Sword, Globe, Shield, MessageSquare, Search, Play, Check, X, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Lobby = () => {
  const navigate = useNavigate();
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [inQueue, setInQueue] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const ws = useRef(null);

  const playerId = localStorage.getItem('username') || `ANON_${Math.floor(Math.random()*1000)}`;

  useEffect(() => {
    const wsUrl = `ws://127.0.0.1:8000/ws/lobby?player_id=${playerId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'LOBBY_STATE') {
        setOnlinePlayers(msg.users.filter(u => u.id !== playerId));
        setQueueCount(msg.queue_count);
      } else if (msg.type === 'INVITE_RECEIVED') {
        setIncomingInvite(msg);
      } else if (msg.type === 'MATCH_FOUND') {
        navigate(`/game/duel/${msg.room_id}`);
      }
    };

    return () => ws.current?.close();
  }, [playerId, navigate]);

  const sendInvite = (targetId) => {
    ws.current.send(JSON.stringify({ type: 'INVITE', to: targetId }));
  };

  const joinQueue = () => {
    setInQueue(true);
    ws.current.send(JSON.stringify({ type: 'JOIN_QUEUE' }));
  };

  const acceptInvite = () => {
    if (incomingInvite) {
      navigate(`/game/duel/${incomingInvite.room_id}`);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/game/duel/DUEL_${playerId}_EXTERNAL`;
    navigator.clipboard.writeText(link);
    alert("Tactical Invite Link Copied to Clipboard!");
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      
      {/* HEADER HUD */}
      <div className="flex justify-between items-center bg-black/40 p-10 rounded-[40px] border border-white/5 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30" />
         <div className="z-10">
            <h1 className="text-5xl font-black text-white italic tracking-tighter">Combat Lobby</h1>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.5em] mt-2 flex items-center gap-2">
               <Globe size={12} className="text-cyan-500" /> Neural Matchmaking Network // ACTIVE_NODES: {onlinePlayers.length + 1}
            </p>
         </div>

         <div className="flex gap-4 z-10">
            <button 
              onClick={copyInviteLink}
              className="premium-glass px-6 py-4 rounded-2xl border-white/5 flex items-center gap-3 text-white hover:bg-white/5 transition-all"
            >
               <LinkIcon size={18} className="text-cyan-400" />
               <span className="text-[10px] font-black uppercase tracking-widest">Generate Invite Link</span>
            </button>
            <button 
              onClick={joinQueue}
              disabled={inQueue}
              className={`px-10 py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center gap-3 shadow-xl ${inQueue ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}
            >
               {inQueue ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Searching...
                 </>
               ) : (
                 <>
                   <Play size={18} /> Find Match
                 </>
               )}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
         
         {/* PLAYER REGISTRY */}
         <div className="col-span-8 space-y-6">
            <div className="flex items-center gap-4 px-4">
               <Users size={20} className="text-cyan-500" />
               <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Available Combatants</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {onlinePlayers.length === 0 ? (
                 <div className="col-span-2 premium-card p-20 flex flex-col items-center justify-center text-slate-600 gap-4 border-dashed opacity-50">
                    <Search size={40} />
                    <span className="text-xs uppercase font-black tracking-widest">Scanning for adjacent neural signatures...</span>
                 </div>
               ) : onlinePlayers.map(player => (
                 <motion.div 
                   key={player.id} layout
                   initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                   className="premium-card p-6 flex items-center justify-between border-white/5 hover:border-cyan-500/30 group transition-all"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                          <User size={24} />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-white">{player.username.toUpperCase()}</span>
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${player.status === 'Available' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{player.status}</span>
                          </div>
                       </div>
                    </div>
                    
                    {player.status === 'Available' && (
                       <button 
                         onClick={() => sendInvite(player.id)}
                         className="p-3 bg-white/5 rounded-xl text-slate-400 hover:bg-cyan-500 hover:text-black transition-all group-hover:scale-105"
                       >
                          <Sword size={18} />
                       </button>
                    )}
                 </motion.div>
               ))}
            </div>
         </div>

         {/* SIDEBAR: STATS & RANKING */}
         <div className="col-span-4 space-y-8">
            <div className="premium-card p-8 border-cyan-500/20 bg-cyan-500/5 overflow-hidden relative">
               <div className="absolute -right-10 -bottom-10 opacity-5">
                  <Shield size={200} />
               </div>
               <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4">Tactical Status</h3>
               <div className="space-y-6 relative z-10">
                  <StatItem label="Active Queue" value={`${queueCount} Players`} icon={<Activity />} />
                  <StatItem label="Latency" value="24ms" icon={<Zap />} />
                  <StatItem label="Security Clear" value="Verified" icon={<Shield />} />
               </div>
            </div>

            <div className="premium-glass p-8 rounded-[32px] border-white/5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Engagement Rules</h3>
                <ul className="space-y-4">
                   <RuleItem text="Attacker launches vectors via HUD" />
                   <RuleItem text="Defender mitigates using logic/AI" />
                   <RuleItem text="Match ends after 120 seconds" />
                </ul>
            </div>
         </div>
      </div>

      {/* INVITE POPUP */}
      <AnimatePresence>
        {incomingInvite && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 right-10 z-[1000] w-96 premium-card p-8 border-cyan-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          >
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl">
                   <Sword size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white italic">Duel Request</h4>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{incomingInvite.from.toUpperCase()} IS CHALLENGING YOU</p>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={acceptInvite} className="flex-1 bg-cyan-500 text-black py-3 rounded-xl font-black text-xs uppercase hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                   <Check size={16} /> Accept Duel
                </button>
                <button onClick={() => setIncomingInvite(null)} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                   <X size={16} /> Decline
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatItem = ({ label, value, icon }) => (
  <div className="flex items-center justify-between">
     <div className="flex items-center gap-3">
        <div className="text-cyan-500/60">{icon}</div>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     </div>
     <span className="text-sm font-black text-white italic">{value}</span>
  </div>
);

const RuleItem = ({ text }) => (
  <li className="flex gap-4 items-start">
     <div className="w-1 h-1 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
     <span className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">{text}</span>
  </li>
);

export default Lobby;
