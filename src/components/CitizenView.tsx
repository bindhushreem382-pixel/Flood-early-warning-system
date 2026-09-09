import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  CheckCircle, 
  Volume2, 
  AlertTriangle, 
  Compass, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Waves
} from 'lucide-react';
import { EmergencyAlert, PredictionResult, EvacuationSafeZone, AlertLevel } from '../types';
import { audioAlertSystem } from '../utils/audioAlert';

interface CitizenViewProps {
  activeAlert: EmergencyAlert | null;
  prediction: PredictionResult;
  safeZones: EvacuationSafeZone[];
  alertLevel: AlertLevel;
  onBackToAdmin: () => void;
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  activeAlert,
  prediction,
  safeZones,
  alertLevel,
  onBackToAdmin,
}) => {
  const [isMarkedSafe, setIsMarkedSafe] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const nearestShelter = safeZones[0];
  const eta = prediction.estimatedTimeToFloodMinutes || 15;

  const defaultText = `⚠️ FLOOD ALERT: Rapid water-level rise detected in your area. Flooding may occur within approximately ${eta} minutes. Move immediately to higher ground or the nearest designated safe location. Do not enter flooded roads or cross flowing water.`;

  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      audioAlertSystem.stopVoiceAnnouncement();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      audioAlertSystem.playVoiceAnnouncement(activeAlert?.message || defaultText, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  return (
    <div id="citizen-mobile-view" className="max-w-md mx-auto py-4 px-3 flex flex-col gap-4 font-['Plus_Jakarta_Sans']">
      {/* Return to Admin Banner */}
      <div className="flex items-center justify-between text-xs bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
        <span>Citizen Mobile Simulation View</span>
        <button
          onClick={onBackToAdmin}
          className="text-cyan-400 hover:text-cyan-300 font-semibold"
        >
          Return to Admin Ops →
        </button>
      </div>

      {/* Simulated Smartphone Frame */}
      <div className={`bg-slate-950 rounded-[36px] border-4 shadow-2xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden transition-all ${
        alertLevel === 'DANGER' ? 'border-red-600 shadow-red-900/50 animate-[pulse_3s_ease-in-out_infinite]' :
        alertLevel === 'WARNING' ? 'border-amber-500 shadow-amber-900/40' :
        'border-slate-700'
      }`}>
        {/* Smartphone Speaker notch */}
        <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto border border-slate-800 shrink-0" />

        {/* Emergency Alert Banner */}
        {alertLevel === 'DANGER' ? (
          <div className="bg-red-600 text-white rounded-2xl p-4 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-widest bg-red-800 px-2 py-0.5 rounded-full font-mono">
                CRITICAL LIFE SAFETY ALERT
              </span>
              <div className="flex items-center gap-1 text-xs font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>ETA ~{eta}m</span>
              </div>
            </div>

            <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2 mt-1">
              <ShieldAlert className="w-6 h-6 shrink-0 animate-bounce" />
              <span>IMMEDIATE EVACUATION ORDER</span>
            </h3>

            <p className="text-xs font-medium text-red-100 leading-relaxed">
              "{activeAlert?.message || defaultText}"
            </p>

            <button
              onClick={handlePlayVoice}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-white text-red-700 rounded-xl font-bold text-xs shadow hover:bg-red-50 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Stop Emergency Audio' : 'Play Spoken Voice Warning'}</span>
            </button>
          </div>
        ) : alertLevel === 'WARNING' ? (
          <div className="bg-amber-600 text-white rounded-2xl p-4 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-800 px-2 py-0.5 rounded-full font-mono">
                YELLOW FLOOD ADVISORY
              </span>
              <span className="text-xs font-mono">Rate: +{prediction.rateOfRiseMetersPerHour}m/hr</span>
            </div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Rapid River Level Rise Detected</span>
            </h3>
            <p className="text-xs text-amber-100">
              Prepare emergency supplies. Low-lying roads near Causeway bridge may become impassable within 30 minutes.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">All Clear: River Levels Normal</h3>
              <p className="text-xs text-emerald-300/80">No flood threats currently predicted in your sector.</p>
            </div>
          </div>
        )}

        {/* GPS Evacuation Route & Safe High Ground Navigator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Navigation className="w-4 h-4" />
              <span>Recommended Safe Shelter Route</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
              52m Elevation (Safe)
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{nearestShelter.name}</span>
              <span className="text-xs font-bold text-emerald-400">{nearestShelter.distanceFromRiverKm} km</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Take <strong className="text-slate-200">North Ridge Arterial Road</strong> (Elevated, clear of water). Do not use the sunken causeway underpass.
            </p>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-[10px]">1</span>
              <span>Head north toward Ridge Road away from river channel.</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-[10px]">2</span>
              <span>Cross elevated viaduct; continue 1.4km uphill.</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-[10px]">3</span>
              <span>Arrive at Highland Community Shelter A (Medical post & food available).</span>
            </div>
          </div>
        </div>

        {/* Life Safety Directives */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 flex flex-col gap-2">
          <div className="font-bold text-white flex items-center gap-1.5 text-[11px]">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>CRITICAL SURVIVAL RULES</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
            <li><strong className="text-slate-200">Turn Around, Don't Drown:</strong> 15cm of flowing water can knock you down; 30cm can float a vehicle.</li>
            <li>Disconnect gas lines and power breaker before leaving if time allows.</li>
            <li>Take essential prescriptions, ID, phone power bank, and water.</li>
          </ul>
        </div>

        {/* Action Buttons: "I Am Safe" & Emergency Call */}
        <div className="flex flex-col gap-2 mt-1">
          <button
            id="citizen-safe-btn"
            onClick={() => setIsMarkedSafe(!isMarkedSafe)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isMarkedSafe 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isMarkedSafe ? '✓ Status: Marked Safe with Civil Defense' : 'Mark Myself as Safe / Check-in'}</span>
          </button>

          <a
            href="tel:911"
            className="w-full py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-800/80 text-xs font-bold flex items-center justify-center gap-2 text-center transition-all"
          >
            <PhoneCall className="w-4 h-4 text-red-400" />
            <span>Call Disaster Helpline (911 / 108 / NDRF)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
