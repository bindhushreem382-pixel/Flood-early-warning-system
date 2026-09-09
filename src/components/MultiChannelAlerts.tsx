import React, { useState } from 'react';
import { 
  Radio, 
  MessageSquare, 
  Smartphone, 
  PhoneCall, 
  Volume2, 
  Tv, 
  Shield, 
  CheckCircle2, 
  Send, 
  History, 
  AlertOctagon, 
  Play, 
  Square,
  Flame,
  Clock
} from 'lucide-react';
import { EmergencyAlert, AlertLevel, PredictionResult } from '../types';
import { audioAlertSystem } from '../utils/audioAlert';

interface MultiChannelAlertsProps {
  activeAlert: EmergencyAlert | null;
  alertHistory: EmergencyAlert[];
  alertLevel: AlertLevel;
  prediction: PredictionResult;
  onManualBroadcast: (customMsg?: string) => void;
  isSirenPlaying: boolean;
  onToggleSiren: () => void;
}

export const MultiChannelAlerts: React.FC<MultiChannelAlertsProps> = ({
  activeAlert,
  alertHistory,
  alertLevel,
  prediction,
  onManualBroadcast,
  isSirenPlaying,
  onToggleSiren,
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'channels' | 'history'>('channels');

  const eta = prediction.estimatedTimeToFloodMinutes || 15;
  const defaultEmergencyText = `⚠️ FLOOD ALERT: Rapid water-level rise detected in your area. Flooding may occur within approximately ${eta} minutes. Move immediately to higher ground or the nearest designated safe location. Do not enter flooded roads or cross flowing water.`;

  const channels = activeAlert?.channels || {
    sms: {
      status: alertLevel === 'DANGER' ? 'delivered' : 'idle',
      sentCount: alertLevel === 'DANGER' ? 14850 : 0,
      targetCount: 15200,
      sampleText: defaultEmergencyText,
    },
    pushNotification: {
      status: alertLevel === 'DANGER' ? 'broadcasted' : 'idle',
      activeAppSubscribers: 18420,
      geoFencedRadiusKm: 5.5,
    },
    voiceTTS: {
      status: alertLevel === 'DANGER' ? 'in_progress' : 'idle',
      callsQueued: alertLevel === 'DANGER' ? 420 : 0,
      script: `Emergency flood announcement. Evacuate to high ground immediately. Flooding imminent within ${eta} minutes.`,
    },
    localSirens: {
      status: alertLevel === 'DANGER' ? 'sounding' : 'idle',
      activeSirensCount: 6,
      soundFrequencyHz: 440,
      decibelRating: 125,
      autonomousEdgeFallbackTriggered: false,
    },
    publicLedBoards: {
      status: alertLevel === 'DANGER' ? 'displaying' : 'idle',
      boardsOnline: 8,
      displayMatrixText: `⚠️ FLOOD ALERT: EVACUATE - ETA ${eta} MIN`,
      colorMode: alertLevel === 'DANGER' ? 'RED_FLASH' : 'AMBER',
    },
    authorities: {
      status: alertLevel === 'DANGER' ? 'dispatched' : 'idle',
      agencies: [
        { name: 'National Disaster Response Force (NDRF)', contact: 'Command Desk 107', acknowledged: true, eta: '5 min' },
        { name: 'City Fire & Swift Water Rescue', contact: 'Station 4 & 9', acknowledged: true, eta: '4 min' },
        { name: 'District Civil Administration', contact: 'EOC Room', acknowledged: true, eta: 'On Scene' },
      ],
    },
  };

  const handlePlayVoice = () => {
    if (isPlayingVoice) {
      audioAlertSystem.stopVoiceAnnouncement();
      setIsPlayingVoice(false);
    } else {
      setIsPlayingVoice(true);
      audioAlertSystem.playVoiceAnnouncement(defaultEmergencyText, () => {
        setIsPlayingVoice(false);
      });
    }
  };

  return (
    <div id="multichannel-alerts-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-5">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
              Multi-Channel Emergency Alert Dispatcher
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-mono">
              6 Redundant Channels
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic broadcast upon 15-minute inundation detection or manual commander override.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'channels' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Channels
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Alert History ({alertHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'channels' ? (
        <>
          {/* 6 Broadcast Channel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. SMS Broadcast Channel */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-bold text-xs text-white">1. Cell Broadcast & SMS</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    channels.sms.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {channels.sms.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                  "{channels.sms.sampleText}"
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
                <span>Dispatched:</span>
                <span className="text-white font-bold">{channels.sms.sentCount} / {channels.sms.targetCount} phones</span>
              </div>
            </div>

            {/* 2. Mobile Push Notification */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Smartphone className="w-4 h-4" />
                    <span className="font-bold text-xs text-white">2. App Push Notification</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    channels.pushNotification.status === 'broadcasted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {channels.pushNotification.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <div className="font-bold text-red-400 flex items-center gap-1 text-[11px]">
                    <AlertOctagon className="w-3 h-3" />
                    <span>EMERGENCY DISASTER ALERT</span>
                  </div>
                  <div className="text-[11px] text-slate-200 mt-0.5">
                    Critical surge. Evacuate within {eta} min. Tap for shelter route.
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
                <span>Geo-Fenced Radius:</span>
                <span className="text-white font-bold">{channels.pushNotification.geoFencedRadiusKm} km</span>
              </div>
            </div>

            {/* 3. Automated Voice Call & TTS Announcement */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <PhoneCall className="w-4 h-4" />
                    <span className="font-bold text-xs text-white">3. Automated Voice Call</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    channels.voiceTTS.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {channels.voiceTTS.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                  "{channels.voiceTTS.script}"
                </p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                <button
                  id="listen-voice-call-tts-btn"
                  onClick={handlePlayVoice}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50 border border-indigo-500/40 transition-all"
                >
                  {isPlayingVoice ? <Square className="w-3 h-3 text-red-400" /> : <Play className="w-3 h-3 text-indigo-400" />}
                  <span>{isPlayingVoice ? 'Stop Audio' : 'Listen TTS'}</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                  {channels.voiceTTS.callsQueued} lines dialling
                </span>
              </div>
            </div>

            {/* 4. Local Acoustic Siren */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-red-400">
                    <Radio className="w-4 h-4" />
                    <span className="font-bold text-xs text-white">4. Local Edge Sirens</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    channels.localSirens.status === 'sounding' || isSirenPlaying ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {isSirenPlaying ? 'ACTIVE' : channels.localSirens.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs text-slate-300 flex flex-col gap-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span>Acoustic Output:</span>
                    <strong className="text-white">{channels.localSirens.decibelRating} dB (Warble)</strong>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span>Edge Offline Mode:</span>
                    <strong className="text-emerald-400">Autonomous Microcontroller</strong>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                <button
                  id="test-acoustic-siren-btn"
                  onClick={onToggleSiren}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    isSirenPlaying 
                      ? 'bg-red-600 text-white border-red-400 animate-bounce' 
                      : 'bg-red-950/40 text-red-300 border-red-800/60 hover:bg-red-900/50'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isSirenPlaying ? 'Stop Siren' : 'Trigger Siren'}</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                  {channels.localSirens.activeSirensCount} sirens online
                </span>
              </div>
            </div>

            {/* 5. Public VMS / LED Display Boards */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Tv className="w-4 h-4" />
                    <span className="font-bold text-xs text-white">5. Public LED / VMS Boards</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    channels.publicLedBoards.status === 'displaying' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {channels.publicLedBoards.status.toUpperCase()}
                  </span>
                </div>
                {/* Simulated LED Dot-Matrix Display */}
                <div className="bg-black p-2.5 rounded-lg border-2 border-slate-700 shadow-inner font-mono text-[11px] text-center tracking-widest text-amber-400 animate-pulse uppercase">
                  {channels.publicLedBoards.displayMatrixText}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
                <span>Highway Displays:</span>
                <span className="text-white font-bold">{channels.publicLedBoards.boardsOnline} Active Units</span>
              </div>
            </div>

            {/* 6. Emergency Authorities Notification */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Shield className="w-4 h-4" />
                    <span className="font-bold text-xs text-white">6. Emergency Authorities</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    channels.authorities.status === 'dispatched' ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {channels.authorities.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  {channels.authorities.agencies.map((agency, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <span className="text-slate-300 truncate max-w-[140px]">{agency.name}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {agency.eta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
                <span>Direct Hotline:</span>
                <span className="text-emerald-400 font-bold">108 / NDRF 107</span>
              </div>
            </div>
          </div>

          {/* Commander Custom Broadcast Form */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <input
              id="custom-broadcast-input"
              type="text"
              placeholder="Enter custom emergency broadcast bulletin override..."
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
            <button
              id="manual-broadcast-submit-btn"
              onClick={() => {
                onManualBroadcast(customDraft || undefined);
                setCustomDraft('');
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-red-900/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Now</span>
            </button>
          </div>
        </>
      ) : (
        /* Alert History Table */
        <div className="overflow-x-auto">
          {alertHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono">
              No historical emergency alerts recorded in current session.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Alert ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Zone</th>
                  <th className="p-3">ETA Lead</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alertHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-200">{item.id}</td>
                    <td className="p-3 text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.level === 'DANGER' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                        item.level === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.level}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{item.zone}</td>
                    <td className="p-3 text-red-300 font-bold">~{item.etaMinutes || 15} min</td>
                    <td className="p-3 text-emerald-400">Delivered (All 6)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
