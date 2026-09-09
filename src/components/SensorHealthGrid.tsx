import React from 'react';
import { 
  Activity, 
  Battery, 
  Wifi, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  Sliders, 
  Wrench,
  Zap,
  Radio
} from 'lucide-react';
import { SensorNode, PredictionResult } from '../types';

interface SensorHealthGridProps {
  sensors: SensorNode[];
  prediction: PredictionResult;
  onUpdateSensor: (id: string, updates: Partial<SensorNode>) => void;
}

export const SensorHealthGrid: React.FC<SensorHealthGridProps> = ({
  sensors,
  prediction,
  onUpdateSensor,
}) => {
  return (
    <div id="sensor-health-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
              Sensor Health, False-Alarm Reduction & Edge Resilience
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Failover & Drift Protection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time packet loss tracking, cross-sensor anomaly validation, and autonomous edge fallback.
          </p>
        </div>

        {/* Edge Offline Siren Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Edge Autonomous Siren:</span>
          <span className="text-emerald-400 font-bold">ARMED (Offline Ready)</span>
        </div>
      </div>

      {/* Multi-Sensor Cross-Validation & False-Alarm Reduction Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            prediction.falseAlarmFilter.passed 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                Multi-Sensor Physical Cross-Validation Engine
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                prediction.falseAlarmFilter.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Score: {prediction.falseAlarmFilter.crossCheckScore}%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {prediction.falseAlarmFilter.anomalyReasoning}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {prediction.falseAlarmFilter.corroboratingSensors.map((c, idx) => (
                <span key={idx} className="text-[10px] bg-slate-900 text-cyan-300 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                  ✓ {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right text-xs font-mono text-slate-400 shrink-0">
          <div>Packet Verification: <strong className="text-emerald-400">CRC-32 Valid</strong></div>
          <div>Sampling Window: <strong className="text-slate-200">10s Rolling Mean</strong></div>
        </div>
      </div>

      {/* Grid of IoT Sensor Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((s) => {
          const isCritical = s.status === 'critical' || s.currentValue >= s.thresholdDanger;
          const isWarning = s.status === 'warning' || s.currentValue >= s.thresholdWarning;
          const isDegraded = s.status === 'degraded' || s.health.driftDetected;

          return (
            <div 
              key={s.id} 
              className={`bg-slate-950/70 rounded-xl p-4 border flex flex-col justify-between transition-all ${
                isCritical ? 'border-red-500/60 bg-red-950/10' :
                isWarning ? 'border-amber-500/40 bg-amber-950/10' :
                isDegraded ? 'border-purple-500/40 bg-purple-950/10' :
                'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Title & Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{s.id}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{s.type.replace('_', ' ')}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    isCritical ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    isWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    isDegraded ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {s.status}
                  </span>
                </div>

                {/* Sensor Name & Zone */}
                <h5 className="text-xs font-bold text-white tracking-tight mb-1">
                  {s.name}
                </h5>
                <p className="text-[11px] text-slate-400 mb-3">
                  {s.location.zoneName} ({s.location.elevationMeters}m AMSL)
                </p>

                {/* Live Value vs Danger Threshold */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Current Telemetry</span>
                    <span className="text-base font-black font-mono text-white">
                      {s.currentValue} {s.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Danger Level</span>
                    <span className="text-xs font-bold font-mono text-red-400">
                      {s.thresholdDanger} {s.unit}
                    </span>
                  </div>
                </div>

                {/* Hardware Telemetry Row */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                      <Battery className="w-2.5 h-2.5 text-emerald-400" />
                      BATTERY
                    </span>
                    <strong className="text-slate-200 mt-0.5">{s.batteryPercent}%</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5 text-cyan-400" />
                      LoRa / 4G
                    </span>
                    <strong className="text-slate-200 mt-0.5">{s.signalStrengthDbm} dBm</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5 text-indigo-400" />
                      PACKET LOSS
                    </span>
                    <strong className={s.health.packetLossPercent > 5 ? 'text-red-400' : 'text-slate-200'}>
                      {s.health.packetLossPercent}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Anomaly & Failover Actions */}
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className={`flex items-center gap-1 ${s.health.driftDetected ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                  {s.health.driftDetected ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-purple-400" />
                      <span>Drift Detected</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Calibrated ({s.health.lastCalibrationDate})</span>
                    </>
                  )}
                </span>

                <button
                  id={`calibrate-sensor-${s.id}`}
                  onClick={() => {
                    onUpdateSensor(s.id, {
                      health: {
                        ...s.health,
                        driftDetected: false,
                        packetLossPercent: 0.1,
                      },
                      status: 'online',
                    });
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Recalibrate
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
