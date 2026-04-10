import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import './ThreatMap.css';

const SERVER_COORDS = [12.9716, 77.5946];

const randomInRange = (min, max) => Math.random() * (max - min) + min;

const normalizeEvent = (payload) => {
  const base = payload?.event || payload?.attack || {};
  const log = payload?.log || {};
  const type = base.type || base.attack_type || log.attack_type || 'unknown';
  let lat = Number(base.lat ?? log.lat);
  let lng = Number(base.lng ?? log.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    lat = randomInRange(-90, 90);
    lng = randomInRange(-180, 180);
  }

  return {
    ip: String(base.ip || log.ip || 'unknown'),
    type,
    timestamp: String(base.timestamp || log.timestamp || new Date().toISOString()),
    lat,
    lng,
    country: String(base.country || log.country || 'Unknown')
  };
};

const markerColor = (type) => {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('sql')) return '#ff3b30';
  if (normalized.includes('brute')) return '#ff9f1c';
  return '#22d3ee';
};

const ThreatMap = ({ attacks = null, stream = true, height = 420 }) => {
  const [socketAttacks, setSocketAttacks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [tileProvider, setTileProvider] = useState('carto-dark');

  console.log('Received attacks:', attacks || socketAttacks);

  useEffect(() => {
    if (!stream || attacks) return undefined;

    const token = localStorage.getItem('access_token');
    if (!token) return undefined;

    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/live?token=${encodeURIComponent(token)}`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        const mapped = normalizeEvent(parsed);
        if (!mapped) return;
        setSocketAttacks((prev) => [...prev.slice(-49), mapped]);
      } catch (_) {
        // Keep the map resilient if malformed websocket packets are received.
      }
    };

    return () => ws.close();
  }, [attacks, stream]);

  useEffect(() => {
    if (attacks && attacks.length === 0) {
      console.warn('ThreatMap: attacks array is empty. Verify websocket/state upstream.');
    }
  }, [attacks]);

  const mappedExternalAttacks = useMemo(() => {
    if (!attacks) return [];
    return attacks
      .map((item) => normalizeEvent(item))
      .filter(Boolean)
      .slice(-50);
  }, [attacks]);

  const safeAttacks = attacks ? mappedExternalAttacks : socketAttacks;
  console.log("Attacks in state:", safeAttacks);

  return (
    <section className="threat-map-panel">
      <header className="threat-map-header">
        <div>
          <h3>Global AI Threat Map</h3>
          <p>Real-time geolocated threat origins across the network perimeter.</p>
        </div>
        <div className={`threat-map-status ${connected || attacks ? 'online' : 'offline'}`}>
          {connected || attacks ? 'LIVE' : 'DISCONNECTED'}
        </div>
      </header>

      <div className="threat-map-shell" style={{ height }}>
        <MapContainer center={[20, 0]} zoom={2} minZoom={2} scrollWheelZoom={true} className="threat-map-canvas">
          <TileLayer
            attribution={
              tileProvider === 'carto-dark'
                ? '&copy; OpenStreetMap contributors &copy; CARTO'
                : '&copy; OpenStreetMap contributors'
            }
            url={
              tileProvider === 'carto-dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
            eventHandlers={{
              tileerror: () => {
                if (tileProvider !== 'osm') {
                  console.warn('ThreatMap: dark tiles failed, switching to OSM fallback');
                  setTileProvider('osm');
                }
              }
            }}
          />

          {safeAttacks
            .filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lng))
            .slice(-50)
            .map((attack, idx) => (
            <React.Fragment key={`${attack.ip}-${attack.timestamp}-${idx}`}>
              <CircleMarker
                center={[attack.lat, attack.lng]}
                radius={8}
                className={`threat-marker ${String(attack.type || '').toLowerCase().includes('sql') ? 'sql' : 'brute'}`}
                pathOptions={{
                  color: markerColor(attack.type),
                  fillColor: markerColor(attack.type),
                  fillOpacity: 0.45,
                  weight: 2
                }}
              >
                <Tooltip direction="top">
                  <div style={{ fontSize: 12 }}>
                    <div><b>IP:</b> {attack.ip}</div>
                    <div><b>Country:</b> {attack.country}</div>
                    <div><b>Type:</b> {attack.type.replace('_', ' ')}</div>
                  </div>
                </Tooltip>
              </CircleMarker>

              <Polyline
                positions={[[attack.lat, attack.lng], SERVER_COORDS]}
                className="threat-path"
                pathOptions={{ color: markerColor(attack.type), weight: 2, opacity: 0.45 }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </section>
  );
};

export default ThreatMap;
