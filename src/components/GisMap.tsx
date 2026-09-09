import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  Radio, 
  Info, 
  Maximize2, 
  Plus, 
  Minus, 
  Crosshair, 
  CloudRain, 
  Droplets,
  Activity,
  Compass
} from 'lucide-react';
import { SensorNode, EvacuationSafeZone, AlertLevel, PredictionResult } from '../types';

interface GisMapProps {
  sensors: SensorNode[];
  safeZones: EvacuationSafeZone[];
  alertLevel: AlertLevel;
  prediction: PredictionResult;
  selectedSensor: SensorNode | null;
  onSelectSensor: (sensor: SensorNode | null) => void;
}

export const GisMap: React.FC<GisMapProps> = ({
  sensors,
  safeZones,
  alertLevel,
  prediction,
  selectedSensor,
  onSelectSensor,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showInundationPlume, setShowInundationPlume] = useState<boolean>(true);
  const [showElevationContours, setShowElevationContours] = useState<boolean>(true);
  const [showEvacuationRoutes, setShowEvacuationRoutes] = useState<boolean>(true);
  const [showGeofenceRadius, setShowGeofenceRadius] = useState<boolean>(true);
  const [selectedShelter, setSelectedShelter] = useState<EvacuationSafeZone | null>(null);

  // Map coordinate bounds to SVG viewBox (13.040 to 13.120 Lat, 80.220 to 80.295 Lng)
  const minLat = 13.035;
  const maxLat = 13.125;
  const minLng = 80.220;
  const maxLng = 80.295;

  const latToY = (lat: number) => {
    const norm = (maxLat - lat) / (maxLat - minLat);
    return norm * 480 + 30; // padding
  };

  const lngToX = (lng: number) => {
    const norm = (lng - minLng) / (maxLng - minLng);
    return norm * 780 + 30;
  };

  // Coordinates for main river and tributary curves
  const riverPoints = [
    { lat: 13.120, lng: 80.228 },
    { lat: 13.105, lng: 80.240 },
    { lat: 13.095, lng: 80.250 },
    { lat: 13.0827, lng: 80.2707 }, // WL-01 Upstream Gorge
    { lat: 13.0720, lng: 80.2620 },
    { lat: 13.0645, lng: 80.2520 }, // WL-02 Mid Causeway
    { lat: 13.0550, lng: 80.2460 },
    { lat: 13.0489, lng: 80.2415 }, // WL-03 Lowland Canal
    { lat: 13.0400, lng: 80.2400 }, // Sea / Estuary Outfall
  ];

  const riverSvgPath = riverPoints.reduce((acc, pt, idx) => {
    const x = lngToX(pt.lng);
    const y = latToY(pt.lat);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Dynamic Inundation plume SVG polygon (widens significantly when alertLevel === DANGER)
  const plumeExpansion = alertLevel === 'DANGER' ? 38 : alertLevel === 'WARNING' ? 18 : 6;
  const plumeOpacity = alertLevel === 'DANGER' ? 0.65 : alertLevel === 'WARNING' ? 0.35 : 0.12;
  const plumeColor = alertLevel === 'DANGER' ? '#ef4444' : alertLevel === 'WARNING' ? '#f59e0b' : '#06b6d4';

  const getSensorColor = (s: SensorNode) => {
    if (s.status === 'critical' || s.currentValue >= s.thresholdDanger) return '#ef4444';
    if (s.status === 'warning' || s.currentValue >= s.thresholdWarning) return '#f59e0b';
    if (s.status === 'degraded') return '#a855f7';
    if (s.status === 'offline') return '#64748b';
    return '#10b981';
  };

  return (
    <div id="gis-inundation-map-container" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Map Header Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                GIS Inundation & GPS Telemetry Grid
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 font-mono border border-slate-700">
                WGS-84 • 10s Real-Time Polling
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Catchment: Adyar-Kaveri River Valley • Inundation Area: {prediction.inundationAreaSqKm} km²
            </p>
          </div>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <button
            id="toggle-inundation-plume-btn"
            onClick={() => setShowInundationPlume(!showInundationPlume)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              showInundationPlume 
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🌊 Flood Plume
          </button>
          <button
            id="toggle-elevation-contours-btn"
            onClick={() => setShowElevationContours(!showElevationContours)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              showElevationContours 
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            ⛰️ Elevation DEM
          </button>
          <button
            id="toggle-evacuation-routes-btn"
            onClick={() => setShowEvacuationRoutes(!showEvacuationRoutes)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              showEvacuationRoutes 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🏃 Evacuation Routes
          </button>
          <button
            id="toggle-geofence-radius-btn"
            onClick={() => setShowGeofenceRadius(!showGeofenceRadius)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              showGeofenceRadius 
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            📡 Geo-Fenced Alert
          </button>
        </div>
      </div>

      {/* Map Display Canvas */}
      <div className="relative w-full aspect-[16/9] min-h-[420px] max-h-[560px] bg-slate-950 overflow-hidden flex items-center justify-center select-none">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <svg 
          viewBox="0 0 840 540" 
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Flood gradient */}
            <linearGradient id="floodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={plumeColor} stopOpacity={plumeOpacity} />
              <stop offset="100%" stopColor={plumeColor} stopOpacity={plumeOpacity * 0.4} />
            </linearGradient>

            {/* River flow animated pattern */}
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Elevation Contours (Topographical lines) */}
          {showElevationContours && (
            <g className="elevation-contours opacity-40">
              {/* Highland Ridge: 65m AMSL */}
              <path
                d="M 60 40 Q 240 70 420 50 T 780 40"
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="6,4"
              />
              <text x="80" y="36" fill="#818cf8" fontSize="10" fontFamily="monospace">65m Ridge (High Ground Watershed)</text>

              {/* Intermediate Contour: 40m AMSL */}
              <path
                d="M 50 180 Q 280 160 500 190 T 790 170"
                fill="none"
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text x="80" y="174" fill="#818cf8" fontSize="10" fontFamily="monospace">40m Plateau (Safe Evacuation Elevation)</text>

              {/* Valley Lowland Contour: 15m AMSL */}
              <path
                d="M 80 340 Q 320 310 520 350 T 800 320"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1"
                strokeDasharray="2,3"
              />
              <text x="120" y="335" fill="#38bdf8" fontSize="10" fontFamily="monospace">15m Lowland Contour (Flood Inundation Risk Tier)</text>

              {/* Critical River Channel Floodplain: 8m AMSL */}
              <path
                d="M 100 420 Q 340 390 540 430 T 780 400"
                fill="none"
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="2,4"
              />
              <text x="140" y="415" fill="#f87171" fontSize="10" fontFamily="monospace">8m Valley Floodplain (Imminent Inundation Zone)</text>
            </g>
          )}

          {/* Geo-Fenced Emergency Broadcast Perimeter */}
          {showGeofenceRadius && alertLevel !== 'NORMAL' && (
            <g className="geofence-polygon">
              <circle
                cx={lngToX(80.2470)}
                cy={latToY(13.0560)}
                r="135"
                fill="none"
                stroke={alertLevel === 'DANGER' ? '#ef4444' : '#f59e0b'}
                strokeWidth="1.8"
                strokeDasharray="5,5"
                className="animate-[spin_40s_linear_infinite]"
              />
              <circle
                cx={lngToX(80.2470)}
                cy={latToY(13.0560)}
                r="135"
                fill={alertLevel === 'DANGER' ? '#ef4444' : '#f59e0b'}
                fillOpacity="0.06"
              />
              <text 
                x={lngToX(80.2470) - 100} 
                y={latToY(13.0560) - 142} 
                fill={alertLevel === 'DANGER' ? '#fca5a5' : '#fde68a'} 
                fontSize="10" 
                fontFamily="monospace"
                fontWeight="bold"
              >
                📡 ACTIVE GEO-FENCE (Cell-Broadcast / SMS Alert Zone)
              </text>
            </g>
          )}

          {/* Dynamic Inundation Flood Plume along river */}
          {showInundationPlume && (
            <g className="inundation-plume">
              <path
                d={`
                  M ${lngToX(80.228) - plumeExpansion} ${latToY(13.120)}
                  Q ${lngToX(80.240) - plumeExpansion * 1.5} ${latToY(13.105)} ${lngToX(80.250) - plumeExpansion * 1.2} ${latToY(13.095)}
                  Q ${lngToX(80.2707) - plumeExpansion * 1.8} ${latToY(13.0827)} ${lngToX(80.2620) - plumeExpansion * 2.2} ${latToY(13.0720)}
                  Q ${lngToX(80.2520) - plumeExpansion * 2.5} ${latToY(13.0645)} ${lngToX(80.2460) - plumeExpansion * 2.8} ${latToY(13.0550)}
                  Q ${lngToX(80.2415) - plumeExpansion * 3.0} ${latToY(13.0489)} ${lngToX(80.2400) - plumeExpansion * 2.0} ${latToY(13.0400)}
                  L ${lngToX(80.2400) + plumeExpansion * 2.0} ${latToY(13.0400)}
                  Q ${lngToX(80.2415) + plumeExpansion * 3.0} ${latToY(13.0489)} ${lngToX(80.2460) + plumeExpansion * 2.8} ${latToY(13.0550)}
                  Q ${lngToX(80.2520) + plumeExpansion * 2.5} ${latToY(13.0645)} ${lngToX(80.2620) + plumeExpansion * 2.2} ${latToY(13.0720)}
                  Q ${lngToX(80.2707) + plumeExpansion * 1.8} ${latToY(13.0827)} ${lngToX(80.250) + plumeExpansion * 1.2} ${latToY(13.095)}
                  Q ${lngToX(80.240) + plumeExpansion * 1.5} ${latToY(13.105)} ${lngToX(80.228) + plumeExpansion} ${latToY(13.120)}
                  Z
                `}
                fill="url(#floodGradient)"
                stroke={plumeColor}
                strokeWidth={alertLevel === 'DANGER' ? 2 : 1}
                filter="url(#glow)"
              />
            </g>
          )}

          {/* River Hydrographic Vector Channel */}
          <path
            d={riverSvgPath}
            fill="none"
            stroke="url(#riverGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner flow centerline */}
          <path
            d={riverSvgPath}
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="1.5"
            strokeDasharray="8,6"
            className="animate-[dash_2s_linear_infinite]"
          />

          {/* Designated Evacuation Route Lines (Direct arrows to shelters on high ground) */}
          {showEvacuationRoutes && (
            <g className="evacuation-routes">
              {/* Route 1: From Lowland Canal (WL-03) to Shelter A (Highland Community Center) */}
              <line
                x1={lngToX(80.2415)}
                y1={latToY(13.0489)}
                x2={lngToX(80.2350)}
                y2={latToY(13.0780)}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />
              <circle cx={(lngToX(80.2415) + lngToX(80.2350)) / 2} cy={(latToY(13.0489) + latToY(13.0780)) / 2} r="3" fill="#10b981" />

              {/* Route 2: From Causeway Bridge (WL-02) to Stadium Shelter B */}
              <line
                x1={lngToX(80.2520)}
                y1={latToY(13.0645)}
                x2={lngToX(80.2550)}
                y2={latToY(13.0910)}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />

              {/* Route 3: From Floodplain (SM-01) to Civic Shelter C */}
              <line
                x1={lngToX(80.2470)}
                y1={latToY(13.0530)}
                x2={lngToX(80.2650)}
                y2={latToY(13.0410)}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />
            </g>
          )}

          {/* Safe Evacuation Shelters */}
          {safeZones.map((sz) => {
            const sx = lngToX(sz.lng);
            const sy = latToY(sz.lat);
            const isSelected = selectedShelter?.id === sz.id;

            return (
              <g 
                key={sz.id} 
                className="cursor-pointer group"
                onClick={() => setSelectedShelter(sz)}
              >
                {/* Shelter Shield Marker */}
                <circle cx={sx} cy={sy} r={isSelected ? 16 : 13} fill="#065f46" stroke="#34d399" strokeWidth="2.5" />
                <text x={sx} y={sy + 4} textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="bold">
                  S
                </text>
                {/* Label */}
                <rect 
                  x={sx - 55} 
                  y={sy - 28} 
                  width="110" 
                  height="16" 
                  rx="4" 
                  fill="#064e3b" 
                  fillOpacity="0.9" 
                  stroke="#10b981" 
                  strokeWidth="0.8" 
                />
                <text x={sx} y={sy - 16} textAnchor="middle" fill="#d1fae5" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
                  {sz.name.slice(0, 18)}... ({sz.elevationMeters}m)
                </text>
              </g>
            );
          })}

          {/* IoT Sensor Nodes */}
          {sensors.map((s) => {
            const sx = lngToX(s.location.lng);
            const sy = latToY(s.location.lat);
            const isSelected = selectedSensor?.id === s.id;
            const color = getSensorColor(s);

            return (
              <g
                key={s.id}
                className="cursor-pointer group"
                onClick={() => onSelectSensor(s)}
              >
                {/* Ripple ring for active/warning sensors */}
                {(s.status === 'critical' || s.status === 'warning') && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r={isSelected ? 26 : 20}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Outer ring */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={isSelected ? 14 : 11}
                  fill="#0f172a"
                  stroke={color}
                  strokeWidth={isSelected ? 3.5 : 2}
                  filter="url(#glow)"
                />

                {/* Inner dot */}
                <circle cx={sx} cy={sy} r="4" fill={color} />

                {/* Sensor ID Tag & Live Value Badge */}
                <g transform={`translate(${sx + 14}, ${sy - 10})`}>
                  <rect
                    x="0"
                    y="0"
                    width="68"
                    height="20"
                    rx="5"
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth="1"
                    fillOpacity="0.95"
                  />
                  <text x="5" y="13" fill="#f8fafc" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    {s.id}: {s.currentValue}{s.unit}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Zoom & Map Controls */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md">
          <button
            id="map-zoom-in-btn"
            onClick={() => setZoomLevel(prev => Math.min(2.2, prev + 0.2))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm font-bold"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-out-btn"
            onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm font-bold"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-reset-btn"
            onClick={() => setZoomLevel(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs"
            title="Reset Map View"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Map Legend (Bottom Left) */}
        <div className="absolute left-4 bottom-4 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md text-[11px] text-slate-300 flex flex-col gap-1.5 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Map Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Normal Sensor (Safe)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Warning Level Sensor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>Danger Stage Threshold</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-300" />
            <span>Designated Safe High Shelter (S)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-emerald-400 border-dashed border-t" />
            <span>Evacuation Corridor</span>
          </div>
        </div>
      </div>

      {/* Selected Sensor / Shelter Inspector Drawer */}
      {(selectedSensor || selectedShelter) && (
        <div className="bg-slate-800/90 border-t border-slate-700 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          {selectedSensor && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                {selectedSensor.type === 'water_level' ? <Droplets className="w-5 h-5" /> :
                 selectedSensor.type === 'rainfall' ? <CloudRain className="w-5 h-5" /> :
                 <Activity className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{selectedSensor.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                    ID: {selectedSensor.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedSensor.status === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    selectedSensor.status === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {selectedSensor.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-slate-400 font-mono text-[11px]">
                  <span>Elevation: <strong className="text-slate-200">{selectedSensor.location.elevationMeters}m AMSL</strong></span>
                  <span>Danger Limit: <strong className="text-red-300">{selectedSensor.thresholdDanger}{selectedSensor.unit}</strong></span>
                  <span>Battery: <strong className="text-emerald-300">{selectedSensor.batteryPercent}%</strong></span>
                  <span>LoRa: <strong className="text-slate-200">{selectedSensor.signalStrengthDbm} dBm</strong></span>
                </div>
              </div>
            </div>
          )}

          {selectedShelter && !selectedSensor && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{selectedShelter.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200">
                    High Ground Elevation: {selectedShelter.elevationMeters}m
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-slate-400 text-[11px]">
                  <span>Capacity: <strong className="text-emerald-300">{selectedShelter.capacity} evacuees</strong></span>
                  <span>Occupancy: <strong className="text-slate-200">{selectedShelter.currentOccupancy}</strong></span>
                  <span>Helpline: <strong className="text-cyan-300">{selectedShelter.contactPhone}</strong></span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onSelectSensor(null);
              setSelectedShelter(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold shrink-0"
          >
            Close Inspector
          </button>
        </div>
      )}
    </div>
  );
};
