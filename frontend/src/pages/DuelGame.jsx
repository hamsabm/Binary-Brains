import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, Swords, Zap, Timer, Activity, 
  Target, ShieldAlert, ShieldCheck, Flame, 
  Terminal, User, Trophy, Play 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DuelGame = () => {
  const [role, setRole] = useState(null); // 'attacker' or 'defender'
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState('waiting'); // 'waiting', 'active', 'ended'
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [scores, setScores] = useState({});
  const [currentAttack, setCurrentAttack] = useState(null);
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const ws = useRef(null);

  const roomId = "WAR_DUEL_01"; // Generic for demo
  const playerId = localStorage.getItem('username') || `OP_${Math.floor(Math.random()*1000)}`;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://127.0.0.1:8000/ws/duel/${roomId}?player_id=${playerId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setConnected(true);
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("[DUEL] MSG:", msg);

      switch(msg.type) {
        case 'INIT':
          setRole(msg.role);
          setTimeRemaining(msg.config.timer);
          break;
        case 'PLAYER_JOIN':
          if (msg.player_id !== playerId) {
            setRoomState('active');
          }
          break;
        case 'TICK':
          setTimeRemaining(msg.data.time_remaining);
          setScores(msg.data.scores);
          if (roomState !== 'ended') setRoomState('active');
          break;
        case 'ATTACK_SYNC':
          setCurrentAttack(msg.data);
          addLog(`ALERT: ${msg.data.attack.type} LAUNCHED FROM INGRESS POINT`, 'warn');
          break;
        case 'ACTION_RESULT':
          const res = msg.data;
          setScores(res.new_scores);
          setCurrentAttack(null);
          showFeedback(res.is_correct ? 'SUCCESS' : 'BREACH', res.points);
          addLog(res.is_correct ? `DEFENSE: Block successful. Score secured.` : `CRITICAL: Perimeter breached. Attacker gaining ground.`, res.is_correct ? 'success' : 'error');
          break;
        case 'GAME_OVER':
          setRoomState('ended');
          break;
        default: break;
      }
    };

    return () => ws.current?.close();
  }, [playerId]);

  const addLog = (text, type) => {
    setLogs(prev => [{ text, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
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
      ws.current.send(JSON.stringify({ 
        type: 'SUBMIT_DEFENSE', 
        action: action, 
        attack_id: currentAttack.log.log_id 
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020617] text-slate-300 font-mono">
      
      {/* TOP STATUS BAR */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 glow-green' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-xs font-black tracking-widest uppercase">Room: {roomId}</span>
           </div>
           <div className="h-4 w-px bg-white/10" />
           <div className="flex items-center gap-2">
              <Timer size={14} className="text-cyan-400" />
              <span className={`text-xl font-black ${timeRemaining < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
           </div>
        </div>

        <div className="flex items-center gap-12">
            <PlayerScore name="ADMIN (Defender)" score={scores['admin'] || 0} color="text-cyan-400" align="right" />
            <div className="text-2xl font-black text-slate-700 italic">VS</div>
            <PlayerScore name="ANALYST (Attacker)" score={scores['analyst'] || 0} color="text-pink-500" align="left" />
        </div>
      </div>

      {/* MATCH START OVERLAY */}
      <AnimatePresence>
        {roomState === 'waiting' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl"
          >
             <Activity size={80} className="text-cyan-500 animate-pulse mb-8" />
             <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">Awaiting Combatant...</h2>
             <p className="text-slate-500 uppercase tracking-[0.5em] text-xs">Establishing Secure P2P Tactical Link</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: ATTACKER PANEL (RED) */}
        <div className={`flex-1 border-r border-white/5 relative flex flex-col p-8 transition-all duration-700 ${role === 'attacker' ? 'bg-pink-500/5' : 'bg-black/40 grayscale opacity-40 pointer-events-none'}`}>
           <div className="flex items-center gap-3 mb-12">
              <Swords className="text-pink-500" size={24} />
              <h3 className="text-2xl font-black text-white italic uppercase">Attacker Command</h3>
           </div>

           <div className="grid grid-cols-2 gap-6 mb-12">
              <AttackBtn label="SQL Injection" type="SQL Injection" icon={<Activity />} color="pink" onClick={launchAttack} />
              <AttackBtn label="Brute Force" type="Brute Force" icon={<Zap />} color="pink" onClick={launchAttack} />
              <AttackBtn label="Port Scan" type="Port Scan" icon={<Target />} color="pink" onClick={launchAttack} />
              <AttackBtn label="DDoS Cloud" type="DDoS" icon={<Flame />} color="pink" onClick={launchAttack} />
           </div>

           <div className="flex-1 glass-panel p-6 overflow-hidden flex flex-col">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Tactical Log</div>
              <div className="space-y-3 overflow-y-auto">
                 {logs.map((L, i) => (
                    <div key={i} className="text-[11px] mono border-l-2 border-white/5 pl-3 py-1">
                       <span className="text-slate-600">[{L.time}]</span> <span className={L.type === 'error' ? 'text-pink-500' : 'text-slate-400'}>{L.text}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT: DEFENDER PANEL (BLUE) */}
        <div className={`flex-1 relative flex flex-col p-8 transition-all duration-700 ${role === 'defender' ? 'bg-cyan-500/5' : 'bg-black/40 grayscale opacity-40 pointer-events-none'}`}>
           <div className="flex items-center gap-3 mb-12">
              <Shield className="text-cyan-500" size={24} />
              <h3 className="text-2xl font-black text-white italic uppercase">Defender Command</h3>
           </div>

           {/* ACTIVE THREAT CARD */}
           <div className="flex-1 flex flex-col gap-6">
              <div className="premium-card p-1 relative min-h-[220px] overflow-hidden">
                 <AnimatePresence mode="wait">
                    {currentAttack ? (
                       <motion.div 
                         key={currentAttack.log.log_id}
                         initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
                         className="p-8 h-full flex flex-col justify-between"
                       >
                          <div>
                             <div className="flex justify-between items-center mb-4">
                                <span className="bg-red-500 text-white font-black px-2 py-0.5 text-[9px] uppercase tracking-widest animate-pulse">Critical Incursion</span>
                                <span className="text-slate-500 text-[10px] mono">{currentAttack.attack.ip}</span>
                             </div>
                             <h4 className="text-3xl font-black text-white uppercase italic">{currentAttack.attack.type}</h4>
                             <p className="text-slate-400 text-xs mt-2 italic">Payload: {currentAttack.attack.payload}</p>
                          </div>

                          <div className="flex gap-4">
                             <ActionButton label="BLOCK_IP" onClick={() => submitDefense('BLOCK')} color="cyan" />
                             <ActionButton label="RATE_LIMIT" onClick={() => submitDefense('RATE_LIMIT')} color="cyan" />
                             <ActionButton label="IGNORE" onClick={() => submitDefense('IGNORE')} color="slate" />
                          </div>
                       </motion.div>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-8">
                          <Activity size={40} className="mb-4 opacity-20" />
                          <p className="text-xs uppercase tracking-widest font-black">Scanners Initialized... Perimeter at Baseline</p>
                       </div>
                    )}
                 </AnimatePresence>
              </div>

              {/* AI RECO WRAPPER */}
              <div className="premium-glass p-6 rounded-2xl border-white/5">
                 <div className="flex items-center gap-3 mb-3">
                    <Zap className="text-yellow-500 animate-pulse" size={14} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ARIA Recon_Module</span>
                 </div>
                 <p className="text-xs text-slate-300 leading-relaxed italic">
                    {currentAttack ? currentAttack.detection.explanation : "Monitoring encrypted traffic patterns for behavioral anomalies."}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* FEEDBACK OVERLAY */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] px-12 py-6 rounded-3xl font-black text-4xl shadow-2xl skew-x-[-12deg] ${feedback.type === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
          >
             {feedback.type === 'SUCCESS' ? `+${feedback.pts} SECURED` : `BREACH DETECTED`}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// MINI COMPONENTS
const PlayerScore = ({ name, score, color, align }) => (
  <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{name}</span>
    <span className={`text-2xl font-black mono italic ${color}`}>{score.toLocaleString()}</span>
  </div>
);

const AttackBtn = ({ label, icon, onClick, type }) => (
  <button 
    onClick={() => onClick(type)}
    className="premium-glass p-6 rounded-2xl border-white/5 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all group flex flex-col gap-4 text-left"
  >
     <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500 w-fit group-hover:scale-110 transition-transform">
        {icon}
     </div>
     <span className="text-xs font-black uppercase tracking-widest text-white">{label}</span>
  </button>
);

const ActionButton = ({ label, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-tighter transition-all active:scale-95 ${color === 'cyan' ? 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,234,255,0.4)]' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
  >
    {label}
  </button>
);

export default DuelGame;
