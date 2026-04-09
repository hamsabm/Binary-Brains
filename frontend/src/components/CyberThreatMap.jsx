import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Line, OrbitControls, Stars, PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- MATH & COORDINATE UTILS ---
const degToRad = (deg) => (deg * Math.PI) / 180;

const latLngToVector3 = (lat, lng, radius) => {
  const phi = degToRad(90 - lat);
  const theta = degToRad(lng + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// --- COMPONENTS ---

const AttackArc = ({ start, end, color }) => {
    const [progress, setProgress] = useState(0);
    
    // Create a smooth arc (Quadratic Bezier)
    const curve = useMemo(() => {
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const distance = start.distanceTo(end);
        // Elevate the midpoint based on distance to create a parabolic effect
        mid.normalize().multiplyScalar(5 + distance * 0.4); 
        return new THREE.QuadraticBezierCurve3(start, mid, end);
    }, [start, end]);

    const points = useMemo(() => curve.getPoints(60), [curve]);

    useFrame((state, delta) => {
        setProgress(p => (p + delta * 0.6) % 1);
    });

    return (
        <group>
            {/* The Arc Line */}
            <Line
                points={points}
                color={color}
                lineWidth={1.5}
                transparent
                opacity={0.4}
            />
            {/* The Glowing Tip (leading edge) */}
            <mesh position={curve.getPoint(progress)}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial color={color} />
            </mesh>
            {/* Trailing particles / Glow */}
            <mesh position={curve.getPoint(Math.max(0, progress - 0.05))}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
        </group>
    );
};

const Pulse = ({ position, color, scale = 1 }) => {
    const meshRef = useRef();
    useFrame((state) => {
        const s = scale * (1 + (state.clock.elapsedTime % 1) * 2.5);
        if (meshRef.current) {
            meshRef.current.scale.set(s, s, s);
            meshRef.current.material.opacity = 1 - (state.clock.elapsedTime % 1);
        }
    });

    return (
        <mesh ref={meshRef} position={position} lookAt={[0,0,0]}>
            <ringGeometry args={[0, 0.4, 32]} />
            <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
    );
};

const DottedLandmass = ({ radius }) => {
    const [points, setPoints] = useState(null);
    
    useEffect(() => {
        // Fetch real landmass GeoJSON to render ACTUAL countries
        fetch('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/ne_110m_land.json')
            .then(res => res.json())
            .then(data => {
                const landPoints = [];
                // Densly sample points from the GeoJSON polygons
                data.geometries.forEach(geo => {
                    if (geo.type === 'Polygon') {
                        geo.coordinates.forEach(poly => {
                            poly.forEach(([lng, lat]) => {
                                landPoints.push(latLngToVector3(lat, lng, radius));
                            });
                        });
                    } else if (geo.type === 'MultiPolygon') {
                        geo.coordinates.forEach(multi => {
                            multi.forEach(poly => {
                                poly.forEach(([lng, lat]) => {
                                    landPoints.push(latLngToVector3(lat, lng, radius));
                                });
                            });
                        });
                    }
                });
                
                // Add some densification for better visual continents
                const buffer = new Float32Array(landPoints.flatMap(p => [p.x, p.y, p.z]));
                setPoints(buffer);
            });
    }, [radius]);

    if (!points) return null;

    return (
        <Points positions={points}>
            <PointMaterial
                transparent
                color="#334155"
                size={0.06}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.6}
            />
        </Points>
    );
};

const CyberThreatMap = ({ attacks = [] }) => {
    // SOC Location (e.g., London or Bangalore)
    const TARGET_COORDS = [12.9716, 77.5946]; 
    const targetPos = useMemo(() => latLngToVector3(TARGET_COORDS[0], TARGET_COORDS[1], 5), []);

    const activeAttacks = useMemo(() => {
        return (attacks || []).slice(-15).map(a => {
            const base = a.event || a.attack || a.log || a;
            let lat = Number(base.lat);
            let lng = Number(base.lng);
            
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            
            return {
                id: a.log_id || Math.random(),
                start: latLngToVector3(lat, lng, 5),
                end: targetPos,
                type: base.attack_type,
                color: base.attack_type === 'sql_injection' ? '#ff3366' : 
                       base.attack_type === 'brute_force' ? '#f59e0b' : '#38bdf8'
            };
        }).filter(Boolean);
    }, [attacks, targetPos]);

    return (
        <div style={{ 
            height: '650px', 
            width: '100%', 
            background: 'radial-gradient(circle at center, #0a1120 0%, #020617 100%)', 
            borderRadius: '20px', 
            overflow: 'hidden', 
            position: 'relative', 
            border: '1px solid #1e293b',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)'
        }}>
            {/* UI HUD Overlay */}
            <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div className="pulse-red" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: '800', letterSpacing: '1px' }}>GLOBAL THREAT INTERCEPTOR</h3>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                    STATUS: ACTIVE ENGINE v4.2 // SCANNING GLOBAL PERIMETER...
                </div>
            </div>

            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, textAlign: 'right' }}>
                <div style={{ color: '#38bdf8', fontSize: '24px', fontWeight: '900', fontFamily: 'monospace' }}>{activeAttacks.length}</div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Active Vectors</div>
            </div>

            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={45} />
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                <Suspense fallback={null}>
                    {/* The Globe Core */}
                    <mesh>
                        <sphereGeometry args={[4.9, 64, 64]} />
                        <meshBasicMaterial color="#020617" transparent opacity={0.6} />
                    </mesh>

                    {/* True Country Outlines (Dotted) */}
                    <DottedLandmass radius={5.02} />
                    
                    {/* Atmospheric Glow */}
                    <mesh>
                        <sphereGeometry args={[5.2, 64, 64]} />
                        <meshBasicMaterial color="#38bdf8" transparent opacity={0.03} side={THREE.BackSide} />
                    </mesh>

                    {/* Active Attack Visuals */}
                    {activeAttacks.map((attack) => (
                        <group key={attack.id}>
                            <AttackArc start={attack.start} end={attack.end} color={attack.color} />
                            <Pulse position={attack.start} color={attack.color} />
                        </group>
                    ))}
                    
                    {/* Target/SOC Pulse */}
                    <Pulse position={targetPos} color="#38bdf8" scale={1.5} />
                </Suspense>

                <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={1.5} />
                
                <OrbitControls 
                    enablePan={false} 
                    enableZoom={true} 
                    minDistance={8} 
                    maxDistance={25}
                    autoRotate={true}
                    autoRotateSpeed={0.4}
                />
            </Canvas>

            {/* Tactical Legend */}
            <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 10, display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#ff3366', borderRadius: '2px', boxShadow: '0 0 10px #ff3366' }} />
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>SQL INJECTION</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px', boxShadow: '0 0 10px #f59e0b' }} />
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>BRUTE FORCE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#38bdf8', borderRadius: '2px', boxShadow: '0 0 10px #38bdf8' }} />
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>PORT SCAN</span>
                </div>
            </div>

            {/* Background Grid Info */}
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 10, color: '#334155', fontSize: '9px', fontFamily: 'monospace' }}>
                GEO_COORD_LAT: {TARGET_COORDS[0]} | GEO_COORD_LNG: {TARGET_COORDS[1]} <br/>
                SATELLITE_LINK: ESTABLISHED (SEC_LAYER_7)
            </div>
        </div>
    );
};

// Wrapper with Suspense to prevent "Suspense is not defined" error
import { Suspense } from 'react';

export default CyberThreatMap;
