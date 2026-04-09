import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Terminal, 
  Cpu, 
  Activity, 
  Globe, 
  MessageSquare,
  Lock,
  ChevronRight,
  Zap,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="glass p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all group"
  >
    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="text-cyan-400" size={24} />
    </div>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050a14] text-slate-200 selection:bg-cyan-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-cyan-400" size={24} />
            <span className="font-bold tracking-tighter text-lg text-white">CYBER <span className="text-cyan-400">WAR ROOM</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#intelligence" className="hover:text-cyan-400 transition-colors">Intelligence</a>
            <a href="#ai" className="hover:text-cyan-400 transition-colors">ARIA AI</a>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-full bg-cyan-500 text-[#050a14] font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            Launch Command Center
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-template-columns-[1fr_1.2fr] gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-6">
              <Activity size={14} className="animate-pulse" />
              SYSTEM STATUS: OPERATIONAL
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
              Defend Reality in <br />
              <span className="gradient-text">Real-Time.</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
              Experience the next generation of cybersecurity. AI-driven threat detection, 
              live attack simulations, and autonomous response intelligence integrated into one tactical interface.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 rounded-xl bg-cyan-500 text-[#050a14] font-black hover:scale-105 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                Access War Room <ChevronRight size={20} />
              </button>
              <button className="px-8 py-4 rounded-xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex items-center gap-2">
                View Documentation
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
              <div>
                <div className="text-2xl font-bold text-white">1.2ms</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Triage Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">AI Confidence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Autonomous</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="relative z-10 rounded-2xl border border-white/10 overflow-hidden shadow-2xl float">
                <img 
                    src="/images/hero.png" 
                    alt="Cyber War Room Command Center" 
                    className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050a14] via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6 right-6 glass p-4 rounded-xl border border-white/10 scanline">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">Live Intelligence Stream</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                            <div className="w-4 h-1 rounded-full bg-cyan-400/20" />
                        </div>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300">
                        [SUCCESS] Threat Neutralized: SQLi attempt from 192.168.1.42 <br/>
                        [INFO] ARIA Engine: Analysing traffic patterns in Zone 7...
                    </div>
                </div>
            </div>
            {/* Background Decorations */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">500+</div>
                <div className="text-xs text-slate-500 uppercase tracking-tighter">Attacks Simulated</div>
            </div>
            <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">92%</div>
                <div className="text-xs text-slate-500 uppercase tracking-tighter">Detection Accuracy</div>
            </div>
            <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">0ms</div>
                <div className="text-xs text-slate-500 uppercase tracking-tighter">Response Latency</div>
            </div>
            <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">100%</div>
                <div className="text-xs text-slate-500 uppercase tracking-tighter">Cloud Integrated</div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Tactical Arsenal</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
                Our suite of high-fidelity tools provides complete visibility and control over your digital perimeter.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Terminal} 
              title="Live Attack Stream" 
              description="Monitor incoming threats in real-time with our WebSocket-driven events feed. Visualise the exact payload of every attack."
              delay={0.1}
            />
            <FeatureCard 
              icon={Cpu} 
              title="AI Threat Engine" 
              description="Powered by Claude 3.5, our engine explains complex attacks in plain English and generates recovery runbooks instantly."
              delay={0.2}
            />
            <FeatureCard 
              icon={Globe} 
              title="Global Radar Map" 
              description="Hyper-visualise attack origins on a global scale. See exactly where your adversaries are coming from."
              delay={0.3}
            />
            <FeatureCard 
              icon={Zap} 
              title="Auto-Mitigation" 
              description="Configure ARIA to automatically block malicious IPs or rate-limit suspicious traffic without human intervention."
              delay={0.4}
            />
            <FeatureCard 
              icon={MessageSquare} 
              title="ARIA Assistant" 
              description="Interact with a specialized cybersecurity AI. Ask about attack vectors, defense strategies, or system health."
              delay={0.5}
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Behavioral Analytics" 
              description="Deep-dive into attack patterns with advanced charts. Identify trends before they become full-scale breaches."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto glass p-12 rounded-[2rem] border border-cyan-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to assume command?</h2>
          <p className="text-slate-400 mb-10 text-lg">
            Join the elite operators managing tomorrow's threats. Secure your perimeter with the AI Cyber War Room.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-xl bg-cyan-500 text-[#050a14] font-black hover:scale-105 transition-all shadow-xl shadow-cyan-500/20"
            >
              Start Your Simulation
            </button>
            <button className="px-8 py-4 rounded-xl glass border border-white/10 text-white font-bold hover:bg-white/5 transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <Shield size={16} />
            <span className="font-bold tracking-tighter">CYBER WAR ROOM v1.0.0</span>
        </div>
        <p>&copy; 2026 AI Cyber War Room. All rights reserved. Secure intelligence for the digital age.</p>
      </footer>
    </div>
  );
};

export default Landing;
