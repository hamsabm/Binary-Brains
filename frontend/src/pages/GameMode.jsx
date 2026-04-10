import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ShieldAlert, Zap, Trophy, Timer, Swords, Brain, 
  Terminal, Activity, ChevronRight, AlertTriangle, Radio,
  Lock, RefreshCcw, Gauge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GameMode = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('IDLE'); // IDLE, DEFENSE, CHALLENGE
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(60);
  const [currentAttack, setCurrentAttack] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [floatingPoints, setFloatingPoints] = useState([]);
  const [isWrong, setIsWrong] = useState(false);
  
  const timerRef = useRef(null);
  const wsRef = useRef(null);

  const levelInfo = (s) => {
    if (s < 500) return { name: "Beginner Analyst", color: "text-slate-400" };
    if (s < 1500) return { name: "SOC Operator", color: "text-cyan-400" };
    if (s < 3000) return { name: "Threat Hunter", color: "text-pink-400" };
    return { name: "Cyber Commander", color: "text-yellow-400" };
  };

  const addPoints = (pts, isFast) => {
    const finalPts = isFast ? pts + 5 : pts;
    setScore(prev => prev + finalPts);
    setFloatingPoints(prev => [...prev, { id: Date.now(), val: `+${finalPts}${isFast ? ' (FAST!)' : ''}` }]);
    setTimeout(() => {
      setFloatingPoints(prev => prev.slice(1));
    }, 1000);
  };

  const handleAction = (action) => {
    if (!currentAttack || feedback) return;
    
    const correct = currentAttack.detection.recommended_action === action;
    const timeTaken = Date.now() - currentAttack.startTime;
    const isFast = timeTaken < 2000;

    if (correct) {
      setStreak(prev => prev + 1);
      addPoints(10, isFast);
      setFeedback({ 
        msg: `CRITICAL SUCCESS: ${action} was the optimal response protocols.`, 
        type: 'SUCCESS' 
      });
    } else {
      setStreak(0);
      setScore(prev => Math.max(0, prev - 5));
      setIsWrong(true);
      setFloatingPoints(prev => [...prev, { id: Date.now(), val: "-5", color: "text-red-500" }]);
      setFeedback({ 
        msg: `FAILURE: Incorrect action. ARIA recommended ${currentAttack.detection.recommended_action}.`, 
        type: 'ERROR' 
      });
      setTimeout(() => {
        setIsWrong(false);
        setFloatingPoints(prev => prev.slice(1));
      }, 1000);
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentAttack(null);
    }, 2500);
  };

  const startDefense = () => {
    setGameState('DEFENSE');
    setScore(0);
    setStreak(0);
    connectWS();
  };

  const startChallenge = () => {
    setGameState('CHALLENGE');
    setScore(0);
    setStreak(0);
    setTimer(60);
    connectWS();
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameState('IDLE');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const connectWS = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const host = window.location.hostname || "127.0.0.1";
    const ws = new WebSocket(`ws://${host}:8000/ws/live?token=${encodeURIComponent(token)}`);
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (gameState !== 'IDLE' && !currentAttack) {
        setCurrentAttack({ ...payload, startTime: Date.now() });
      }
    };
    wsRef.current = ws;
  }, [gameState, currentAttack]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col transition-colors duration-300 ${isWrong ? 'bg-red-900/10' : 'bg-black'}`}>
      
      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-scanlines z-50 transition-opacity" />

      {/* GAME HUD - TOP */}
      <div className="p-8 flex justify-between items-start z-10">
        <div className="flex gap-8">
           <div className="premium-glass p-6 rounded-3xl border-white/5 flex flex-col min-w-[200px] shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score Vector</span>
                 <Trophy size={14} className="text-yellow-500" />
              </div>
              <div className="text-4xl font-black text-white mono tracking-tighter">{score}</div>
              <div className={`text-[10px] font-black mt-2 uppercase tracking-widest ${levelInfo(score).color}`}>
                 RANK: {levelInfo(score).name}
              </div>
           </div>

           <div className="premium-glass p-6 rounded-3xl border-white/5 flex flex-col min-w-[120px]">
              <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Streak</span>
                 <Zap size={14} className="text-cyan-500" />
              </div>
              <div className="text-4xl font-black text-cyan-500 mono tracking-tighter">x{streak}</div>
              {streak >= 3 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[8px] font-black text-cyan-400 mt-2 uppercase tracking-[0.3em] animate-pulse">
                   MULTIPLIER ACTIVE
                </motion.div>
              )}
           </div>
        </div>

        {gameState === 'CHALLENGE' && (
          <div className={`premium-glass p-6 rounded-3xl border-red-500/20 flex flex-col min-w-[120px] items-center ${timer < 10 ? 'animate-pulse ring-2 ring-red-500/50' : ''}`}>
             <div className="flex justify-between items-center w-full mb-1">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Time</span>
                <Timer size={14} className="text-red-500" />
             </div>
             <div className="text-4xl font-black text-red-500 mono tracking-tighter">00:{timer < 10 ? `0${timer}` : timer}</div>
          </div>
        )}

        <button 
           onClick={() => navigate('/dashboard')}
           className="px-6 py-4 premium-glass border-white/5 rounded-2xl text-[10px] font-black text-white tracking-widest uppercase hover:bg-white/10"
        >
           Abort Mission
        </button>
      </div>

      {/* CENTER DISPLAY: THE THREAT WAVE */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
           {gameState === 'IDLE' ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
               className="max-w-xl text-center space-y-8"
             >
                <div className="space-y-2">
                   <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter">Combat Deck</h1>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.5em]">Sector_01 Deployment Pending</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <GameSelectionCard 
                      title="Defense Mode" 
                      sub="Sustained tactical defense. Accuracy is key." 
                      onClick={startDefense}
                      icon={<Shield className="text-cyan-500" />}
                   />
                   <GameSelectionCard 
                      title="Challenge" 
                      sub="60-second rapid intercept phase." 
                      onClick={startChallenge}
                      icon={<Zap className="text-pink-500" />}
                   />
                </div>
             </motion.div>
           ) : !currentAttack ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Scanning Neural Egress...</span>
             </motion.div>
           ) : (
             <ThreatWave card={currentAttack} feedback={feedback} />
           )}
        </AnimatePresence>
      </div>

      {/* FLOATING POINTS */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 z-40 pointer-events-none">
         <AnimatePresence>
            {floatingPoints.map(p => (
               <motion.div 
                  key={p.id}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -100, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-6xl font-black mono italic ${p.color || 'text-cyan-400'} glow-text`}
               >
                  {p.val}
               </motion.div>
            ))}
         </AnimatePresence>
      </div>

      {/* ACTION HUB - BOTTOM RIGHT */}
      <AnimatePresence>
         {currentAttack && !feedback && (
           <motion.div 
             initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
             className="absolute right-12 bottom-12 p-1 premium-card bg-[#0a0a0c] min-w-[350px]"
           >
              <div className="bg-white/2 p-6 space-y-6">
                 <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decision Protocol</span>
                    <Radio size={12} className="text-cyan-500 animate-pulse" />
                 </div>
                 
                 <div className="flex flex-col gap-4">
                    <ActionButton label="BLOCK_IP" icon={<Lock size={16}/>} sub="Full perimeter blackhole" color="pink" onClick={() => handleAction('BLOCK')} />
                    <ActionButton label="RATE_LIMIT" icon={<RefreshCcw size={16}/>} sub="Throttle throughput - 5pk/s" color="cyan" onClick={() => handleAction('RATE_LIMIT')} />
                    <ActionButton label="IGNORE" icon={<Terminal size={16}/>} sub="Mark as false positive" color="slate" onClick={() => handleAction('IGNORE')} />
                 </div>

                 {/* ARIA RECOMMENDATION */}
                 <div className="pt-4 mt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                       <Brain size={18} className="text-cyan-400" />
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-500 uppercase italic">ARIA Recommendation</span>
                          <span className="text-xs font-bold text-white uppercase italic tracking-tight italic">"Heuristics suggest: {currentAttack.detection.recommended_action}"</span>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* ARIA FEEDBACK HUD - BOTTOM LEFT */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
             initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
             className="absolute left-12 bottom-12 max-w-lg"
          >
             <div className={`premium-card p-1 ${feedback.type === 'SUCCESS' ? 'bg-cyan-900/40 border-cyan-500/50' : 'bg-red-900/40 border-red-500/50'}`}>
                <div className="bg-black/80 p-6 flex gap-6">
                   <div className={`p-4 rounded-2xl ${feedback.type === 'SUCCESS' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-red-500/10 text-red-500'} h-fit`}>
                      <Brain size={24} />
                   </div>
                   <div className="space-y-1">
                      <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${feedback.type === 'SUCCESS' ? 'text-cyan-500' : 'text-red-500'}`}>
                         Tactical Analysis // ARIA_COMMS
                      </span>
                      <p className="text-white font-bold leading-relaxed italic">{feedback.msg}</p>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ThreatWave = ({ card, feedback }) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
    className={`relative w-full max-w-4xl premium-card p-1 shadow-2xl transition-all duration-500 ${feedback?.type === 'SUCCESS' ? 'scale-90 opacity-50' : ''}`}
  >
     <div className="bg-[#0a0a0c] p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8">
           <AlertTriangle className="text-pink-500/20" size={120} />
        </div>
        
        <div className="flex flex-col gap-8 relative z-10">
           <div className="flex justify-between items-start">
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-500 text-[11px] font-black tracking-widest uppercase rounded-xl">
                       ACTIVE THREAT WAVE
                    </span>
                    <span className="text-[11px] font-black text-slate-500 mono tracking-widest uppercase">ID: {card.log.log_id.slice(0,12)}</span>
                 </div>
                 <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">{card.log.attack_type.replace('_',' ')}</h2>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
              <DataBlock label="Source IP" val={card.log.ip} color="text-white" />
              <DataBlock label="Origin" val={card.log.country} color="text-white" />
              <DataBlock label="Risk Score" val={`${card.detection.risk.score}%`} color="text-pink-500" />
           </div>

           <div className="p-6 bg-white/2 rounded-2xl border border-white/5 font-mono text-sm text-slate-400 italic">
              <span className="text-cyan-500">>>></span> {card.log.event}
           </div>
        </div>
     </div>
  </motion.div>
);

const ActionButton = ({ label, icon, sub, color, onClick }) => {
  const themes = {
     pink: "border-pink-500/20 hover:border-pink-500 bg-pink-500/5 text-pink-500",
     cyan: "border-cyan-500/20 hover:border-cyan-500 bg-cyan-500/5 text-cyan-500",
     slate: "border-slate-800 hover:border-white bg-slate-900/40 text-slate-400 hover:text-white"
  }
  return (
    <button 
       onClick={onClick}
       className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 group ${themes[color]}`}
    >
       <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
       <div className="flex flex-col items-start">
          <span className="text-xs font-black tracking-widest uppercase">{label}</span>
          <span className="text-[10px] opacity-60 font-bold uppercase">{sub}</span>
       </div>
       <ChevronRight size={16} className="ml-auto opacity-20 group-hover:opacity-100" />
    </button>
  );
};

const GameSelectionCard = ({ title, sub, icon, onClick }) => (
  <button 
     onClick={onClick}
     className="p-8 premium-card hover:scale-105 transition-all text-left flex flex-col gap-4 group"
  >
     <div className="p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-125 transition-transform">{React.cloneElement(icon, { size: 32 })}</div>
     <div className="space-y-1">
        <h3 className="text-2xl font-black text-white uppercase italic">{title}</h3>
        <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed">{sub}</p>
     </div>
  </button>
);

const DataBlock = ({ label, val, color }) => (
  <div className="flex flex-col">
     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</span>
     <span className={`text-xl font-black mono ${color}`}>{val}</span>
  </div>
);

export default GameMode;
