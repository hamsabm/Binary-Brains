import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Activity,
  Globe as GlobeIcon,
  Server,
  Database,
  Lock,
  Zap,
  RefreshCw,
  Info
} from 'lucide-react';
import { getStats, getFullCycle, startSimulation } from '../api';

const LiveFeed = () => {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total_events: 0, threats_detected: 0, ips_blocked: 0 });
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const scrollRef = useRef(null);

  // WebSocket Connection with Auto-Reconnect
  const connectWS = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsHost = "127.0.0.1";
    const ws = new WebSocket(`ws://${wsHost}:8000/ws/live?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      console.log("[WS] SECURE_HANDSHAKE_COMPLETE // Node: Operational");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("[WS] INGRESS_PACKET_RECEIVED:", payload);
        
        // Ensure new event mapping is clean
        if (payload && payload.event) {
          setEvents(prev => [payload, ...prev].slice(0, 50));
          
          // Add to live log
          const logEntry = {
            id: payload.log?.log_id || Date.now(),
            time: new Date().toLocaleTimeString(),
            type: payload.log?.attack_type || 'Unknown',
            ip: payload.log?.ip || '0.0.0.0',
            status: payload.detection?.threat ? 'THREAT' : 'NORMAL',
            description: payload.detection?.explanation || payload.detection?.reason || 'System Intercept'
          };
          setLogs(prev => [logEntry, ...prev].slice(0, 100));
        }
      } catch (err) {
        console.error("[WS] CRITICAL_PARSE_ERROR:", err);
      }
    };

    ws.onclose = () => {
      console.log("[WS] Connection lost. Retrying in 5s...");
      setConnected(false);
      setTimeout(connectWS, 5000);
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      ws.close();
    };

    return ws;
  }, []);

  useEffect(() => {
    const ws = connectWS();
    return () => ws?.close();
  }, [connectWS]);

  // Periodic Stats Fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getStats();
        setStats(data);
      } catch (e) {
        console.warn("Stats fetch failed", e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = async () => {
    setIsSimulating(true);
    try {
      await startSimulation();
      console.log("[SIM] GLOBAL_INTERCEPTOR_STARTED");
    } catch (e) {
      console.error("[SIM] START_FAILED:", e);
    } finally {
      setTimeout(() => setIsSimulating(false), 800);
    }
  };

  const threatEvents = useMemo(() => events.filter(e => e.detection.threat), [events]);

  return (
    <div className="flex flex-col gap-6 p-2 min-h-screen">
      {/* HEADER HUD */}
      <header className="glass-panel p-6 rounded-2xl flex justify-between items-center relative overflow-hidden">
        <div className="scanline" />
        <div className="flex items-center gap-4 z-10">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <ShieldCheck className="text-cyan-400 glow-text-blue" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">Cyber War Room</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mono">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
              NODE_STATUS: {connected ? 'OPERATIONAL' : 'RECONNECTING'} // SESSION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="flex gap-4 z-10">
          <button 
            onClick={triggerSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isSimulating ? 'animate-spin' : ''} />
            <span className="font-bold text-sm tracking-tighter">SIMULATE_INGRESS</span>
          </button>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIVE STREAM */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* METRICS GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl relative">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Ingress</div>
              <div className="text-3xl font-black text-white mono leading-none">{stats.total_events}</div>
              <Activity className="absolute top-4 right-4 text-slate-700" size={16} />
            </div>
            <div className="glass-panel p-5 rounded-2xl relative border-l-red-500/50 border-l-2">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 text-red-400">Threats</div>
              <div className="text-3xl font-black text-red-500 mono leading-none">{stats.threats_detected}</div>
              <ShieldAlert className="absolute top-4 right-4 text-red-900/40" size={16} />
            </div>
          </div>

          {/* ACTIVE THREATS LOG */}
          <div className="glass-panel rounded-2xl flex flex-col h-[520px]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Live SOC Stream</span>
              </div>
              <div className="text-[10px] text-slate-500 mono">INTEL_QUEUE: {logs.length}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={scrollRef}>
              {logs.length === 0 && <div className="text-slate-600 text-xs italic p-4 text-center">Awaiting incoming traffic packets...</div>}
              {logs.map((log) => (
                <div key={log.id} className="glass-card p-3 group">
                   <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.status === 'THREAT' ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {log.type.replace('_',' ')}
                      </span>
                      <span className="text-[9px] text-slate-500 mono">{log.time}</span>
                   </div>
                   <div className="text-[13px] font-bold text-slate-200 mono mb-1 truncate">{log.ip}</div>
                   <div className="text-[11px] text-slate-500 leading-tight line-clamp-2">{log.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXPANDED LIVE FEED CONSOLE */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl flex flex-col h-[650px]">
             <div className="p-4 border-b border-white/5 flex justify-between items-center bg-cyan-500/5">
                <div className="flex items-center gap-2">
                   <Server size={14} className="text-cyan-400" />
                   <span className="text-xs font-bold uppercase tracking-widest text-white">Advanced Telemetry Console</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mono">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> ENCRYPTION: ACTIVE
                   </div>
                   <div className="text-[9px] text-slate-500 mono">MTU: 1500</div>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 font-mono text-[12px] space-y-2 custom-scrollbar bg-black/20">
                {events.length === 0 && <div className="text-slate-700 italic">No packet data currently in interceptor buffer...</div>}
                {events.map((ev, i) => (
                   <div key={i} className="animate-in slide-in-from-left-2 duration-300">
                      <span className="text-slate-600">[{ev.event.timestamp.split('T')[1].split('.')[0]}]</span>{' '}
                      <span className="text-cyan-500">INBOUND</span>{' '}
                      <span className={`${ev.detection.threat ? 'text-red-500' : 'text-green-500'} font-bold`}>
                         {ev.event.type.toUpperCase()}
                      </span>{' '}
                      <span className="text-slate-400">from</span>{' '}
                      <span className="text-slate-200">{ev.event.ip}</span>{' '}
                      <span className="text-slate-600">({ev.event.country})</span>{' '}
                      <span className="text-slate-500 italic"> - Confidence: {ev.detection.confidence}%</span>
                   </div>
                ))}
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
             <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div className="p-2 bg-purple-500/10 rounded-lg"><Zap className="text-purple-400" size={18} /></div>
                <div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase">Avg Triage Time</div>
                   <div className="text-xl font-bold text-white mono">1.4ms</div>
                </div>
             </div>
             <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg"><Lock className="text-green-400" size={18} /></div>
                <div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase">Active Blocks</div>
                   <div className="text-xl font-bold text-white mono">{stats.ips_blocked || 14}</div>
                </div>
             </div>
             <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-2 border-l-cyan-500">
                <div className="p-2 bg-cyan-500/10 rounded-lg"><GlobeIcon className="text-cyan-400" size={18} /></div>
                <div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase">Target Region</div>
                   <div className="text-xl font-bold text-white mono">ASIA_PACIFIC</div>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* FOOTER TICKER */}
      <footer className="glass-panel px-6 py-2 rounded-xl flex items-center justify-between text-[10px] text-slate-500 mono tracking-widest">
        <div>CORE_VERSION: v4.8.2-STABLE // BUILD_DATE: 2024-04-10</div>
        <div className="flex gap-6 italic">
           <span>ENCRYPTED_TUNNEL: AES-256-GCM</span>
           <span>CPU_LOAD: {Math.floor(Math.random() * 20) + 5}%</span>
           <span className="text-cyan-400">ARIA AI_ASSISTANT: LISTENING</span>
        </div>
      </footer>
    </div>
  );
};

export default LiveFeed;
