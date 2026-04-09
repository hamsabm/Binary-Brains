import React, { useEffect, useState, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';

const TARGET_COORDS = { lat: 12.9716, lng: 77.5946, name: 'COMMAND_CENTER_HQ' }; 

const TacticalGlobe = ({ attacks = [], width, height }) => {
  const globeRef = useRef();
  const [arcsData, setArcsData] = useState([]);
  const [ringsData, setRingsData] = useState([]);

  // Transform raw events into visual map data
  useEffect(() => {
    if (!attacks || attacks.length === 0) return;

    const processed = attacks.slice(-30).map((a, idx) => {
      const base = a.event || a.attack || a.log || a;
      const type = (base.attack_type || base.type || 'unknown').toLowerCase();
      
      // Exact color mapping as requested
      let color = '#00eaff'; // CYAN (Port Scan)
      if (type.includes('sql')) color = '#ff3b3b'; // RED 
      if (type.includes('brute')) color = '#ff9f1a'; // ORANGE

      // Ensure we have coordinates, fallback to global randomness if missing
      const startLat = Number(base.lat) || (Math.random() * 140 - 70);
      const startLng = Number(base.lng) || (Math.random() * 300 - 150);

      return {
        id: base.log_id || `attack-${idx}`,
        startLat,
        startLng,
        endLat: TARGET_COORDS.lat,
        endLng: TARGET_COORDS.lng,
        color: [color, color],
        type: type,
        arcAlt: Math.random() * 0.5 + 0.1,
        dashLength: Math.random() * 0.1 + 0.05
      };
    });

    setArcsData(processed);
    
    // Rings for impact at origin
    setRingsData(processed.map(d => ({
      lat: d.startLat,
      lng: d.startLng,
      color: d.color[0],
      maxR: 3,
      propagationSpeed: 1,
      repeatPeriod: 1000
    })));
  }, [attacks]);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enablePan = false;
      controls.minDistance = 220;
      controls.maxDistance = 500;
      
      // Set initial POV
      globeRef.current.pointOfView({ lat: 20, lng: 30, altitude: 2.2 });
    }
  }, []);

  return (
    <div className="w-full h-full relative cursor-move">
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#00eaff"
        atmosphereAltitude={0.2}
        
        // High-end textures
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

        // Arcs Visualization
        arcsData={arcsData}
        arcColor="color"
        arcDashLength="dashLength"
        arcDashGap={1}
        arcDashAnimateTime={1500}
        arcStroke={0.4}
        arcAltitudeAutoScale={0.3}
        
        // Impact Rings
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"

        // HQ Label
        labelsData={[TARGET_COORDS]}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelSize={1.6}
        labelDotRadius={0.6}
        labelColor={() => '#00eaff'}
        labelResolution={3}
        labelIncludeDot={true}

        // Performance
        rendererConfig={{ antialias: true, alpha: true }}
      />
      
      {/* MAP CONTROLS OVERLAY */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 z-10 pointer-events-none">
          <div className="glass-card px-3 py-1 flex items-center justify-between gap-4 border-none bg-black/40">
             <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Perspective</span>
             <span className="text-[10px] mono text-cyan-400">SOC_ORBITAL_V5</span>
          </div>
          <div className="glass-card px-3 py-1 flex items-center justify-between gap-4 border-none bg-black/40">
             <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Resolution</span>
             <span className="text-[10px] mono text-green-400">4K_OPTIMIZED</span>
          </div>
      </div>
    </div>
  );
};

export default TacticalGlobe;
