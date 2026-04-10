import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ChevronRight, Activity, Zap } from 'lucide-react';
import api, { loginUser } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('admin@cyber.com');
  const [password, setPassword] = useState('cyberwar123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegister) {
        await api.post('/auth/register', { username, password });
        setSuccess('Neural Provisioning Success. Authenticators Loaded.');
        setTimeout(() => {
          setIsRegister(false);
          setSuccess('');
        }, 2000);
      } else {
        const { data } = await loginUser(username, password);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('username', username);
        const role = username.includes('admin') ? 'admin' : 'user';
        localStorage.setItem('role', role);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Tactical Node Offline: Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      
      {/* Background Cinematic Elements - Translucent to show global mesh */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-float" />
         <div className="absolute inset-0 bg-transparent" />
      </div>

      <div className="w-full max-w-[480px] z-10 animate-in fade-in zoom-in duration-700">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-10">
           <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center glow-blue mb-6 border border-white/10 group transition-transform duration-500 hover:rotate-12">
              <Shield className="text-white" size={40} />
           </div>
           <h1 className="text-4xl font-black text-white tracking-widest text-center">
              WarRoomX
           </h1>
           <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.5em] mt-2 opacity-60">
              Neural Command Interface // V5.2
           </p>
        </div>

        {/* LOGIN CARD */}
        <div className="premium-card p-10 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30" />
          
          <form onSubmit={handleAction} className="space-y-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{isRegister ? 'Register Email Identity' : 'Authorized Email Vector'}</label>
               <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors text-slate-500 group-focus-within:text-cyan-400">
                    <User size={18} />
                  </div>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                    placeholder="Enter email address..."
                    required
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{isRegister ? 'Create Security Key' : 'Access Protocol'}</label>
               <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors text-slate-500 group-focus-within:text-cyan-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                    placeholder="Input security sequence..."
                    required
                  />
               </div>
            </div>

            {error && (
              <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                 <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ff007f]" />
                 <span className="text-[10px] font-bold text-pink-400 uppercase tracking-tighter">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                 <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">{success}</span>
              </div>
            )}

            <div className="space-y-4">
                <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 px-6 font-black rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl ${isRegister ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' : 'bg-cyan-500 hover:bg-cyan-400 text-[#020617] shadow-[0_0_30px_rgba(0,234,255,0.2)]'}`}
                >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                    {isRegister ? 'CREATE IDENTITY' : 'INITIALIZE SESSION'} <ChevronRight size={18} />
                    </>
                )}
                </button>

                <div 
                    onClick={() => setIsRegister(!isRegister)}
                    className="w-full text-center py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer hover:text-cyan-400 transition-colors"
                >
                    {isRegister ? 'Back to Access Protocol' : 'Request Neural Provisioning (Register)'}
                </div>
            </div>
          </form>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-8 flex justify-between items-center px-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 tracking-widest">
              <Zap size={12} className="text-cyan-500/50" /> NODE_07 ACTIVE
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 tracking-widest">
              SECURE_TLS v1.3 <Activity size={12} className="text-cyan-500/50" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
