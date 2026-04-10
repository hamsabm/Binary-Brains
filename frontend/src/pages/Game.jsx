import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Trophy, Timer, Brain, Swords, Activity,
  Lock, RefreshCcw, Terminal, AlertTriangle, Radio, Volume2, VolumeX,
  Target, Cpu, ChevronRight, Gauge, BarChart, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- SOUND EFFECTS (Cinematic placeholders) ---
const sounds = {
  ping: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
  success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
  error: new Audio('https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3'),
  boss: new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
};

const Game = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('HUMAN_VS_AI'); // HUMAN_VS_AI, SINGLE, MULTIPLAYER
  const [gameState, setGameState] = useState('IDLE'); // IDLE, ACTIVE, BOSS_WAVE
  const [mute, setMute] = useState(false);
  
  // Player Stats
  const [stats, setStats] = useState({
    score: 0, level: 'Beginner', streak: 0, combo: 1, accuracy: 100, attempts: 0, correct: 0
  });

  // AI Parallel Stats
  const [aiStats, setAiStats] = useState({
    score: 0, accuracy: 100, correct: 0
  });

  const [currentAttack, setCurrentAttack] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isBossWave, setIsBossWave] = useState(false);
  const [shake, setShake] = useState(false);
  
  const wsRef = useRef(null);

  const playSound = (name) => {
    if (mute) return;
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  };

  const calculateLevel = (score) => {
    if (score < 500) return "Beginner Analyst";
    if (score < 1500) return "SOC Operator";
    if (score < 3000) return "Threat Hunter";
    return "Cyber Commander";
  };

  const handleAction = async (action) => {
    if (!currentAttack || feedback) return;
    
    const correctAction = currentAttack.detection.recommended_action;
    const isCorrect = action === correctAction;
    const timeTaken = Date.now() - currentAttack.startTime;

    // 1. Process Player Stats
    setStats(prev => {
      let pts = isCorrect ? 10 * prev.combo : -5;
      if (isCorrect && timeTaken < 2000) pts += 5;

      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newCombo = Math.floor(newStreak / 3) + 1;
      const newCorrect = isCorrect ? prev.correct + 1 : prev.correct;
      const newAttempts = prev.attempts + 1;
      
      return {
        ...prev,
        score: Math.max(0, prev.score + pts),
        streak: newStreak,
        combo: newCombo,
        correct: newCorrect,
        attempts: newAttempts,
        accuracy: Math.round((newCorrect / newAttempts) * 100),
        level: calculateLevel(prev.score + pts)
      };
    });

    // 2. Process AI Parallel (AI always gets it right)
    if (mode === 'HUMAN_VS_AI') {
      setAiStats(prev => {
        const newCorrect = prev.correct + 1;
        const newScore = prev.score + 10;
        return { score: newScore, correct: newCorrect, accuracy: 100 };
      });
    }

    if (isCorrect) {
      playSound('success');
      setFeedback({ type: 'SUCCESS', msg: `OPTIMAL PROTOCOL: ${action} logic executed.` });
    } else {
      playSound('error');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setFeedback({ type: 'ERROR', msg: `CRITICAL FAILURE: ${correctAction} was required.` });
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentAttack(null);
    }, 2000);
  };

  const connectWS = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const host = "127.0.0.1";
    const roomId = "default_room";
    const ws = new WebSocket(`ws://${host}:8000/ws/game/${roomId}?player_id=player1`);
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'ATTACK') {
        playSound('ping');
        setCurrentAttack({ ...payload.data, startTime: Date.now() });
      } else if (payload.type === 'BOSS_WAVE_START') {
        playSound('boss');
        setIsBossWave(true);
        setShake(true);
        setTimeout(() => setShake(false), 2000);
      } else if (payload.type === 'BOSS_WAVE_END') {
        setIsBossWave(false);
      }
    };
    wsRef.current = ws;
  }, []);

  const startGame = () => {
    setGameState('ACTIVE');
    connectWS();
  };

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  return (
    <motion.div 
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      className={`min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans`}
    >
      {/* SCANLINES & GRID */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none" />

      {/* TOP HUD */}
      <header className="p-8 flex justify-between items-start z-20">
        <div className="flex gap-8 items-center">
            <div className="premium-glass p-6 rounded-3xl border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Defense Rank</span>
                   <Trophy size={14} className="text-yellow-500" />
                </div>
                <div className="text-4xl font-black text-white mono tracking-tighter">{stats.score}</div>
                <div className="text-[10px] font-black mt-1 text-cyan-400 uppercase tracking-widest">{stats.level}</div>
            </div>

            <div className="premium-glass p-6 rounded-3xl border-white/5 min-w-[120px]">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Combo</span>
                   <Zap size={14} className="text-pink-500" />
                </div>
                <div className="text-4xl font-black text-pink-500 mono tracking-tighter">x{stats.combo}</div>
                <div className="text-[10px] font-black mt-1 text-slate-500 uppercase tracking-widest">Streak: {stats.streak}</div>
            </div>

            <div className="premium-glass p-6 rounded-3xl border-white/5">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</span>
                   <Target size={14} className="text-emerald-500" />
                </div>
                <div className="text-4xl font-black text-white mono tracking-tighter">{stats.accuracy}%</div>
            </div>
        </div>

        <div className="flex gap-4">
           <button onClick={() => setMute(!mute)} className="p-4 premium-glass border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
              {mute ? <VolumeX className="text-slate-500" /> : <Volume2 className="text-cyan-400" />}
           </button>
           <button onClick={() => navigate('/dashboard')} className="px-8 py-4 premium-glass border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10">
              Abort Op
           </button>
        </div>
      </header>

      {/* CORE BATTLEFIELD */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 z-20">
         <AnimatePresence mode="wait">
            {gameState === 'IDLE' ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl text-center space-y-12">
                 <div className="space-y-4">
                    <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase underline decoration-cyan-500/50 underline-offset-8">Engagement Deck</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.5em]">Sector_04 Tactical Grid // Standing By</p>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <ModeCard 
                       title="Human vs AI" sub="Compete against ARIA parallel logic"
                       active={mode === 'HUMAN_VS_AI'} onClick={() => setMode('HUMAN_VS_AI')}
                       icon={<Cpu size={32} />}
                    />
                    <ModeCard 
                       title="Multiplayer" sub="2-Player tactical response room"
                       active={mode === 'MULTIPLAYER'} onClick={() => navigate('/game/multiplayer')}
                       icon={<Users size={32} />}
                    />
                 </div>
                 <button onClick={startGame} className="w-full py-6 bg-cyan-600 rounded-2xl text-xl font-black uppercase tracking-[0.3em] hover:bg-cyan-500 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_50px_rgba(34,211,238,0.3)]">
                    Initiate Deployment
                 </button>
              </motion.div>
            ) : (
              <div className="w-full max-w-6xl flex gap-8">
                 {/* PLAYER PANEL */}
                 <div className="flex-1 flex flex-col items-center gap-8">
                    {!currentAttack ? (
                      <div className="flex flex-col items-center gap-6 mt-20">
                         <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Monitoring Neural Link...</span>
                      </div>
                    ) : (
                      <div className="w-full space-y-8">
                         <AttackCard attack={currentAttack} feedback={feedback} />
                         
                         <div className="grid grid-cols-3 gap-6">
                            <ActionButton label="BLOCK" icon={<Lock />} theme="pink" onClick={() => handleAction('BLOCK')} />
                            <ActionButton label="LIMIT" icon={<RefreshCcw />} theme="cyan" onClick={() => handleAction('RATE_LIMIT')} />
                            <ActionButton label="IGNORE" icon={<Terminal />} theme="slate" onClick={() => handleAction('IGNORE')} />
                         </div>
                      </div>
                    )}
                 </div>

                 {/* AI SCOREBOARD (Parallel Mode) */}
                 {mode === 'HUMAN_VS_AI' && (
                   <div className="w-[350px] flex flex-col gap-6">
                      <div className="premium-card p-8 space-y-8 bg-black/40 border-white/5">
                         <header className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                                  <Cpu className="text-pink-500" size={16} />
                               </div>
                               <span className="text-xs font-black uppercase tracking-widest">ARIA AI Unit</span>
                            </div>
                            <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded uppercase tracking-widest border border-emerald-500/20">Active</div>
                         </header>
                         
                         <div className="space-y-6">
                            <ScoreDiff label="Score Difference" human={stats.score} ai={aiStats.score} />
                            <div className="space-y-4">
                               <AiStat label="Efficiency" val={aiStats.accuracy} color="text-pink-400" />
                               <AiStat label="Tactical Neutralizations" val={aiStats.correct} color="text-white" />
                            </div>
                         </div>
                      </div>

                      {/* ARIA RECOMMENDATION */}
                      <div className="premium-glass p-8 space-y-4 border-white/5 bg-cyan-500/5">
                         <div className="flex items-center gap-3">
                            <Brain className="text-cyan-400" size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Targeting Intel</span>
                         </div>
                         <p className="text-xs font-bold leading-relaxed italic text-slate-400">
                            "Heuristics match confirmed. recommended protocol: {currentAttack?.detection.recommended_action || 'SCANNING'}."
                         </p>
                      </div>
                   </div>
                 )}
              </div>
            )}
         </AnimatePresence>
      </main>

      {/* BOSS WAVE OVERLAY */}
      <AnimatePresence>
        {isBossWave && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-sm pointer-events-none"
          >
             <motion.div 
               animate={{ scale: [0.9, 1.1, 0.9] }} 
               transition={{ repeat: Infinity, duration: 1 }}
               className="text-center space-y-4"
             >
                <div className="flex items-center justify-center gap-6">
                   <AlertTriangle size={60} className="text-red-500" />
                   <h2 className="text-8xl font-black text-red-500 uppercase italic tracking-tighter shadow-2xl">DDoS WAVE</h2>
                   <AlertTriangle size={60} className="text-red-500" />
                </div>
                <div className="text-xl font-bold text-white uppercase tracking-[0.5em] animate-pulse">High Confidence Ingress Cluster Detected</div>
             </motion.div>
             
             {/* RED SCANLINES */}
             <div className="absolute inset-0 border-[40px] border-red-500/20 animate-pulse pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ModeCard = ({ title, sub, active, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`p-10 rounded-3xl border text-left transition-all duration-500 group relative overflow-hidden ${active ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.2)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
  >
     <div className={`p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 ${active ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-500'}`}>
        {icon}
     </div>
     <div className="space-y-1">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter">{title}</h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{sub}</p>
     </div>
  </button>
);

const AttackCard = ({ attack, feedback }) => (
  <motion.div 
    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
    className={`premium-card p-1 overflow-hidden transition-all duration-500 ${feedback?.type === 'SUCCESS' ? 'scale-95 opacity-50' : 'scale-100'}`}
  >
     <div className="bg-[#0a0a0c] p-12 flex items-center justify-between relative">
        <div className="space-y-8 flex-1">
           <div className="space-y-2">
              <div className="flex items-center gap-4">
                 <span className="px-3 py-1 bg-white/5 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded border border-white/10">INGRESS_ACTIVE</span>
                 <span className="text-[10px] font-black text-slate-600 mono uppercase tracking-widest">{attack.log.ip}</span>
              </div>
              <h1 className="text-6xl font-black uppercase italic tracking-tighter text-white">{attack.log.attack_type.replace('_',' ')}</h1>
           </div>

           <div className="grid grid-cols-2 gap-12">
              <Stat label="Source Origin" val={attack.log.country} />
              <Stat label="Risk Index" val={`${attack.detection.risk.score}%`} color="text-pink-500" />
           </div>

           <div className="p-5 premium-glass border-white/5 text-xs font-mono text-slate-400 italic">
              <span className="text-cyan-500">>>></span> {attack.log.event}
           </div>
        </div>

        {/* FEEDBACK OVERLAY */}
        <AnimatePresence>
           {feedback && (
             <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`absolute right-12 top-1/2 -translate-y-1/2 p-8 rounded-3xl border ${feedback.type === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex flex-col items-center gap-4 text-center">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center ${feedback.type === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {feedback.type === 'SUCCESS' ? <Shield size={32} /> : <AlertTriangle size={32} />}
                   </div>
                   <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Validation Protocol</span>
                      <p className="text-xl font-black uppercase text-white tracking-widest italic">{feedback.msg}</p>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>
     </div>
  </motion.div>
);

const ActionButton = ({ label, icon, onClick, theme }) => {
  const styles = {
    pink: "border-pink-500/30 bg-pink-500/5 text-pink-500 hover:bg-pink-500 hover:text-white glow-pink",
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-500 hover:bg-cyan-500 hover:text-white glow-blue",
    slate: "border-white/10 bg-white/5 text-slate-500 hover:border-white hover:text-white"
  };

  return (
    <button onClick={onClick} className={`h-24 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group active:scale-95 ${styles[theme]}`}>
       <div className="group-hover:scale-125 transition-transform">{React.cloneElement(icon, { size: 20 })}</div>
       <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">{label}</span>
    </button>
  );
};

const Stat = ({ label, val, color = "text-white" }) => (
  <div className="flex flex-col">
     <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</span>
     <span className={`text-xl font-bold uppercase ${color}`}>{val}</span>
  </div>
);

const AiStat = ({ label, val, color }) => (
  <div className="flex justify-between items-center">
     <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
     <span className={`text-sm font-black mono ${color}`}>{val}{label==='Efficiency'?'%':''}</span>
  </div>
);

const ScoreDiff = ({ human, ai }) => {
  const diff = human - ai;
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-[10px] font-black uppercase">
          <span>Human</span>
          <span>AI Delta</span>
       </div>
       <div className="h-2 bg-slate-900 rounded-full overflow-hidden flex">
          <div className="bg-cyan-500 transition-all duration-1000" style={{ width: `${(human / Math.max(human+ai, 1)) * 100}%` }} />
          <div className="bg-pink-500 transition-all duration-1000 flex-1" />
       </div>
       <div className={`text-[9px] font-black italic text-center ${diff>=0?'text-emerald-400':'text-pink-400'}`}>
          {diff >= 0 ? `+${diff} Advantage` : `${diff} Lag behind AI`}
       </div>
    </div>
  );
}

export default Game;
