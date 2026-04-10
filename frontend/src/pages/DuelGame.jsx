import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, Swords, Zap, Timer, Activity, 
  Target, ShieldAlert, ShieldCheck, Flame, 
  Terminal, User, Trophy, Play, BookOpen, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DuelGame = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState('waiting');
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [scores, setScores] = useState({});
  const [currentAttack, setCurrentAttack] = useState(null);
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showLearning, setShowLearning] = useState(false);
  const ws = useRef(null);

  const playerId = localStorage.getItem('username') || `OP_${Math.floor(Math.random()*1000)}`;

  useEffect(() => {
    if (!roomId) return;
    const wsUrl = `ws://127.0.0.1:8000/ws/duel/${roomId}?player_id=${playerId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setConnected(true);
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch(msg.type) {
        case 'INIT':
          setRole(msg.role);
          setTimeRemaining(msg.config.timer);
          break;
        case 'PLAYER_JOIN':
          if (msg.player_id !== playerId) setRoomState('active');
          break;
        case 'TICK':
          setTimeRemaining(msg.data.time_remaining);
          setScores(msg.data.scores);
          if (roomState !== 'ended') setRoomState('active');
          break;
        case 'ATTACK_SYNC':
          setCurrentAttack(msg.data);
          setShowLearning(true); // Learning moments start here
          addLog(`ALERT: ${msg.data.attack.type} LAUNCHED`, 'warn');
          break;
        case 'ACTION_RESULT':
          setScores(msg.data.new_scores);
          setCurrentAttack(null);
          setShowLearning(false);
          showFeedback(msg.data.is_correct ? 'SUCCESS' : 'BREACH', msg.data.points);
          addLog(msg.data.is_correct ? `DEFENSE: Secured.` : `CRITICAL: Breached.`, msg.data.is_correct ? 'success' : 'error');
          break;
        case 'GAME_OVER':
          setRoomState('ended');
          break;
        default: break;
      }
    };
    return () => ws.current?.close();
  }, [roomId, playerId]);

  const addLog = (text, type) => {
    setLogs(prev => [{ text, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
  };

  const showFeedback = (type, pts) => {
    setFeedback({ type, pts });
    setTimeout(() => setFeedback(null), 2000);
  };

  const launchAttack = (type) => {
    if (ws.current && role === 'attacker') {
      ws.current.send(JSON.stringify({ type: 'LAUNCH_ATTACK', attack_type: type }));
    }
  };

  const submitDefense = (action) => {
    if (ws.current && role === 'defender' && currentAttack) {
      ws.current.send(JSON.stringify({ type: 'SUBMIT_DEFENSE', action: action, attack_id: currentAttack.log.log_id }));
    }
  };

  if (!roomId) return <div className="text-white p-20">NO ROOM_ID SPECIFIED</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020617] text-slate-300 font-mono relative">
      <div className="mesh-gradient opacity-20 pointer-events-none" />
      
      {/* TOP STATUS BAR */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
           <div 
             className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-3"
             onClick={() => navigate('/game/lobby')}
           >
              <Terminal size={16} className="text-cyan-400" />
              <span className="text-[10px] font-black tracking-widest uppercase">Abort Mission</span>
           </div>
           <div className="flex items-center gap-2">
              <Timer size={16} className="text-cyan-400" />
              <span className={`text-2xl font-black italic ${timeRemaining < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
           </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-12 scale-110">
            <PlayerScore name="BLUE TEAM" score={scores[Object.keys(scores).find(k => k === 'admin') || ''] || 0} color="text-cyan-400" align="right" />
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white/10 ${roomState === 'active' ? 'bg-cyan-500/10' : 'bg-black'}`}>
               <Swords className={roomState === 'active' ? 'text-white' : 'text-slate-700'} />
            </div>
            <PlayerScore name="RED TEAM" score={scores[Object.keys(scores).find(k => k !== 'admin') || ''] || 0} color="text-pink-500" align="left" />
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Sync</div>
              <div className="text-xs font-black text-cyan-400">ENCRYPTED_TLS</div>
           </div>
           <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-black" size={20} />
           </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: ATTACKER PANEL (RED) */}
        <div className={`flex-1 border-r border-white/5 relative flex flex-col p-10 transition-all duration-700 ${role === 'attacker' ? 'bg-pink-500/5' : 'bg-black/80 grayscale opacity-20 blur-[2px]'}`}>
           <div className="text-pink-500 font-black text-[10px] uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <Target size={12} animate-pulse /> Offensive Unit // Role: Breacher
           </div>
           <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-10">Cyber Armory</h3>

           <div className="grid grid-cols-2 gap-6 mb-10">
              <AttackBtn label="SQL Injection" type="SQL Injection" icon={<Activity />} onClick={launchAttack} active={role === 'attacker'} />
              <AttackBtn label="Brute Force" type="Brute Force" icon={<Zap />} onClick={launchAttack} active={role === 'attacker'} />
              <AttackBtn label="Port Scan" type="Port Scan" icon={<Target />} onClick={launchAttack} active={role === 'attacker'} />
              <AttackBtn label="DDoS Cloud" type="DDoS" icon={<Flame />} onClick={launchAttack} active={role === 'attacker'} />
           </div>

           <div className="flex-1 glass-panel p-6 overflow-hidden flex flex-col bg-black/40">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Signal Stream</div>
              <div className="space-y-3 overflow-y-auto">
                 {logs.map((L, i) => (
                    <div key={i} className="text-[11px] mono flex gap-3">
                       <span className="text-slate-600 font-bold">{L.time}</span> 
                       <span className={L.type === 'error' ? 'text-pink-500' : 'text-slate-400'}>{L.text}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT: DEFENDER PANEL (BLUE) */}
        <div className={`flex-1 relative flex flex-col p-10 transition-all duration-700 ${role === 'defender' ? 'bg-cyan-500/5' : 'bg-black/80 grayscale opacity-20 blur-[2px]'}`}>
           <div className="text-cyan-500 font-black text-[10px] uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <Shield size={12} /> Defensive Unit // Role: Guardian
           </div>
           <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-10">Neural Response</h3>

           <div className="flex-1 flex flex-col gap-8">
              <div className="premium-card p-1 relative min-h-[300px] overflow-hidden bg-black/60 border-cyan-500/10">
                 <AnimatePresence mode="wait">
                    {currentAttack ? (
                       <motion.div key={currentAttack.log.log_id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="p-10 h-full flex flex-col justify-between">
                          <div>
                             <div className="flex justify-between items-center mb-6">
                                <span className="bg-red-500 text-white font-black px-3 py-1 text-[10px] uppercase tracking-[0.2em] rounded">Threat Identified</span>
                                <span className="text-white font-black text-sm mono">{currentAttack.attack.ip}</span>
                             </div>
                             <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter">{currentAttack.attack.type}</h4>
                             <p className="text-slate-400 text-sm mt-4 leading-relaxed font-bold">Vector: {currentAttack.attack.payload}</p>
                          </div>
                          <div className="flex gap-4">
                             <ActionButton label="BLOCK_IP" onClick={() => submitDefense('BLOCK')} color="cyan" pulse />
                             <ActionButton label="RATE_LIMIT" onClick={() => submitDefense('RATE_LIMIT')} color="cyan" />
                             <ActionButton label="IGNORE" onClick={() => submitDefense('IGNORE')} color="slate" />
                          </div>
                       </motion.div>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center gap-6 p-12">
                          <Activity size={60} className="opacity-10 animate-pulse" />
                          <div className="space-y-2">
                             <p className="text-[10px] uppercase tracking-[0.5em] font-black">Scanning Node 0x7F22</p>
                             <p className="text-xs italic">Perimeter Integrity: 100%</p>
                          </div>
                       </div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="premium-glass p-8 rounded-[32px] border-white/5 bg-white/2 relative">
                 <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="text-yellow-500" size={16} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ARIA Academy Guidance</span>
                 </div>
                 <p className="text-[13px] text-slate-300 leading-relaxed italic font-bold">
                    {currentAttack ? currentAttack.detection.explanation : "Waiting for anomalies. Ensure your response protocols are primed for rapid execution."}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* LEARNING OVERLAY (INTELLIGENCE HUD) */}
      <AnimatePresence>
        {showLearning && currentAttack && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-8 pointer-events-none"
          >
             <div className="premium-card p-8 bg-[#0b1220]/95 backdrop-blur-3xl border-cyan-500/40 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden pointer-events-auto">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <BookOpen size={120} />
                </div>
                <div className="flex gap-8 items-start">
                   <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center text-cyan-400 border border-cyan-400/20 shrink-0">
                      <Target size={32} />
                   </div>
                   <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-2xl font-black text-white italic lowercase tracking-tight">learning_module::{currentAttack.learning.concept.toLowerCase()}</h4>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Press ESC to Dismiss (Auto on resolve)</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-bold">
                         {currentAttack.learning.description}
                      </p>
                      <div className="flex gap-4 pt-4 border-t border-white/5">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recommended Mitigation</span>
                            <span className="text-xs font-black text-emerald-400 italic uppercase underline decoration-emerald-500/30 underline-offset-4">{currentAttack.learning.mitigation}</span>
                         </div>
                         <div className="flex flex-col gap-1 ml-auto">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Factor</span>
                            <span className="text-xs font-black text-red-500 italic uppercase">CRITICAL_THREAT</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {roomState === 'waiting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl">
              <div className="w-24 h-24 border-8 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-10" />
              <h2 className="text-6xl font-black text-white italic tracking-tighter mb-4 skew-x-[-12deg]">Stabilizing Link...</h2>
              <p className="text-slate-500 uppercase tracking-[1em] text-[10px] font-black ml-4">Waiting for Neural Peer Connection</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] px-16 py-8 rounded-[40px] font-black text-6xl shadow-2xl skew-x-[-15deg] ${feedback.type === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
          >
             {feedback.type === 'SUCCESS' ? `+${feedback.pts} SECURED` : `NEURAL_BREACH`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlayerScore = ({ name, score, color, align }) => (
  <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">{name}</span>
    <span className={`text-4xl font-black mono italic tracking-tighter ${color}`}>{score.toLocaleString()}</span>
  </div>
);

const AttackBtn = ({ label, onClick, type, icon, active }) => (
  <button 
    onClick={() => onClick(type)}
    className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-4 text-left group overflow-hidden relative ${active ? 'bg-white/[0.03] border-white/5 hover:border-red-500/50 hover:bg-red-500/5' : 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'}`}
  >
     <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 w-fit group-hover:scale-110 transition-transform relative z-10">
        {icon}
     </div>
     <span className="text-xs font-black uppercase tracking-widest text-white relative z-10">{label}</span>
     <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
        {icon}
     </div>
  </button>
);

const ActionButton = ({ label, onClick, color, pulse }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-5 px-8 rounded-2xl font-black text-sm uppercase tracking-tighter transition-all active:scale-95 ${color === 'cyan' ? 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-white hover:bg-slate-700'} ${pulse ? 'animate-pulse' : ''}`}
  >
    {label}
  </button>
);

export default DuelGame;
