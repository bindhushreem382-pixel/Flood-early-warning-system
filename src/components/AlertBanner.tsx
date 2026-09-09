import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Volume2, 
  MapPin, 
  ShieldAlert, 
  Flame, 
  TrendingUp,
  XCircle,
  Radio
} from 'lucide-react';
import { AlertLevel, EmergencyAlert, PredictionResult } from '../types';
import { audioAlertSystem } from '../utils/audioAlert';

interface AlertBannerProps {
  prediction: PredictionResult;
  activeAlert: EmergencyAlert | null;
  onBroadcastEmergency: () => void;
  onSilenceAlert: () => void;
  onClearAlert: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  prediction,
  activeAlert,
  onBroadcastEmergency,
  onSilenceAlert,
  onClearAlert,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.round((prediction.estimatedTimeToFloodMinutes || 15) * 60)
  );

  useEffect(() => {
    if (prediction.estimatedTimeToFloodMinutes) {
      setSecondsRemaining(Math.round(prediction.estimatedTimeToFloodMinutes * 60));
    }
  }, [prediction.estimatedTimeToFloodMinutes]);

  useEffect(() => {
    if (prediction.level === 'DANGER' && secondsRemaining > 0) {
      const interval = setInterval(() => {
        setSecondsRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [prediction.level, secondsRemaining]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayVoice = () => {
    const text = activeAlert?.message || 
      `⚠️ FLOOD ALERT: Rapid water-level rise detected in your area. Flooding may occur within approximately ${prediction.estimatedTimeToFloodMinutes || 15} minutes. Move immediately to higher ground or the nearest designated safe location. Do not enter flooded roads or cross flowing water.`;
    audioAlertSystem.playVoiceAnnouncement(text);
  };

  if (prediction.level === 'NORMAL' && !activeAlert) {
    return (
      <section id="alert-banner-normal" className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 text-emerald-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                  🟢 NORMAL STATUS: Hydrological Levels Safe
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  RISK {prediction.currentRiskScore}%
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                All 8 river basin ultrasonic, radar, and soil sensors report nominal values. No surge threat detected.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono bg-emerald-950/60 px-3 py-2 rounded-xl border border-emerald-800/40">
            <div>
              <span className="text-slate-400 block text-[10px]">RATE OF RISE</span>
              <span className="font-semibold text-emerald-300">{prediction.rateOfRiseMetersPerHour} m/hr</span>
            </div>
            <div className="w-px h-6 bg-emerald-800/60" />
            <div>
              <span className="text-slate-400 block text-[10px]">SOIL SATURATION</span>
              <span className="font-semibold text-emerald-300">{(prediction.soilSaturationFactor * 100).toFixed(0)}%</span>
            </div>
            <div className="w-px h-6 bg-emerald-800/60" />
            <div>
              <span className="text-slate-400 block text-[10px]">EDGE SIRENS</span>
              <span className="text-emerald-400 font-semibold">Armed (Standby)</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (prediction.level === 'WARNING') {
    return (
      <section id="alert-banner-warning" className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 text-amber-200 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-amber-100 font-['Plus_Jakarta_Sans']">
                  🟡 WARNING LEVEL: Rapid Water Level Rise Detected
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50">
                  PRE-FLOOD STAGE
                </span>
                <span className="text-xs text-amber-400 font-mono">
                  Rise Rate: +{prediction.rateOfRiseMetersPerHour} m/hr
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 max-w-2xl">
                Water is rising rapidly across the upper gorge and central bridge gauge. Catchment soil saturation is at {(prediction.soilSaturationFactor * 100).toFixed(0)}%. 
                Residents in low-lying riverside areas should remain alert, stage emergency go-bags, and prepare to move to designated high-ground shelters if upgraded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              id="voice-announcement-warning-btn"
              onClick={handlePlayVoice}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Voice Alert</span>
            </button>
            <button
              id="escalate-emergency-btn"
              onClick={onBroadcastEmergency}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 text-white hover:from-red-500 hover:to-amber-500 shadow-lg shadow-red-900/30 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Escalate to Danger Broadcast</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // DANGER LEVEL BANNER (CRITICAL 15-MINUTE ADVANCE WARNING)
  return (
    <section id="alert-banner-danger" className="bg-red-950/60 border-2 border-red-500 rounded-2xl p-5 sm:p-6 text-red-100 shadow-2xl shadow-red-900/40 relative overflow-hidden animate-[pulse_3s_ease-in-out_infinite]">
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Emergency Status & Core Alert */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 border-2 border-red-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/50 animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs px-3 py-1 rounded-full bg-red-600 text-white font-extrabold tracking-wide uppercase shadow">
                🔴 CRITICAL DANGER
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                FLOOD IMMINENT: TARGET ≥15-MIN ADVANCE EVACUATION
              </h2>
            </div>
            
            <p className="text-sm font-semibold text-red-200 mt-1.5 leading-relaxed max-w-3xl">
              "⚠️ <span className="text-white font-bold">FLOOD ALERT:</span> Rapid water-level rise detected in your area. Flooding may occur within approximately <span className="text-amber-300 font-mono underline font-bold">{prediction.estimatedTimeToFloodMinutes || 15} minutes</span>. Move immediately to higher ground or the nearest designated safe location. Do not enter flooded roads or cross flowing water."
            </p>

            <div className="flex items-center gap-4 mt-3 text-xs text-red-300/90 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Sector: Riverside Settlement Zone B, Lowlands Canal & Causeway</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                <span>Rate of Rise: +{prediction.rateOfRiseMetersPerHour} m/hr</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-amber-300 font-semibold">Multi-Channel Broadcast Active (SMS, Siren, Push, LED, NDRF)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Countdown Timer & Direct Controls */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 w-full lg:w-auto shrink-0">
          <div className="w-full sm:w-auto bg-black/60 border border-red-500/50 rounded-xl p-3 text-center sm:text-right flex items-center justify-between sm:justify-end gap-3">
            <div className="text-left">
              <div className="text-[10px] uppercase font-mono tracking-wider text-red-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400 animate-spin" />
                <span>Lead Time to Inundation</span>
              </div>
              <span className="text-xs text-slate-300 font-medium">Estimated Evacuation Window</span>
            </div>
            <div className="font-mono text-3xl font-black tracking-tight text-red-400 bg-red-950/70 px-3 py-1 rounded-lg border border-red-500/40 tabular-nums">
              {formatCountdown(secondsRemaining)}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full justify-end">
            <button
              id="broadcast-voice-danger-btn"
              onClick={handlePlayVoice}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-800/80 hover:bg-red-700 text-white border border-red-400 shadow transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Voice Announcement</span>
            </button>
            <button
              id="silence-siren-btn"
              onClick={onSilenceAlert}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
              title="Silence siren audio"
            >
              <span>Silence</span>
            </button>
            <button
              id="clear-alert-btn"
              onClick={onClearAlert}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-700 transition-all"
              title="Reset alert state"
            >
              <XCircle className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
