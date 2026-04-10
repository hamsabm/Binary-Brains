import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const SERVER_LOCATION = { lat: 37.7749, lng: -122.4194, name: "SOC Mainframe" }; // SF

const CyberGlobe = ({ attacks }) => {
  const globeRef = useRef();
  const [arcsData, setArcsData] = useState([]);

  useEffect(() => {
    if (attacks && attacks.length > 0) {
      const newArcs = attacks.map(attack => ({
        startLat: attack.latitude,
        startLng: attack.longitude,
        endLat: SERVER_LOCATION.lat,
        endLng: SERVER_LOCATION.lng,
        color: attack.confidence_score > 85 ? '#ff2a6d' : '#f2ff00'
      }));
      setArcsData(prev => [...prev.slice(-20), ...newArcs]);
    }
  }, [attacks]);

  return (
    <div className="glass-panel" style={{ height: '400px', overflow: 'hidden', position: 'relative' }}>
      <div className="cyber-font" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
        Global Threat Visualization
      </div>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        width={500}
        height={400}
        arcsData={arcsData}
        arcColor={'color'}
        arcDashLength={0.4}
        arcDashGap={4}
        arcDashAnimateTime={1000}
        pointsData={[SERVER_LOCATION]}
        pointColor={() => 'var(--accent-primary)'}
        pointAltitude={0.1}
        pointRadius={0.5}
      />
    </div>
  );
};

export default CyberGlobe;
