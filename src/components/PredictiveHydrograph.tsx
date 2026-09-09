import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Droplets, 
  CloudRain, 
  Gauge, 
  Clock, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { PredictionResult, SensorNode } from '../types';

interface PredictiveHydrographProps {
  prediction: PredictionResult;
  sensors: SensorNode[];
}

export const PredictiveHydrograph: React.FC<PredictiveHydrographProps> = ({
  prediction,
  sensors,
}) => {
  const wlSensors = sensors.filter(s => s.type === 'water_level');
  const rainSensors = sensors.filter(s => s.type === 'rainfall');
  const velocitySensors = sensors.filter(s => s.type === 'flow_velocity');
  const soilSensors = sensors.filter(s => s.type === 'soil_moisture');

  const maxWaterLevel = Math.max(...wlSensors.map(s => s.currentValue), 0);
  const maxRainfall = Math.max(...rainSensors.map(s => s.currentValue), 0);
  const maxVelocity = Math.max(...velocitySensors.map(s => s.currentValue), 0);
  const avgSoilMoisture = soilSensors.reduce((a, b) => a + b.currentValue, 0) / (soilSensors.length || 1);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs font-mono">
          <div className="flex items-center justify-between gap-3 text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
            <span className="font-bold text-white">Time Offset: {label}</span>
            <span className={data.isPredicted ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
              {data.isPredicted ? '🔮 AI/ML Projection' : '📡 Verified Gauge'}
            </span>
          </div>
          <div className="text-slate-200">
            Water Level: <strong className="text-cyan-300 text-sm font-bold">{data.waterLevel} m</strong>
          </div>
          <div className="text-red-400 text-[11px] mt-1">
            Danger Breach Threshold: <strong>{data.dangerLevel} m</strong>
          </div>
          <div className="text-amber-400 text-[11px]">
            Warning Level: <strong>{data.warningLevel} m</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="predictive-hydrograph-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
              Hydrodynamic Wave & 15-Minute Predictive Crest Model
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              Kinematic Wave + AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous rate of rise analysis ($dh/dt$) combined with ground saturation runoff kinetics.
          </p>
        </div>

        {/* 15-Minute Notice Target Validation Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
          prediction.level === 'DANGER'
            ? 'bg-red-950/80 text-red-300 border-red-500/50 animate-pulse'
            : prediction.level === 'WARNING'
            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
        }`}>
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {prediction.estimatedTimeToFloodMinutes !== null
              ? `Estimated Breach Window: ~${prediction.estimatedTimeToFloodMinutes} min`
              : 'Safe Inundation Reserve: >45 min'}
          </span>
        </div>
      </div>

      {/* 4 Real-Time Environmental IoT Metric Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Water Level */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              Peak Water Level
            </span>
            <span className="font-mono text-[10px] text-cyan-400">WL-02 Gauge</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {maxWaterLevel.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-mono">m</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
            <span>Rate of Rise:</span>
            <span className={`font-bold ${prediction.rateOfRiseMetersPerHour > 1.5 ? 'text-red-400' : 'text-emerald-400'}`}>
              +{prediction.rateOfRiseMetersPerHour} m/hr
            </span>
          </div>
        </div>

        {/* Metric 2: Rainfall Intensity */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              Rainfall Intensity
            </span>
            <span className="font-mono text-[10px] text-blue-400">RF-01 Tipping</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {maxRainfall.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-mono">mm/hr</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
            <span>Classification:</span>
            <span className={`font-bold ${maxRainfall > 50 ? 'text-red-400' : maxRainfall > 25 ? 'text-amber-400' : 'text-slate-300'}`}>
              {maxRainfall > 50 ? 'Cloudburst' : maxRainfall > 25 ? 'Heavy Rain' : 'Moderate'}
            </span>
          </div>
        </div>

        {/* Metric 3: Flow Velocity */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              Water Velocity
            </span>
            <span className="font-mono text-[10px] text-indigo-400">FV-01 Doppler</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {maxVelocity.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-mono">m/s</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
            <span>Hydro Kinetic:</span>
            <span className={`font-bold ${maxVelocity > 3.0 ? 'text-red-400' : 'text-slate-300'}`}>
              {maxVelocity > 3.0 ? 'High Shear' : 'Laminar Flow'}
            </span>
          </div>
        </div>

        {/* Metric 4: Soil Saturation */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-amber-400" />
              Soil Saturation
            </span>
            <span className="font-mono text-[10px] text-amber-400">SM-01 Probe</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {avgSoilMoisture.toFixed(0)}%
            </span>
            <span className="text-xs text-slate-400 ml-1 font-mono">volumetric</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
            <span>Surface Runoff:</span>
            <span className={`font-bold ${avgSoilMoisture > 85 ? 'text-red-400' : 'text-emerald-400'}`}>
              {avgSoilMoisture > 85 ? '100% Runoff (Zero Infiltration)' : 'Moderate Infiltration'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Inundation Projection Hydrograph */}
      <div className="w-full h-72 sm:h-80 bg-slate-950/90 rounded-xl p-2 border border-slate-800/80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={prediction.trajectory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="waterLevelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.65} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              domain={[1.0, 8.5]} 
              tickFormatter={(v) => `${v}m`}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Danger Level Reference Line (6.8m) */}
            <ReferenceLine 
              y={6.8} 
              stroke="#ef4444" 
              strokeWidth={2} 
              strokeDasharray="4 4"
              label={{ value: 'CRITICAL DANGER CREST (6.80m)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} 
            />

            {/* Warning Level Reference Line (5.2m) */}
            <ReferenceLine 
              y={5.2} 
              stroke="#f59e0b" 
              strokeWidth={1.5} 
              strokeDasharray="3 3"
              label={{ value: 'WARNING STAGE (5.20m)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} 
            />

            {/* Current Point Marker Reference Line */}
            <ReferenceLine 
              x="NOW" 
              stroke="#38bdf8" 
              strokeWidth={2} 
              label={{ value: 'TELEMETRY NOW', fill: '#38bdf8', fontSize: 10, position: 'insideBottomLeft' }} 
            />

            {/* 15-Minute Target Mark Reference Line */}
            <ReferenceLine 
              x="+15m" 
              stroke="#f43f5e" 
              strokeWidth={1.8} 
              strokeDasharray="2 2"
              label={{ value: '15-MIN ADVANCE WINDOW', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }} 
            />

            <Area 
              type="monotone" 
              dataKey="waterLevel" 
              stroke="#06b6d4" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#waterLevelGrad)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trajectory Insights & Model Reliability Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Projected Crest Height: <strong className="text-white">{prediction.projectedCrestHeight}m</strong> at approximately <strong className="text-amber-300">+{prediction.projectedCrestTimeMinutes} min</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Model Confidence: <strong className="text-emerald-400">{prediction.confidenceScore}%</strong></span>
          <span>Inundation Plume: <strong className="text-cyan-300">{prediction.inundationAreaSqKm} km²</strong></span>
        </div>
      </div>
    </div>
  );
};
