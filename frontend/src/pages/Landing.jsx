import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Terminal, Cpu, Activity, Globe, Zap, 
  ChevronRight, Lock, Server, Database, ShieldAlert,
  Search, Cpu as Chip, Network
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden selection:bg-cyan-500/30">
      
      {/* IMMERSIVE BACKGROUND - Translucent */}
      <div className="fixed inset-0 z-0">
         {/* Mesh and Scanlines are now global */}
      </div>

      {/* NAV BAR - TACTICAL STYLE */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-12 py-8 flex justify-between items-center animate-in slide-in-from-top duration-700">
         <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center glow-blue border border-white/10 group-hover:rotate-12 transition-transform duration-500">
               <Shield className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
               <span className="font-black text-xl tracking-tight leading-none text-white">WarRoomX</span>
               <span className="text-[9px] font-bold text-slate-500 tracking-[0.4em] uppercase">Neural_Defense</span>
            </div>
         </div>

         <div className="flex items-center gap-12">
            <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
               <a href="#" className="hover:text-cyan-400 transition-colors">Vulnerability_Scanner</a>
               <a href="#" className="hover:text-cyan-400 transition-colors">Asset_Pulse</a>
               <a href="#" className="hover:text-cyan-400 transition-colors">Neural_Network</a>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-all group"
            >
               <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-cyan-400 transition-colors">Initialize_Command</span>
               <div className="p-1 bg-white/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-cyan-400" />
               </div>
            </button>
         </div>
      </nav>

      {/* HERO SECTION - THE HACKING EXPERIENCE */}
      <main className="relative z-10 pt-48 pb-24 px-12 max-w-7xl mx-auto flex flex-col items-center">
         
         {/* STATUS BADGE */}
         <div className="mb-10 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl flex items-center gap-4 animate-in zoom-in duration-1000">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-cyan-400 glow-blue animate-pulse" />
               <span className="text-[10px] font-black text-white tracking-widest uppercase">Node_Connected</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mono">Uplink: Secure_AES_256</span>
         </div>

         {/* MAIN TITLE - GLITCH STYLE */}
         <div className="text-center relative mb-12">
            <h1 
              data-text="ELIMINATE THE UNKNOWN."
              className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-6 glitch-text leading-none"
            >
               ELIMINATE THE <br /> <span className="vibrant-gradient-text">UNKNOWN.</span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-slate-400 font-medium leading-relaxed">
               The world's most advanced AI-driven cybersecurity command center. 
               Experience real-time neural threat interception with <span className="text-white font-bold">zero-latency</span> autonomous mitigation.
            </p>
         </div>

         {/* CTA BAR */}
         <div className="flex flex-wrap justify-center gap-6 mb-24 pointer-events-auto">
            <button 
              onClick={() => navigate('/login')}
              className="px-12 py-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-[2rem] transition-all hover:scale-105 hover:-translate-y-1 shadow-[0_20px_60px_rgba(0,234,255,0.3)] flex items-center gap-4"
            >
               <Zap size={24} fill="currentColor" />
               <span className="text-sm uppercase tracking-widest">Assume Command Now</span>
            </button>
            <button className="px-10 py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-[2rem] transition-all flex items-center gap-3">
               <Terminal size={20} />
               <span className="text-sm uppercase tracking-widest">Watch Simulation</span>
            </button>
         </div>

         {/* LIVE HUD PREVIEW CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <HudCard 
              icon={<Search />} 
              title="Vulnerability_Logic" 
              sub="Autonomous Triage Engine"
              desc="Scans millions of ingress nodes per second with 99.9% LLM detection accuracy."
            />
            <HudCard 
              icon={<ShieldAlert />} 
              title="Perimeter_Neutral" 
              sub="Zero-Day Shield v5.2"
              desc="Instant auto-blocking and quarantine protocols for suspected lateral movements."
              color="pink"
            />
            <HudCard 
              icon={<Network />} 
              title="Neural_Visualizer" 
              sub="3D Tactical Global Map"
              desc="Real-time 3D Earth projection with Great Circle arc vector monitoring."
              color="purple"
            />
         </div>
      </main>

      {/* TERMINAL STRIP SECTION */}
      <section className="relative z-10 border-y border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="p-12 border-r border-white/5 flex-1 space-y-4">
               <div className="flex items-center gap-3 text-cyan-400 font-black text-xs uppercase tracking-widest">
                  <Terminal size={14} /> Live_Intercept_Buffer
               </div>
               <div className="font-mono text-xs text-slate-500 space-y-1 opacity-60">
                  <p className="animate-pulse">[SUCCESS] Quarantined IP: 182.12.9.43 // Zone_Delta</p>
                  <p>[INFO] Neural Core analyzing protocol: SMB_RECON</p>
                  <p className="text-cyan-500/60">[ALERT] Lateral movement detected in Cluster_09</p>
               </div>
            </div>
            <div className="p-12 flex-1 flex flex-col items-end">
               <div className="text-6xl font-black text-white mono mb-2">99.2%</div>
               <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Overall_Security_Index</div>
            </div>
         </div>
         {/* Moving Gradient background behind text */}
         <div className="absolute inset-0 -z-10 opacity-20 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent animate-pulse" />
      </section>

      {/* FOOTER - SYSTEM LOG */}
      <footer className="relative z-10 py-16 px-12 flex flex-col items-center gap-8">
         <div className="flex items-center gap-12 text-[10px] font-black text-slate-700 uppercase tracking-widest">
            <span>&copy; 2026 WarRoomX_Intelligence</span>
            <div className="flex gap-4">
               <a href="#" className="hover:text-white transition-colors">Privacy_Protocols</a>
               <a href="#" className="hover:text-white transition-colors">Neural_Terms</a>
            </div>
         </div>
         <div className="flex items-center gap-2 opacity-30">
            <div className="w-1 h-1 rounded-full bg-white animate-ping" />
            <span className="text-[9px] font-bold mono">SIGNAL_STRENGTH: 100% // ENCRYPTION: SEC_ALPHA_7</span>
         </div>
      </footer>
    </div>
  );
};

const HudCard = ({ icon, title, sub, desc, color = 'cyan' }) => {
   const colorMap = {
      cyan: 'text-cyan-400 group-hover:border-cyan-500/40',
      pink: 'text-pink-400 group-hover:border-pink-500/40',
      purple: 'text-purple-400 group-hover:border-purple-500/40'
   };
   
   return (
      <div className="premium-card p-10 flex flex-col gap-6 group cursor-default transition-all duration-700">
         <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all ${colorMap[color]}`}>
            {React.cloneElement(icon, { size: 28 })}
         </div>
         <div className="space-y-2">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{sub}</div>
            <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
         </div>
         <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Module_Active</span>
            <div className={`w-1 h-1 rounded-full animate-ping ${color === 'cyan' ? 'bg-cyan-500' : color === 'pink' ? 'bg-pink-500' : 'bg-purple-500'}`} />
         </div>
      </div>
   );
}

export default Landing;
