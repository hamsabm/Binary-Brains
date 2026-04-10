import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveFeed from './pages/LiveFeed';
import Assistant from './pages/Assistant';
import ThreatGlobe from './pages/ThreatGlobe';
import Game from './pages/Game';
import MultiplayerGame from './pages/MultiplayerGame';
import DuelGame from './pages/DuelGame';
import AdminActivity from './pages/AdminActivity';
import { ShieldCheck, Activity, Globe, Target, Cpu, Lock, Swords, Users, Sword, ClipboardList, Zap } from 'lucide-react';

const BG_MAIN = "#050a14";
const BG_CARD = "#0b1220";
const BG_CARD2 = "#121f34";
const BORDER = "#1e293b";
const GREEN = "#22d3ee";
const TEXT = "#dbeafe";

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload?.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch (_) {
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  if (!isTokenValid(token)) {
    localStorage.removeItem("access_token");
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = window.location.pathname;
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="fixed left-0 top-0 h-full w-[260px] premium-glass border-r border-white/5 z-[1000] flex flex-col p-8 transition-all duration-500">
      <div 
        className="text-2xl font-black mb-16 cursor-pointer group flex items-center gap-3"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center glow-blue group-hover:rotate-12 transition-transform duration-500">
           <ShieldCheck className="text-white" size={18} />
        </div>
        <span className="tracking-tighter text-white group-hover:translate-x-1 transition-transform duration-300">WarRoomX</span>
      </div>

      <nav className="flex-1 space-y-6">
        <NavBtn label="Dashboard" to="/dashboard" active={location === '/dashboard'} icon={<Activity size={18}/>} />
        <NavBtn label="Live Stream" to="/live" active={location === '/live'} icon={<Globe size={18}/>} />
        <NavBtn label="Neural Hub" to="/threat-globe" active={location === '/threat-globe'} icon={<Target size={18}/>} />
        <NavBtn label="AI Assistant" to="/assistant" active={location === '/assistant'} icon={<Cpu size={18}/>} />
        
        <div className="pt-6 border-t border-white/5 space-y-4">
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-6">Engagement Deck</span>
           <NavBtn label="Combat: Single" to="/game" active={location === '/game'} icon={<Sword size={18}/>} />
           <NavBtn label="Combat: Duel" to="/game/duel" active={location === '/game/duel'} icon={<Swords size={18}/>} />
           <NavBtn label="Combat: PvP" to="/game/multiplayer" active={location === '/game/multiplayer'} icon={<Users size={18}/>} />
        </div>

        {role === 'admin' && (
          <div className="pt-6 border-t border-white/5 space-y-4">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-6">Governance Hub</span>
            <NavBtn label="Audit Logs" to="/admin/activity" active={location === '/admin/activity'} icon={<ClipboardList size={18}/>} />
          </div>
        )}
      </nav>

      <div className="pt-8 border-t border-white/5">
         <button 
           onClick={handleLogout}
           className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-pink-500 font-black text-xs uppercase tracking-widest hover:bg-pink-500/10 transition-all duration-300"
         >
           <Lock size={16} /> Logout SESSION
         </button>
      </div>
    </div>
  );
};

const NavBtn = ({ label, to, active, icon }) => (
  <Link 
    to={to} 
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-cyan-500/10 text-white shadow-xl border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
  >
    <div className={`${active ? 'text-cyan-400 glow-text' : 'text-slate-500 group-hover:text-cyan-400'} transition-colors`}>{icon}</div>
    <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 glow-blue shadow-[0_0_8px_#22d3ee]" />}
  </Link>
);

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG_MAIN }}>
      <Sidebar />
      <div className="ml-[260px] flex-1 p-8">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* GLOBAL HUD WRAPPERS */}
      <div className="mesh-gradient" />
      <div className="cyber-perspective-grid" />
      <div className="scanline-overlay" />
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/live" element={
          <ProtectedRoute>
            <Layout><LiveFeed /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/assistant" element={
          <ProtectedRoute>
            <Layout><Assistant /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/threat-globe" element={
          <ProtectedRoute>
            <ThreatGlobe />
          </ProtectedRoute>
        } />

        <Route path="/game" element={
          <ProtectedRoute>
            <Game />
          </ProtectedRoute>
        } />

        <Route path="/game/duel" element={
          <ProtectedRoute>
            <DuelGame />
          </ProtectedRoute>
        } />

        <Route path="/game/multiplayer" element={
          <ProtectedRoute>
            <MultiplayerGame />
          </ProtectedRoute>
        } />

        <Route path="/admin/activity" element={
          <ProtectedRoute>
            <Layout><AdminActivity /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
