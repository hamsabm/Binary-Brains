import React, { useState, useEffect, useCallback } from 'react';
import { simApi, dashboardApi } from '../api';
import CyberGlobe from '../components/CyberGlobe';
import StatsPanel from '../components/StatsPanel';
import AriaChat from '../components/AriaChat';
import { Shield, Play, Square, RotateCcw, Activity, Bell } from 'lucide-react';

const DashboardPage = () => {
  const [role] = useState(localStorage.getItem('role'));
  const [user] = useState(localStorage.getItem('user'));
  const [simStatus, setSimStatus] = useState('STOPPED');
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [activeAttacks, setActiveAttacks] = useState([]);
  const [lastAttack, setLastAttack] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await dashboardApi.getStats();
      setStats(data);
      const logData = await dashboardApi.getLogs();
      setLogs(logData.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8001/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.log) {
        setLastAttack(data);
        setActiveAttacks(prev => [data.log, ...prev.slice(0, 9)]);
        setLogs(prev => [
            {
                id: data.log.id,
                timestamp: data.log.timestamp,
                source_ip: data.log.source_ip,
                attack_type: data.log.attack_type,
                country: data.log.country,
                confidence_score: data.detection.confidence_score,
                action: data.response.action,
                explanation: data.ai_explanation
            },
            ...prev.slice(0, 49)
        ]);
        
        // Trigger visual flash
        document.getElementById('threat-overlay').classList.add('flash-red');
        setTimeout(() => document.getElementById('threat-overlay').classList.remove('flash-red'), 500);
      }
    };
    return () => ws.close();
  }, []);

  const handleSimAction = async (action) => {
    try {
      if (action === 'start') await simApi.start();
      if (action === 'stop') await simApi.stop();
      if (action === 'reset') await simApi.reset();
      const { data } = await simApi.getStatus();
      setSimStatus(data.status);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '15px', gap: '15px', position: 'relative' }}>
      <div id="threat-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1000, transition: 'background 0.3s' }}></div>
      
      {/* Header */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', minHeight: '70px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Shield size={32} color="var(--accent-primary)" className="pulse-glow" />
          <div>
            <h1 className="cyber-font" style={{ fontSize: '1.2rem', margin: 0 }}>AI Cyber War Room</h1>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>OPERATOR: {user} | NODE_ID: SOC-01</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: simStatus === 'RUNNING' ? 'var(--success)' : 'var(--danger)' }}></div>
            <span className="cyber-font" style={{ fontSize: '0.8rem' }}>{simStatus}</span>
          </div>
          
          {role === 'admin' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-cyber" onClick={() => handleSimAction('start')}><Play size={14} /></button>
              <button className="btn-cyber btn-danger" onClick={() => handleSimAction('stop')}><Square size={14} /></button>
              <button className="btn-cyber" onClick={() => handleSimAction('reset')}><RotateCcw size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr 350px', flex: 1, gap: '15px' }}>
        
        {/* Left Column: Stats & Log Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <StatsPanel stats={stats} />
          
          <div className="glass-panel" style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
            <h3 className="cyber-font" style={{ fontSize: '0.8rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} /> LIVE THREAT FEED
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeAttacks.map((attack, i) => (
                <div key={i} className="glass-panel" style={{ padding: '10px', fontSize: '0.7rem', borderLeft: '3px solid var(--danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>{attack.attack_type}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(attack.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>FROM: {attack.source_ip} ({attack.country})</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Globe & AI Explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <CyberGlobe attacks={activeAttacks} />
          
          <div className="glass-panel" style={{ flex: 1, padding: '20px', position: 'relative' }}>
            <h3 className="cyber-font" style={{ fontSize: '0.9rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={16} /> AI THREAT ANALYSIS
            </h3>
            {lastAttack ? (
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, padding: '10px', background: 'rgba(255,42,109,0.1)', border: '1px solid var(--danger)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>THREAT LEVEL</div>
                    <div className="cyber-font" style={{ color: 'var(--danger)' }}>{lastAttack.detection.confidence_score}% CONFIDENCE</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', background: 'rgba(5,255,176,0.1)', border: '1px solid var(--success)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>PROTOCOL ACTION</div>
                    <div className="cyber-font" style={{ color: 'var(--success)' }}>{lastAttack.response.action}</div>
                  </div>
                </div>
                <div style={{ lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {lastAttack.ai_explanation}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                Awaiting simulation start... All systems nominal.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: ARIA Chat */}
        <AriaChat />
      </div>

      {/* Bottom Row: Detailed Logs */}
      <div className="glass-panel" style={{ height: '200px', padding: '15px', overflow: 'hidden' }}>
        <h3 className="cyber-font" style={{ fontSize: '0.8rem', marginBottom: '10px' }}>Audit Log Journal</h3>
        <div style={{ height: 'calc(100% - 30px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.7rem', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--accent-primary)', borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ padding: '8px' }}>TIMESTAMP</th>
                <th>ATTACK</th>
                <th>SOURCE_IP</th>
                <th>COUNTRY</th>
                <th>CONFIDENCE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ color: 'var(--danger)' }}>{log.attack_type}</td>
                  <td>{log.source_ip}</td>
                  <td>{log.country}</td>
                  <td>{log.confidence_score}%</td>
                  <td style={{ color: log.action === 'BLOCK' ? 'var(--danger)' : 'var(--warning)' }}>{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .flash-red {
          background: rgba(255, 42, 109, 0.2);
          box-shadow: inset 0 0 100px rgba(255, 42, 109, 0.5);
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
