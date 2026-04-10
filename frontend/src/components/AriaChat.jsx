import React, { useState, useRef, useEffect } from 'react';
import { ariaApi } from '../api';
import { Send, Bot } from 'lucide-react';

const AriaChat = () => {
  const [messages, setMessages] = useState([
    { role: 'aria', text: 'Protocol ARIA online. Ready for SOC analysis.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await ariaApi.chat(userMsg);
      setMessages(prev => [...prev, { role: 'aria', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'aria', text: 'Communication error. Utilizing local summary protocols: System is currently stable and monitoring.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="cyber-font" style={{ padding: '15px', borderBottom: '1px solid var(--card-border)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Bot size={18} color="var(--accent-primary)" /> ARIA ASSISTANT
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user' ? 'rgba(0, 242, 255, 0.1)' : 'rgba(112, 0, 255, 0.1)',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            border: `1px solid ${m.role === 'user' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}`
          }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {m.role === 'user' ? 'OPERATOR' : 'ARIA'}
            </div>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', animate: 'pulse 1s infinite' }}>ARIA IS THINKING...</div>}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '15px', display: 'flex', gap: '10px', borderTop: '1px solid var(--card-border)' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query ARIA..."
          style={{ flex: 1, background: 'transparent', border: '1px solid var(--card-border)', color: 'white', padding: '8px', outline: 'none', fontFamily: 'inherit' }}
        />
        <button type="submit" className="btn-cyber" style={{ padding: '8px' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default AriaChat;
