import React from 'react';
import { 
  Waves, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  LayoutDashboard, 
  Radio, 
  Activity, 
  CloudRain, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AlertLevel, SimulationScenario } from '../types';

interface NavbarProps {
  alertLevel: AlertLevel;
  scenario: SimulationScenario;
  onScenarioChange: (scenario: SimulationScenario) => void;
  viewMode: 'admin' | 'citizen';
  onViewModeChange: (mode: 'admin' | 'citizen') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
  onResetToNormal: () => void;
  onTriggerAiDiagnosis: () => void;
  isAiLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  alertLevel,
  scenario,
  onScenarioChange,
  viewMode,
  onViewModeChange,
  isMuted,
  onToggleMute,
  isSirenActive,
  onToggleSiren,
  onResetToNormal,
  onTriggerAiDiagnosis,
  isAiLoading,
}) => {
  const getBadgeStyle = () => {
    switch (alertLevel) {
      case 'DANGER':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'NORMAL':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner ${
            alertLevel === 'DANGER' ? 'bg-red-600 text-white animate-bounce' :
            alertLevel === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-cyan-600 text-white'
          }`}>
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                EFAWS
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider font-mono">
                Early Flood Warning
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${getBadgeStyle()}`}>
                <span className={`w-2 h-2 rounded-full ${
                  alertLevel === 'DANGER' ? 'bg-red-400 animate-ping' :
                  alertLevel === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {alertLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Continuous IoT Hydrological Telemetry • ≥15-Min Advance Evacuation Alert
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Simulation Scenario Picker */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Activity className="w-3.5 h-3.5 text-cyan-400 hidden sm:block" />
            <span className="text-slate-400 hidden md:inline">Scenario:</span>
            <select
              id="simulation-scenario-select"
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value as SimulationScenario)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="NORMAL_CONDITIONS" className="bg-slate-900 text-slate-200">
                🟢 Normal River Flow
              </option>
              <option value="FLASH_FLOOD_15MIN" className="bg-slate-900 text-red-300">
                🔴 Flash Flood Surge (15-Min Evacuation)
              </option>
              <option value="RAPID_CLOUDBURST" className="bg-slate-900 text-amber-300">
                🟡 Torrential Cloudburst (Runoff Build)
              </option>
              <option value="DAM_SLUICE_RELEASE" className="bg-slate-900 text-amber-300">
                🟡 Dam Spillway Discharge
              </option>
              <option value="SENSOR_DRIFT_FAILOVER" className="bg-slate-900 text-slate-300">
                ⚪ Sensor Outage / Fault Recovery Test
              </option>
            </select>
          </div>

          {/* Quick AI Diagnosis Button */}
          <button
            id="ai-diagnose-btn"
            onClick={onTriggerAiDiagnosis}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 transition-all disabled:opacity-50"
            title="Generate AI situation report & evacuation bulletin"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : 'text-indigo-400'}`} />
            <span className="hidden sm:inline">AI Analysis</span>
          </button>

          {/* Siren Audio Test Toggle */}
          <button
            id="siren-toggle-btn"
            onClick={onToggleSiren}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSirenActive
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isSirenActive ? 'Stop Emergency Siren' : 'Test Acoustic Evacuation Siren'}
          >
            <Radio className={`w-3.5 h-3.5 ${isSirenActive ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isSirenActive ? 'Siren Sounding' : 'Test Siren'}</span>
          </button>

          {/* Mute/Unmute */}
          <button
            id="audio-mute-toggle-btn"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isMuted ? 'bg-red-950/40 text-red-400 border-red-800' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* View Mode Toggle: Admin Dashboard vs Citizen Evacuation Alert */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              id="view-admin-btn"
              onClick={() => onViewModeChange('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'admin'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Ops</span>
            </button>
            <button
              id="view-citizen-btn"
              onClick={() => onViewModeChange('citizen')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'citizen'
                  ? 'bg-red-600 text-white shadow animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Citizen View</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
