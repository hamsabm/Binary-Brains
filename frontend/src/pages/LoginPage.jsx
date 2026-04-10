import React, { useState } from 'react';
import { authApi } from '../api';
import { Shield, Lock, Mail } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await authApi.register(email, password);
        setIsRegister(false);
        setError('Account created! Please login.');
      } else {
        const data = await authApi.login(email, password);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user', email);
        onLogin(data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle, #0d1117 0%, #05070a 100%)'
    }}>
      <div className="glass-panel" style={{ width: '400px', padding: '40px', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
          <Shield size={60} color="var(--accent-primary)" />
          <div className="scanline" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}></div>
        </div>
        
        <h1 className="cyber-font" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>AI Cyber War Room</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '30px' }}>
          {isRegister ? 'ENROLL NEURAL IDENTITY' : 'RESTRICTED ACCESS TERMINAL'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              placeholder="Email Identity"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', background: '#05070a', border: '1px solid var(--card-border)', padding: '10px 10px 10px 40px', color: 'white', outline: 'none' }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Security Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: '#05070a', border: '1px solid var(--card-border)', padding: '10px 10px 10px 40px', color: 'white', outline: 'none' }}
            />
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</div>}

          <button type="submit" className="btn-cyber" disabled={loading}>
            {loading ? 'PROCESSING...' : (isRegister ? 'CREATE ACCOUNT' : 'ESTABLISH LINK')}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {isRegister ? (
            <span onClick={() => setIsRegister(false)} style={{ cursor: 'pointer', color: 'var(--accent-primary)' }}>Back to Login</span>
          ) : (
            <span onClick={() => setIsRegister(true)} style={{ cursor: 'pointer', color: 'var(--accent-primary)' }}>Create New Identity</span>
          )}
        </div>

        <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.7rem', textAlign: 'left' }}>
          <div style={{ color: 'var(--accent-secondary)', fontWeight: 'bold', marginBottom: '5px' }}>DEMO CREDENTIALS:</div>
          <div>Admin: admin@cyberwarroom.com / Admin@123</div>
          <div>User: user@cyberwarroom.com / User@123</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
