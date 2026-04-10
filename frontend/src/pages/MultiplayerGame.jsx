import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Swords, Shield, Zap, Trophy, Timer, AlertTriangle,
  Lock, RefreshCcw, Terminal, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MultiplayerGame = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState(`hacker_${Math.floor(Math.random()*9000)+1000}`);
  const [roomActive, setRoomActive] = useState(false);
  const [players, setPlayers] = useState({});
  const [currentAttack, setCurrentAttack] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isBossWave, setIsBossWave] = useState(false);
  
  const wsRef = useRef(null);

  const connectWS = (rid) => {
    const host = "127.0.0.1";
    const ws = new WebSocket(`ws://${host}:8000/ws/game/${rid}?player_id=${playerId}`);
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'ATTACK') {
        setCurrentAttack({ ...payload.data, startTime: Date.now() });
        setFeedback(null);
      } else if (payload.type === 'BOSS_WAVE_START') {
        setIsBossWave(true);
      } else if (payload.type === 'BOSS_WAVE_END') {
        setIsBossWave(false);
      }
    };
    
    wsRef.current = ws;
    setRoomActive(true);
  };

  const handleAction = async (action) => {
    if (!currentAttack || feedback) return;
    
    try {
        const res = await fetch(`http://127.0.0.1:8000/game/action?room_id=${roomId}&player_id=${playerId}&action=${action}&attack_id=${currentAttack.log.log_id}`, {
            method: 'POST'
        });
        const data = await res.json();
        
        if (data.is_correct) {
            setFeedback({ type: 'SUCCESS', msg: `NODE SECURED: +${data.points} DEFENSE VECTORS` });
        } else {
            setFeedback({ type: 'ERROR', msg: `PERIMETER BREACH: ${data.points} SCORE PENALTY` });
        }
        
        setPlayers(prev => ({
            ...prev,
            [playerId]: { score: data.new_score, accuracy: data.accuracy, streak: data.streak, combo: data.combo }
        }));

        setTimeout(() => {
            setFeedback(null);
            setCurrentAttack(null);
        }, 2000);
    } catch (err) {
        console.error("Action failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-scanlines opacity-[0.05] pointer-events-none" />
      
      {!roomActive ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-20">
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md space-y-8 premium-card p-12 bg-black/40 border-white/5 shadow-2xl">
              <div className="text-center space-y-2">
                 <Users className="mx-auto text-cyan-500 mb-4" size={48} />
                 <h1 className="text-4xl font-black uppercase italic tracking-tighter">Combat Room</h1>
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Multiplayer Peer-to-Peer Link</p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Room Identifier</label>
                    <input 
                       type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)}
                       placeholder="Enter Room Code (e.g. ALPHA_8)"
                       className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-white placeholder:text-slate-700 focus:border-cyan-500/50 outline-none transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Codenmame</label>
                    <input 
                       type="text" value={playerId} disabled
                       className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-slate-500 cursor-not-allowed"
                    />
                 </div>
                 <button 
                   onClick={() => connectWS(roomId)}
                   disabled={!roomId}
                   className="w-full py-6 bg-cyan-600 rounded-2xl text-xl font-black uppercase tracking-[0.2em] hover:bg-cyan-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(34,211,238,0.2)]"
                 >
                    Establish Link
                 </button>
                 <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back to Command
                 </button>
              </div>
           </motion.div>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <header className="p-8 flex justify-between items-center z-20">
             <div className="flex gap-8 items-center">
                <div className="premium-glass p-6 rounded-3xl border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Your Score
                   </div>
                   <div className="text-4xl font-black text-white mono">{players[playerId]?.score || 0}</div>
                </div>

                <div className="flex flex-col gap-2">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Room: {roomId}</span>
                   <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="text-right">
                   <span className="text-[10px] font-black text-slate-500 uppercase">Opponent Score</span>
                   <div className="text-2xl font-black text-pink-500 mono tracking-tighter">SYNCING...</div>
                </div>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-4 premium-glass border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Quit</button>
             </div>
          </header>

          {/* MAIN BATTLE */}
          <main className="flex-1 flex flex-col items-center justify-center p-8 z-20">
             {isBossWave && (
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-sm">
                  <h2 className="text-9xl font-black text-red-500 uppercase italic animate-pulse">DDoS WAVE</h2>
               </motion.div>
             )}
             
             <div className="w-full max-w-4xl space-y-12">
                {!currentAttack ? (
                  <div className="text-center space-y-6">
                     <RefreshCcw className="mx-auto text-slate-800 animate-spin" size={48} />
                     <p className="text-xs font-black text-slate-700 uppercase tracking-[0.3em]">Awaiting Ingress Event...</p>
                  </div>
                ) : (
                  <BattleHUD attack={currentAttack} feedback={feedback} onAction={handleAction} />
                )}
             </div>
          </main>
        </>
      )}
    </div>
  );
};

const BattleHUD = ({ attack, feedback, onAction }) => (
  <div className="space-y-8">
     <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="premium-card p-1">
        <div className="bg-[#0a0a0c] p-12 space-y-8 relative overflow-hidden">
           {feedback && (
             <div className={`absolute inset-0 z-30 flex items-center justify-center backdrop-blur-md ${feedback.type==='SUCCESS'?'bg-emerald-950/40':'bg-red-950/40'}`}>
                <span className="text-3xl font-black uppercase italic tracking-widest">{feedback.msg}</span>
             </div>
           )}
           <div className="flex justify-between items-start">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Multipoint Ingress Detected</span>
                 <h1 className="text-6xl font-black uppercase italic tracking-tighter">{attack.log.attack_type.replace('_',' ')}</h1>
              </div>
              <div className="text-right space-y-1">
                 <span className="text-[9px] font-black text-slate-500">SIGNATURE_ID</span>
                 <p className="text-xs font-bold text-white mono">{attack.log.log_id.slice(0,12)}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-12 pt-8 border-t border-white/5">
              <div>
                 <span className="text-[9px] font-black text-slate-600 uppercase">Targeting Profile</span>
                 <p className="text-xl font-bold text-white uppercase">{attack.detection.profile.type}</p>
              </div>
              <div>
                 <span className="text-[9px] font-black text-slate-600 uppercase">System Confidence</span>
                 <p className="text-xl font-bold text-white">{attack.detection.confidence}%</p>
              </div>
           </div>
        </div>
     </motion.div>

     <div className="grid grid-cols-3 gap-6">
        <GameBtn label="BLOCK" color="pink" onClick={() => onAction('BLOCK')} />
        <GameBtn label="LIMIT" color="cyan" onClick={() => onAction('RATE_LIMIT')} />
        <GameBtn label="IGNORE" color="slate" onClick={() => onAction('IGNORE')} />
     </div>
  </div>
);

const GameBtn = ({ label, color, onClick }) => {
  const themes = {
     pink: "border-pink-500/20 hover:border-pink-500 text-pink-500 bg-pink-500/5 glow-pink",
     cyan: "border-cyan-500/20 hover:border-cyan-500 text-cyan-500 bg-cyan-500/5 glow-blue",
     slate: "border-white/10 hover:border-white text-slate-500 bg-white/5"
  };
  return (
    <button onClick={onClick} className={`h-28 rounded-3xl border transition-all duration-300 flex items-center justify-center font-black text-xl uppercase tracking-[0.2em] font-mono active:scale-95 ${themes[color]}`}>
       {label}
    </button>
  );
}

export default MultiplayerGame;
