import React, { useState, useEffect, useRef } from 'react';
import { postChat } from '../api';

const BG_MAIN = "#070b14";
const BG_CARD = "#0b1220";
const BG_CARD2 = "#121f34";
const GREEN = "#22d3ee";
const RED = "#ff3366";
const TEXT = "#dbeafe";
const MUTED = "#94a3b8";
const BORDER = "#1e293b";

const Assistant = () => {
  const [messages, setMessages] = useState([
    {
        role: "aria", 
        text: "ARIA online. All systems nominal. I have access to live threat data from this war room. Ask me anything about the current attack landscape, defence strategies, or specific threats.", 
        timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customInput = null) => {
    const messageText = customInput || input;
    if (!messageText.trim() || loading) return;

    const userMsg = { role: "user", text: messageText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await postChat(messageText, true);
      setMessages(prev => [...prev, { role: "aria", text: data.reply, timestamp: new Date().toISOString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "aria", text: "ARIA offline. Please retry.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    "What's happening right now?",
    "How do I stop brute force attacks?",
    "Explain SQL injection",
    "What is MITRE ATT&CK?",
    "Give me an incident response runbook"
  ];

  const quickActionStyle = {
    background: "linear-gradient(135deg, rgba(11,18,32,.95), rgba(18,31,52,.86))",
    border: `1px solid ${BORDER}`,
    color: MUTED,
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s"
  };

  return (
    <div style={{ color: TEXT, display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", maxWidth: "1100px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px", padding: "12px 14px", border: `1px solid ${BORDER}`, borderRadius: "12px", background: "linear-gradient(135deg, rgba(11,18,32,.95), rgba(18,31,52,.86))", boxShadow: "0 0 20px rgba(34,211,238,.08)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: GREEN }}>ARIA // CYBER INTELLIGENCE CONSOLE</h2>
        <p style={{ fontSize: "12px", color: MUTED, margin: "4px 0 0 0" }}>SOC Copilot for Threat Hunting, Detection, and Response Strategy</p>
      </header>

      {/* QUICK ACTIONS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {quickActions.map((action, i) => (
          <button 
            key={i} 
            style={quickActionStyle}
            onClick={() => handleSend(action)}
            onMouseEnter={(e) => { e.target.style.borderColor = GREEN; e.target.style.color = GREEN; }}
            onMouseLeave={(e) => { e.target.style.borderColor = BORDER; e.target.style.color = MUTED; }}
          >
            {action}
          </button>
        ))}
      </div>

      {/* CHAT WINDOW */}
      <div 
        ref={chatWindowRef}
        style={{
          flex: 1,
          overflowY: "auto",
          background: "linear-gradient(180deg, rgba(11,18,32,.95), rgba(7,11,20,.95))",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "12px",
          border: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          scrollbarWidth: "thin",
          scrollbarColor: `${BG_CARD2} ${BG_CARD}`
        }}
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            style={{ 
                display: "flex", 
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: "12px"
            }}
          >
            {/* Avatar */}
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: msg.role === "user" ? BG_MAIN : BG_CARD2,
              border: msg.role === "user" ? `1px solid ${BORDER}` : "none",
              fontSize: "10px",
              fontWeight: "bold",
              color: msg.role === "user" ? MUTED : GREEN
            }}>
                {msg.role === "user" ? "YOU" : "AI"}
            </div>

            <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                    backgroundColor: msg.role === "user" ? BG_MAIN : BG_CARD2,
                    border: msg.role === "user" ? `1px solid ${BORDER}` : "none",
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    fontSize: "14px",
                    color: TEXT,
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap"
                }}>
                    {msg.text}
                </div>
                <div style={{ marginTop: "6px", fontSize: "10px", color: MUTED }}>
                    <span style={{ color: msg.role === "aria" ? GREEN : MUTED, fontWeight: "bold", marginRight: "6px" }}>
                        {msg.role === "aria" ? "ARIA" : "OFFICER"}
                    </span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: "6px", padding: "10px" }}>
            {[0, 1, 2].map(dot => (
              <div key={dot} style={{
                width: "8px", height: "8px", borderRadius: "50%", backgroundColor: MUTED,
                animation: "aria-pulse 1s infinite", animationDelay: `${dot * 0.2}s`
              }} />
            ))}
            <style>{`
              @keyframes aria-pulse {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.1); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* INPUT BAR */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input 
          style={{
            flex: 1,
            background: "linear-gradient(135deg, rgba(11,18,32,.95), rgba(18,31,52,.86))",
            border: `1px solid ${BORDER}`,
            color: "white",
            padding: "14px 18px",
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none"
          }}
          placeholder="Ask ARIA about current threats..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
          }}
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading}
          style={{
            backgroundColor: loading ? BG_CARD2 : GREEN,
            color: loading ? MUTED : "#020617",
            border: "none",
            padding: "0 24px",
            borderRadius: "8px",
            cursor: loading ? "default" : "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s"
          }}
        >
          {loading ? "..." : "SEND"}
        </button>
      </div>
    </div>
  );
};

export default Assistant;
