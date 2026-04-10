import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#ff2a6d', '#f2ff00', '#05ffb0', '#00f2ff'];

const StatsPanel = ({ stats }) => {
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h3 className="cyber-font" style={{ fontSize: '1rem', marginBottom: '20px' }}>System Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>TOTAL THREATS</div>
          <div className="cyber-font" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{stats.total_threats || 0}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>ACTIVE BLOCKS</div>
          <div className="cyber-font" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{stats.active_blocks || 0}</div>
        </div>
      </div>
      
      <div style={{ height: '150px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats.threat_distribution || []}
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {(stats.threat_distribution || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--accent-primary)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        THREAT DISTRIBUTION BY TYPE
      </div>
    </div>
  );
};

export default StatsPanel;
