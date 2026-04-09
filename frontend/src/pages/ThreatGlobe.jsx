import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldAlert, Activity, Globe as GlobeIcon, 
  Zap, Target, Terminal, Swords, Trophy, Ghost,
  Power, Crosshair, Radar
} from 'lucide-react';
import TacticalGlobe from '../components/TacticalGlobe';

const ThreatGlobe = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('GLOBAL');
  const [shieldLvl, setShieldLvl] = useState(94);
  const [xp, setXp] = useState(4520);
  const [showDamage, setShowDamage] = useState(false);

  const connectWS = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsHost = window.location.hostname || "localhost";
    const ws = new WebSocket(`ws://${wsHost}:8000/ws/live?token=${encodeURIComponent(token)}`);

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event && Number.isFinite(payload.event.lat) && Number.isFinite(payload.event.lng)) {
          setEvents(prev => [...prev.slice(-49), payload]);
          
          // Game Logic: Flash damage and deplete shield slightly on attack
          if (payload.detection.threat) {
             console.log("Attack Intercepted!");
             setShieldLvl(s => Math.max(10, s - 0.2));
             setXp(x => x + 50);
             setShowDamage(true);
             setTimeout(() => setShowDamage(false), 400);
          }
        }
      } catch (err) {
        console.error("Parse error", err);
      }
    };
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWS, 5000);
    };
    return ws;
  }, []);

  useEffect(() => {
    const ws = connectWS();
    return () => ws?.close();
  }, [connectWS]);

  return (
    <div className={`relative w-full h-screen bg-[#020617] overflow-hidden flex flex-col font-['Outfit'] ${showDamage ? 'damage-flash' : ''}`}>
      
      {/* 3D GLOBE ENGINE */}
      <div className="absolute inset-0 z-0">
        <TacticalGlobe attacks={events} />
      </div>

      {/* GAMIFIED HUD OVERLAYS */}

      {/* TOP RIGHT: DEFCON LEVEL */}
      <div className="absolute top-8 right-12 z-[110] animate-in slide-in-from-right duration-1000">
         <div className={`px-8 py-3 rounded-xl border-2 flex flex-col items-center gap-1 backdrop-blur-3xl shadow-2xl transition-all duration-500 ${shieldLvl < 50 ? 'border-pink-500 bg-pink-500/10' : 'border-cyan-500/20 bg-black/60'}`}>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Defense_Condition</span>
            <div className="flex items-baseline gap-2">
               <span className={`text-4xl font-black mono ${shieldLvl < 50 ? 'text-pink-500' : 'text-white'}`}>
                  DEFCON {shieldLvl < 30 ? '1' : shieldLvl < 60 ? '2' : '4'}
               </span>
            </div>
            <div className="flex gap-1">
               {[1,2,3,4,5].map(i => (
                  <div key={i} className={`w-6 h-1 rounded-full ${5-i < (shieldLvl/20) ? 'bg-cyan-500' : 'bg-slate-800'}`} />
               ))}
            </div>
         </div>
      </div>

      {/* TOP HUD: SHIELD & INTEGRITY */}

      {/* TOP HUD: SHIELD & INTEGRITY */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl animate-in slide-in-from-top duration-1000">
         <div className="premium-glass p-3 px-8 rounded-[2rem] border-white/10 flex flex-col gap-2 relative overflow-hidden">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                     <ShieldAlert size={16} className="text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Shield_Integrity</span>
               </div>
               <span className="text-xl font-black text-white mono">{shieldLvl.toFixed(1)}%</span>
            </div>
            <div className="hp-bar h-2">
               <div className={`hp-fill ${shieldLvl < 40 ? 'danger' : ''}`} style={{ width: `${shieldLvl}%` }} />
            </div>
            <div className="absolute -bottom-4 right-8 text-[8px] font-bold text-slate-700 uppercase tracking-[0.5em] opacity-30">
               AUTO_MITIGATION: ACTIVE
            </div>
         </div>
      </div>

      {/* TOP LEFT: COMMANDER RANK & XP */}
      <div className="absolute top-8 left-8 z-[100] flex flex-col gap-4 animate-in slide-in-from-left duration-1000">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center glow-purple border border-white/20 relative group">
               <Trophy className="text-white group-hover:scale-110 transition-transform" size={28} />
               <div className="absolute -bottom-2 -right-2 rank-badge">LVL 42</div>
            </div>
            <div className="flex flex-col">
               <span className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1">CommanderX_Beta</span>
               <div className="flex items-center gap-2">
                  <div className="hp-bar w-32 h-1.5 border-none bg-white/5">
                     <div className="hp-fill !bg-purple-500 h-full" style={{ width: '65%' }} />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 mono">{xp} XP</span>
               </div>
            </div>
         </div>

         <button 
           onClick={() => navigate('/dashboard')}
           className="group flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 backdrop-blur-3xl transition-all duration-500 pointer-events-auto shadow-2xl"
         >
           <ChevronLeft size={16} className="text-slate-400 group-hover:text-cyan-400" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Exit Simulation</span>
         </button>
      </div>

      {/* TOP RIGHT: MISSION OBJECTIVE */}
      <div className="absolute top-8 right-8 z-[100] w-80 animate-in slide-in-from-right duration-1000">
         <div className="premium-glass p-6 rounded-[2.5rem] border-white/10 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
               <Crosshair className="text-pink-500" size={18} />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Active_Mission</span>
            </div>
            <h3 className="text-lg font-black text-pink-500 tracking-tighter mb-2 crt-flicker">NEUTRALIZE_VECTORS</h3>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">
               Detecting increased SQLi frequency from <span className="text-white font-bold">Zone_7</span>. 
               Intercept all inbound packets to secure core data nodes.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-slate-600 tracking-widest uppercase italic">
               <Radar size={12} className="animate-spin text-pink-500" /> SCANNING_ADVERSARIES...
            </div>
         </div>
      </div>

      {/* BOTTOM LEFT: COMBAT LOG (MINI-FEED) */}
      <div className="absolute bottom-10 left-10 z-[100] w-96 max-h-80 overflow-hidden flex flex-col gap-4 animate-in slide-in-from-bottom duration-1000">
         <div className="premium-glass p-6 rounded-[2.5rem] border-cyan-500/10 h-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
               <div className="flex items-center gap-2">
                  <Terminal className="text-cyan-400" size={14} />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Combat_Log</span>
               </div>
               <div className="rank-badge">REC: {events.length}</div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
               {events.slice(-8).reverse().map((ev, i) => (
                  <div key={i} className="flex flex-col gap-1 border-l-2 border-cyan-500/20 pl-3 py-1 group hover:border-cyan-500 transition-colors">
                     <div className="flex justify-between items-center text-[10px] mono">
                        <span className="text-white font-black">{ev.event.ip}</span>
                        <span className="text-slate-600">[{ev.event.country}]</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${ev.detection.threat ? 'text-pink-500' : 'text-cyan-500'}`}>
                           {ev.event.type.replace('_',' ')}
                        </span>
                        <span className="text-[8px] text-emerald-500 font-bold">NEUTRALIZED</span>
                     </div>
                  </div>
               ))}
               {events.length === 0 && <span className="text-[10px] text-slate-600 italic mono uppercase tracking-widest">Awaiting Adversary Movement...</span>}
            </div>
         </div>
      </div>

      {/* BOTTOM CENTER: GAME CONTROLS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] flex gap-4 p-2 bg-black/80 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,1)] pointer-events-auto">
         <GameBtn icon={<Power />} active={true} label="Active" />
         <GameBtn icon={<Ghost />} label="Stealth" />
         <GameBtn icon={<Crosshair />} label="Focus" />
         <div className="w-px h-10 bg-white/10 mx-2" />
         <button 
           className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-[0.2em] text-xs rounded-full transition-all active:scale-95 shadow-[0_0_30px_rgba(0,234,255,0.4)]"
           onClick={() => {
              setShieldLvl(100);
              console.log("Shield Overcharged!");
           }}
         >
            Overcharge_Shield
         </button>
      </div>

      {/* AMBIENT GAME EFFECTS */}
      <div className="absolute inset-0 pointer-events-none crt-overlay opacity-50" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,234,255,0.05),transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none ring-overlay" />
    </div>
  );
};

const GameBtn = ({ icon, label, active = false }) => (
  <button className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all border ${active ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
     {React.cloneElement(icon, { size: 18 })}
     <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default ThreatGlobe;
