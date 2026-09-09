import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { GisMap } from './components/GisMap';
import { PredictiveHydrograph } from './components/PredictiveHydrograph';
import { MultiChannelAlerts } from './components/MultiChannelAlerts';
import { SensorHealthGrid } from './components/SensorHealthGrid';
import { AiSituationReport } from './components/AiSituationReport';
import { CitizenView } from './components/CitizenView';
import { audioAlertSystem } from './utils/audioAlert';
import { 
  SensorNode, 
  PredictionResult, 
  EmergencyAlert, 
  SimulationScenario, 
  EvacuationSafeZone, 
  AlertLevel 
} from './types';

export default function App() {
  const [scenario, setScenario] = useState<SimulationScenario>('NORMAL_CONDITIONS');
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [safeZones, setSafeZones] = useState<EvacuationSafeZone[]>([]);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [alertHistory, setAlertHistory] = useState<EmergencyAlert[]>([]);
  const [viewMode, setViewMode] = useState<'admin' | 'citizen'>('admin');
  const [selectedSensor, setSelectedSensor] = useState<SensorNode | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // Fetch live telemetry from the backend server
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (!res.ok) return;
      const data = await res.json();
      setSensors(data.sensors || []);
      setPrediction(data.prediction || null);
      setSafeZones(data.safeZones || []);
      setActiveAlert(data.activeAlert || null);
      setAlertHistory(data.alertHistory || []);

      // If newly upgraded to DANGER and not already sounding siren, trigger acoustic warble
      if (data.prediction?.level === 'DANGER' && !isMuted && !audioAlertSystem.getIsSirenPlaying()) {
        audioAlertSystem.startSiren();
        setIsSirenActive(true);
      } else if (data.prediction?.level === 'NORMAL' && audioAlertSystem.getIsSirenPlaying()) {
        audioAlertSystem.stopSiren();
        setIsSirenActive(false);
      }
    } catch (err) {
      console.warn('Telemetry polling error:', err);
    }
  }, [isMuted]);

  // Initial load and polling
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Handle Scenario Switch
  const handleScenarioChange = async (newScenario: SimulationScenario) => {
    setScenario(newScenario);
    try {
      const res = await fetch('/api/simulation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: newScenario }),
      });
      if (res.ok) {
        await fetchTelemetry();
        if (newScenario === 'FLASH_FLOOD_15MIN' && !isMuted) {
          audioAlertSystem.startSiren();
          setIsSirenActive(true);
        } else if (newScenario === 'NORMAL_CONDITIONS') {
          audioAlertSystem.stopSiren();
          setIsSirenActive(false);
        }
      }
    } catch (e) {
      console.error('Failed to change scenario:', e);
    }
  };

  // Trigger Gemini AI Diagnosis
  const handleTriggerAiDiagnosis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.analysis) {
        setAiReport(data.analysis);
      }
    } catch (e) {
      console.error('Failed AI diagnosis:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Manual Emergency Broadcast
  const handleManualBroadcast = async (customMessage?: string) => {
    try {
      const res = await fetch('/api/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'DANGER',
          customMessage,
        }),
      });
      if (res.ok) {
        await fetchTelemetry();
        if (!isMuted) {
          audioAlertSystem.startSiren();
          setIsSirenActive(true);
        }
      }
    } catch (e) {
      console.error('Failed to broadcast:', e);
    }
  };

  // Silence Siren
  const handleSilenceAlert = async () => {
    audioAlertSystem.stopSiren();
    audioAlertSystem.stopVoiceAnnouncement();
    setIsSirenActive(false);
    try {
      await fetch('/api/alerts/silence', { method: 'POST' });
    } catch (e) {
      console.error('Failed to silence:', e);
    }
  };

  // Clear Alert / Reset
  const handleClearAlert = async () => {
    handleSilenceAlert();
    try {
      await fetch('/api/alerts/clear', { method: 'POST' });
      await handleScenarioChange('NORMAL_CONDITIONS');
    } catch (e) {
      console.error('Failed to clear alert:', e);
    }
  };

  // Update specific sensor
  const handleUpdateSensor = async (id: string, updates: Partial<SensorNode>) => {
    try {
      await fetch(`/api/sensors/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await fetchTelemetry();
    } catch (e) {
      console.error('Failed to update sensor:', e);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioAlertSystem.setMuted(nextMuted);
    if (nextMuted) {
      setIsSirenActive(false);
    }
  };

  const handleToggleSiren = () => {
    if (isSirenActive) {
      audioAlertSystem.stopSiren();
      setIsSirenActive(false);
    } else {
      audioAlertSystem.startSiren();
      setIsSirenActive(true);
    }
  };

  const alertLevel: AlertLevel = prediction?.level || 'NORMAL';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        alertLevel={alertLevel}
        scenario={scenario}
        onScenarioChange={handleScenarioChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isSirenActive={isSirenActive}
        onToggleSiren={handleToggleSiren}
        onResetToNormal={() => handleScenarioChange('NORMAL_CONDITIONS')}
        onTriggerAiDiagnosis={handleTriggerAiDiagnosis}
        isAiLoading={isAiLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6">
        {prediction ? (
          viewMode === 'citizen' ? (
            /* Citizen Mobile Simulation Screen */
            <CitizenView
              activeAlert={activeAlert}
              prediction={prediction}
              safeZones={safeZones}
              alertLevel={alertLevel}
              onBackToAdmin={() => setViewMode('admin')}
            />
          ) : (
            /* Admin Operations Center */
            <>
              {/* 1. Primary Alert Banner with 3 Warning Levels and 15-Min Countdown */}
              <AlertBanner
                prediction={prediction}
                activeAlert={activeAlert}
                onBroadcastEmergency={() => handleManualBroadcast()}
                onSilenceAlert={handleSilenceAlert}
                onClearAlert={handleClearAlert}
              />

              {/* 2. Interactive GIS Inundation & GPS Telemetry Grid */}
              <GisMap
                sensors={sensors}
                safeZones={safeZones}
                alertLevel={alertLevel}
                prediction={prediction}
                selectedSensor={selectedSensor}
                onSelectSensor={setSelectedSensor}
              />

              {/* 3. Hydrodynamic Wave & 15-Minute Predictive Crest Model */}
              <PredictiveHydrograph
                prediction={prediction}
                sensors={sensors}
              />

              {/* 4. Multi-Channel Emergency Alert Dispatcher (SMS, Push, Voice, Siren, LED, Authorities) */}
              <MultiChannelAlerts
                activeAlert={activeAlert}
                alertHistory={alertHistory}
                alertLevel={alertLevel}
                prediction={prediction}
                onManualBroadcast={handleManualBroadcast}
                isSirenPlaying={isSirenActive}
                onToggleSiren={handleToggleSiren}
              />

              {/* 5. AI/ML Hydrological Situation Report & Disaster Diagnosis */}
              <AiSituationReport
                prediction={prediction}
                aiReport={aiReport}
                isLoading={isAiLoading}
                onRefreshAi={handleTriggerAiDiagnosis}
              />

              {/* 6. Sensor Health, False-Alarm Reduction & Edge Resilience */}
              <SensorHealthGrid
                sensors={sensors}
                prediction={prediction}
                onUpdateSensor={handleUpdateSensor}
              />
            </>
          )
        ) : (
          /* Loading Telemetry State */
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-xs font-mono">Initializing IoT Gateway & Hydrological Edge Stream...</span>
          </div>
        )}
      </main>

      {/* System Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Early Flood Awareness and Warning System (EFAWS) • Edge IoT & AI Telemetry</span>
          <span>Target ≥15-Min Lead Time • ISO 22320 Disaster Emergency Compliance</span>
        </div>
      </footer>
    </div>
  );
}
