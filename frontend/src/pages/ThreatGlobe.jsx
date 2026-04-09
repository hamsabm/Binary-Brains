import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldAlert, Activity, Globe as GlobeIcon, Zap, Target, Terminal } from 'lucide-react';
import TacticalGlobe from '../components/TacticalGlobe';

const ThreatGlobe = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('GLOBAL');

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
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden flex flex-col font-['Outfit']">
      
      {/* 3D GLOBE - THE HERO */}
      <div className="absolute inset-0 z-0">
        <TacticalGlobe attacks={events} />
      </div>

      {/* ULTRA-PREMIUM HUD OVERLAY */}
      
      {/* TOP LEFT: BRANDING & STATUS */}
      <div className="absolute top-10 left-10 p-2 z-20 pointer-events-none space-y-8 animate-in slide-in-from-left duration-1000">
         <div className="space-y-4 pointer-events-auto">
            <button 
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl transition-all duration-300"
            >
              <div className="p-1 bg-white/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                 <ChevronLeft size={16} className="text-white group-hover:text-cyan-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">Strategic Dashboard</span>
            </button>
            
            <div className="flex flex-col gap-1 pl-2">
               <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                  <div className="relative">
                     <div className={`w-3 h-3 rounded-full ${connected ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-pink-500 shadow-[0_0_15px_#ec4899]'} animate-pulse`} />
                     <div className={`absolute -inset-1 rounded-full ${connected ? 'bg-cyan-500/20' : 'bg-pink-500/20'} animate-ping`} />
                  </div>
                  WarRoomX <span className="vibrant-gradient-text glow-text">Tactical Hub</span>
               </h1>
               <p className="text-[10px] text-slate-500 font-bold mono tracking-[0.4em] uppercase pl-8 opacity-70">
                  Real-time Neural Network Vector Mapping // Section_Alpha_04
               </p>
            </div>
         </div>

         {/* LIVE FEED MINI-LIST */}
         <div className="w-80 h-96 premium-glass rounded-[2rem] p-6 pointer-events-auto border-cyan-500/10 flex flex-col gap-4 overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <span className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={14} className="text-cyan-400" /> Inbound Packets
               </span>
               <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" />
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce delay-100" />
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce delay-200" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
               {events.slice(-10).reverse().map((ev, i) => (
                  <div key={i} className="animate-in slide-in-from-bottom-2 fade-in duration-500 flex flex-col gap-1 border-l-2 border-cyan-500/20 pl-3 py-1">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white mono">{ev.event.ip}</span>
                        <span className="text-[9px] text-slate-500 mono">{ev.event.timestamp.split('T')[1].split('.')[0]}</span>
                     </div>
                     <span className={`text-[9px] font-bold uppercase tracking-widest ${ev.detection.threat ? 'text-pink-500' : 'text-cyan-500'}`}>
                        {ev.event.type.replace('_',' ')}
                     </span>
                  </div>
               ))}
               {events.length === 0 && <span className="text-[10px] text-slate-600 italic">Listening for global ingress...</span>}
            </div>
         </div>
      </div>

      {/* TOP RIGHT: QUARANTINE STATUS */}
      <div className="absolute top-10 right-10 flex items-center gap-6 z-20 animate-in slide-in-from-right duration-1000">
         <div className="premium-glass px-8 py-5 rounded-[2rem] border-pink-500/10 flex flex-col items-end">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
               <ShieldAlert size={12} className="text-pink-500" /> Active Threats
            </div>
            <div className="text-5xl font-black text-white mono tracking-tighter flex items-baseline gap-2">
               {events.length} <span className="text-xs text-slate-600">PKTS</span>
            </div>
         </div>
         <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 backdrop-blur-xl group hover:bg-white/10 transition-colors cursor-pointer pointer-events-auto">
            <GlobeIcon className="text-cyan-400 group-hover:rotate-12 transition-transform duration-500" size={32} />
         </div>
      </div>

      {/* BOTTOM CENTER: CONTROLS & INFO */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in slide-in-from-bottom duration-1000">
         <div className="flex gap-4 p-2 premium-glass rounded-[2.5rem] bg-black/40 border-white/5 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            <TabBtn active={activeTab === 'GLOBAL'} onClick={() => setActiveTab('GLOBAL')} label="Global View" />
            <TabBtn active={activeTab === 'ANALYTICS'} onClick={() => setActiveTab('ANALYTICS')} label="Neural Hub" />
            <TabBtn active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} label="Incident Log" />
         </div>
      </div>

      {/* BOTTOM RIGHT: SYSTEM SPECS */}
      <div className="absolute bottom-10 right-10 z-20 text-right pointer-events-none opacity-40">
         <div className="text-[10px] text-slate-500 font-bold mono uppercase tracking-widest mb-1">Neural Core v5.8.2</div>
         <div className="text-[9px] text-slate-600 font-medium italic">AES-256 GCM Tunnel // Cluster_Delta_Active</div>
      </div>

      {/* AMBIENT EFFECTS */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,234,255,0.03),transparent_50%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_100%_100%,rgba(125,0,255,0.03),transparent_50%)]" />
      
      {/* VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]" />
    </div>
  );
};

const TabBtn = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500 ${active ? 'bg-white/10 text-white shadow-xl border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
  >
    {label}
  </button>
);

export default ThreatGlobe;
