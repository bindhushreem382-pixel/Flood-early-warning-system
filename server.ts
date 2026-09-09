import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { SensorNode, PredictionResult, EmergencyAlert, SimulationScenario, EvacuationSafeZone } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client server-side lazily
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.error('Failed to init Gemini API client:', e);
    }
  }
  return aiClient;
}

// Initial Sensor Stations along the River Valley & Catchment Area
const initialSensors: SensorNode[] = [
  {
    id: 'WL-01',
    name: 'Upstream River Gorge Ultrasonic Gauge',
    type: 'water_level',
    location: {
      lat: 13.0827,
      lng: 80.2707,
      elevationMeters: 42.5,
      zoneName: 'North Basin Catchment',
      basinName: 'Adyar-Kaveri Hydrological Channel',
    },
    currentValue: 3.4,
    unit: 'm',
    thresholdWarning: 5.2,
    thresholdDanger: 6.8,
    status: 'online',
    batteryPercent: 94,
    signalStrengthDbm: -68,
    lastHeartbeat: new Date().toISOString(),
    samplingIntervalSec: 15,
    health: {
      packetLossPercent: 0.2,
      driftDetected: false,
      crossValidated: true,
      hardwareTamper: false,
      lastCalibrationDate: '2026-08-15',
      firmwareVersion: 'v2.4.1-edge',
    },
    history: generateHistoricalValues(3.2, 3.5, 12),
  },
  {
    id: 'WL-02',
    name: 'Mid-City Causeway Radar Water Level',
    type: 'water_level',
    location: {
      lat: 13.0645,
      lng: 80.2520,
      elevationMeters: 18.2,
      zoneName: 'Central Bridge District',
      basinName: 'Adyar-Kaveri Hydrological Channel',
    },
    currentValue: 3.8,
    unit: 'm',
    thresholdWarning: 5.5,
    thresholdDanger: 7.0,
    status: 'online',
    batteryPercent: 88,
    signalStrengthDbm: -72,
    lastHeartbeat: new Date().toISOString(),
    samplingIntervalSec: 10,
    health: {
      packetLossPercent: 0.1,
      driftDetected: false,
      crossValidated: true,
      hardwareTamper: false,
      lastCalibrationDate: '2026-08-20',
      firmwareVersion: 'v2.4.1-edge',
    },
    history: generateHistoricalValues(3.5, 4.0, 12),
  },
  {
    id: 'WL-03',
    name: 'Low-Lying Residential Canal Probe',
    type: 'water_level',
    location: {
      lat: 13.0489,
      lng: 80.2415,
      elevationMeters: 7.8,
      zoneName: 'Riverside Settlement Zone B',
      basinName: 'Municipal Drain Trunk A',
    },
    currentValue: 2.1,
    unit: 'm',
    thresholdWarning: 3.8,
    thresholdDanger: 4.8,
    status: 'online',
    batteryPercent: 92,
    signalStrengthDbm: -65,
    lastHeartbeat: new Date().toISOString(),
    samplingIntervalSec: 10,
    health: {
      packetLossPercent: 0.0,
      driftDetected: false,
      crossValidated: true,
      hardwareTamper: false,
      lastCalibrationDate: '2026-08-10',
      firmwareVersion: 'v2.3.9-edge',
    },
    history: generateHistoricalValues(1.9, 2.3, 12),
  },
  {
    id: 'RF-01',
    name: 'Upper Mountain Tipping-Bucket Rain Gauge',
    type: 'rainfall',
    location: {
      lat: 13.1120,
      lng: 80.2310,
      elevationMeters: 65.0,
      zoneName: 'Highland Watershed Ridge',
      basinName: 'Adyar-Kaveri Hydrological Channel',
    },
    currentValue: 14.5,
    unit: 'mm/hr',
    thresholdWarning: 35.0,
    thresholdDanger: 60.0,
    status: 'online',
    batteryPercent: 96,
    signalStrengthDbm: -79,
    lastHeartbeat: new Date().toISOString(),
    samplingIntervalSec: 30,
    health: {
      packetLossPercent: 0.4,
      driftDetected: false,
      crossValidated: true,
      hardwareTamper: false,
      lastCalibrationDate: '2026-07-28',
      firmwareVersion: 'v2.2.0',
    },
    history: generateHistoricalValues(10.0, 16.0, 12),
  },
  {
    id: 'FV-01',
    name: 'Main Canal Doppler Velocity Sensor',
    type: 'flow_velocity',
    location: {
      lat: 13.0610,
      lng: 80.2580,
      elevationMeters: 16.5,
      zoneName: 'Central Bridge District',
      basinName: 'Adyar-Kaveri Hydrological Channel',
    },
    currentValue: 1.25,
    unit: 'm/s',
    thresholdWarning: 2.8,
    thresholdDanger: 4.2,
    status: 'online',
    batteryPercent: 85,
    signalStrengthDbm: -71,
    lastHeartbeat: new Date().toISOString(),
    samplingIntervalSec: 15,
    health: {
      packetLossPercent: 0.1,
      driftDetected: false,
      crossValidated: true,
      hardwareTamper: false,
      lastCalibrationDate: '2026-08-01',
      firmwareVersion: 'v2.4.1-edge',
    },
    history: generateHistoricalValues(1.1, 1.4, 12),
  },
  {
    id: 'SM-01',
    name: 'Floodplain Multi-Depth Soil Moisture Probe',
    type: 'soil_moisture',
    location: {
      lat: 13.0530,
      lng: 80.2470,
      elevationMeters: 11.2,
      zoneName: 'Suburban Flood Basin & Fields',
      basinName: 'Adyar-Kaveri Hydrological Channel',
    },
    currentValue: 58.0,
    unit: '%',
    thresholdWarning: 80.0,
    thresholdDanger: 92.0,
    status: 'online',
    batteryPercent: 91,
    signalStrengthDbm: -66,
    lastHeartbeat: new Date().toISOString(),
    samplingIntervalSec: 60,
    health: {
      packetLossPercent: 0.0,
      driftDetected: false,
      crossValidated: true,
      hardwareTamper: false,
      lastCalibrationDate: '2026-06-19',
      firmwareVersion: 'v2.1.8',
    },
    history: generateHistoricalValues(52.0, 60.0, 12),
  },
  {
    id: 'WS-01',
    name: 'Dam Spillway Hydro-Meteorological Station',
    type: 'weather_station',
    location: {
      lat: 13.0950,
      lng: 80.2850,
      elevationMeters: 48.0,
      zoneName: 'Reservoir Barrage & Control Tower',
      basinName: 'Adyar-Kaveri Hydrological Channel',
    },
    currentValue: 4.2,
    unit: 'm',
    thresholdWarning: 7.5,
    thresholdDanger: 9.2,
    status: 'online',
    batteryPercent: 99,
    signalStrengthDbm: -58,
    lastHeartbeat: new Date().toISOString(),
    samplingIntervalSec: 10,
    health: {
      packetLossPercent: 0.0,
      driftDetected: false,
      crossValidated: true,
      hardwareTamper: false,
      lastCalibrationDate: '2026-08-30',
      firmwareVersion: 'v3.0.0-ind',
    },
    history: generateHistoricalValues(3.8, 4.4, 12),
  },
];

// Designated Safe Evacuation Shelters
const safeZones: EvacuationSafeZone[] = [
  {
    id: 'SAFE-01',
    name: 'Highland Community Center & Evacuation Shelter A',
    lat: 13.0780,
    lng: 80.2350,
    elevationMeters: 52.0,
    capacity: 1200,
    currentOccupancy: 45,
    facilities: ['Emergency Medical Bay', 'High-Power Backup Generator', 'Clean Drinking Water', 'Satellite Radio Link'],
    contactPhone: '+1-800-SAFE-911',
    distanceFromRiverKm: 3.2,
  },
  {
    id: 'SAFE-02',
    name: 'District Polytechnic High Ground Stadium Shelter',
    lat: 13.0910,
    lng: 80.2550,
    elevationMeters: 46.5,
    capacity: 2500,
    currentOccupancy: 120,
    facilities: ['Field Kitchen', 'Helipad Access', 'Ambulance Staging Ground', 'Family Dormitories'],
    contactPhone: '+1-800-SAFE-912',
    distanceFromRiverKm: 2.8,
  },
  {
    id: 'SAFE-03',
    name: 'East Ridge Civic Disaster Shelter C',
    lat: 13.0410,
    lng: 80.2650,
    elevationMeters: 38.0,
    capacity: 800,
    currentOccupancy: 10,
    facilities: ['First Aid Post', 'Ham Radio Station', 'Solar Battery Microgrid'],
    contactPhone: '+1-800-SAFE-913',
    distanceFromRiverKm: 2.1,
  },
];

// Helper for generating initial historical readings
function generateHistoricalValues(min: number, max: number, count: number) {
  const arr = [];
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const t = new Date(now - i * 5 * 60 * 1000).toISOString();
    const val = Number((min + (max - min) * (0.5 + 0.5 * Math.sin(i * 0.4))).toFixed(2));
    arr.push({ timestamp: t, value: val });
  }
  return arr;
}

// Current Simulation State
let currentScenario: SimulationScenario = 'NORMAL_CONDITIONS';
let simulatedSensors: SensorNode[] = JSON.parse(JSON.stringify(initialSensors));
let manualSimulatedTimeOffsetSec = 0;
let simulationStartTime = Date.now();

// Active Emergency Alert state
let activeAlert: EmergencyAlert | null = null;
let alertHistory: EmergencyAlert[] = [];

// Compute ML/Hydrological Early Warning Prediction
function calculatePrediction(sensors: SensorNode[]): PredictionResult {
  const wlSensors = sensors.filter(s => s.type === 'water_level');
  const rfSensors = sensors.filter(s => s.type === 'rainfall');
  const fvSensors = sensors.filter(s => s.type === 'flow_velocity');
  const smSensors = sensors.filter(s => s.type === 'soil_moisture');

  const maxWl = Math.max(...wlSensors.map(s => s.currentValue));
  const avgWl = wlSensors.reduce((acc, s) => acc + s.currentValue, 0) / (wlSensors.length || 1);
  const maxRain = Math.max(...rfSensors.map(s => s.currentValue), 0);
  const maxVelocity = Math.max(...fvSensors.map(s => s.currentValue), 1.0);
  const avgSoilMoisture = smSensors.reduce((acc, s) => acc + s.currentValue, 0) / (smSensors.length || 1);

  // Rate of rise calculation (meters per hour) from last historical values
  let rateOfRiseMetersPerHour = 0;
  for (const s of wlSensors) {
    if (s.history.length >= 2) {
      const last = s.history[s.history.length - 1];
      const prev = s.history[s.history.length - 3] || s.history[s.history.length - 2];
      const dtHours = (new Date(last.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 3600);
      if (dtHours > 0) {
        const delta = (last.value - prev.value) / dtHours;
        if (delta > rateOfRiseMetersPerHour) {
          rateOfRiseMetersPerHour = delta;
        }
      }
    }
  }

  // Hydrological soil saturation coefficient: saturated soil (>=85%) prevents percolation, driving 100% of rain into surface runoff
  const soilSaturationFactor = Math.min(1.0, Math.max(0.1, avgSoilMoisture / 100));
  const runoffMultiplier = 1.0 + (soilSaturationFactor > 0.8 ? (soilSaturationFactor - 0.8) * 4 : 0);

  // Hydraulic kinematic wave surge factor
  const effectiveRiseRate = (rateOfRiseMetersPerHour + (maxRain > 25 ? (maxRain / 50) * runoffMultiplier : 0.05));

  // Critical danger threshold across primary residential zone (WL-02 or WL-03)
  const criticalThreshold = 6.8; // meters
  const warningThreshold = 5.2;  // meters

  let estimatedTimeToFloodMinutes: number | null = null;
  let level: 'NORMAL' | 'WARNING' | 'DANGER' = 'NORMAL';
  let currentRiskScore = 15;

  const distToDanger = criticalThreshold - maxWl;

  if (effectiveRiseRate > 0.1 && distToDanger > 0) {
    // Minutes = (distance in meters / (rise rate in meters / 60))
    const minutesToDanger = (distToDanger / effectiveRiseRate) * 60;
    
    if (minutesToDanger <= 18) {
      estimatedTimeToFloodMinutes = Number(Math.max(1.0, minutesToDanger).toFixed(1));
    } else if (minutesToDanger <= 45) {
      estimatedTimeToFloodMinutes = Number(minutesToDanger.toFixed(1));
    }
  } else if (distToDanger <= 0) {
    estimatedTimeToFloodMinutes = 0;
  }

  // Determine Warning Level based on 15-minute lead time target
  if (
    (estimatedTimeToFloodMinutes !== null && estimatedTimeToFloodMinutes <= 16.0) ||
    maxWl >= criticalThreshold ||
    (maxWl >= 5.8 && effectiveRiseRate >= 3.0)
  ) {
    level = 'DANGER';
    currentRiskScore = Math.min(99, Math.round(75 + (maxWl / criticalThreshold) * 20));
  } else if (
    (estimatedTimeToFloodMinutes !== null && estimatedTimeToFloodMinutes <= 35.0) ||
    maxWl >= warningThreshold ||
    effectiveRiseRate >= 1.5 ||
    maxRain >= 40
  ) {
    level = 'WARNING';
    currentRiskScore = Math.min(74, Math.round(45 + (maxWl / warningThreshold) * 25));
  } else {
    level = 'NORMAL';
    currentRiskScore = Math.min(40, Math.round(10 + (maxWl / warningThreshold) * 20));
  }

  // False Alarm Filter / Multi-Sensor Cross-Validation
  // A true flood event correlates high water level rise with either heavy rainfall, saturated soil, or high upstream velocity.
  const corroboratingSensors: string[] = [];
  let falseAlarmPassed = true;
  let anomalyReasoning = 'Multi-sensor physical telemetry is coherent across river basin nodes.';

  if (effectiveRiseRate > 3.0 && maxRain < 5 && avgSoilMoisture < 45 && maxVelocity < 1.0) {
    // Spike detected without rain or velocity = possible debris blockage or ultrasonic sensor drift
    falseAlarmPassed = false;
    anomalyReasoning = 'WARNING: Rapid level rise detected without upstream rainfall or flow acceleration. Flagged for sensor cross-verification.';
  } else {
    if (maxRain > 25) corroboratingSensors.push('High-intensity rainfall (RF-01)');
    if (avgSoilMoisture > 75) corroboratingSensors.push('High ground soil saturation (SM-01)');
    if (maxVelocity > 2.0) corroboratingSensors.push('High stream discharge velocity (FV-01)');
    if (wlSensors.filter(w => w.currentValue > w.thresholdWarning).length > 1) {
      corroboratingSensors.push('Multiple gauging stations concordant');
    }
  }

  // Trajectory curve computation (History + Projected next 30 minutes in 5-min intervals)
  const trajectory = [];
  const intervals = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];
  for (const min of intervals) {
    let projectedH = maxWl;
    if (min <= 0) {
      projectedH = Math.max(1.5, maxWl + (min / 60) * effectiveRiseRate);
    } else {
      // Hydrodynamic crest saturation formula
      const dampingFactor = Math.exp(-min / 45); // asymptotic leveling as floodplain spills
      projectedH = maxWl + (effectiveRiseRate * (min / 60)) * dampingFactor;
    }
    trajectory.push({
      timeLabel: min === 0 ? 'NOW' : min > 0 ? `+${min}m` : `${min}m`,
      minuteOffset: min,
      waterLevel: Number(projectedH.toFixed(2)),
      dangerLevel: criticalThreshold,
      warningLevel: warningThreshold,
      normalLevel: 3.5,
      isPredicted: min > 0,
    });
  }

  const projectedCrestHeight = Number(Math.max(...trajectory.map(t => t.waterLevel)).toFixed(2));
  const projectedCrestTimeMinutes = 25;

  return {
    currentRiskScore,
    level,
    estimatedTimeToFloodMinutes,
    rateOfRiseMetersPerHour: Number(effectiveRiseRate.toFixed(2)),
    soilSaturationFactor: Number(soilSaturationFactor.toFixed(2)),
    inundationAreaSqKm: level === 'DANGER' ? 8.4 : level === 'WARNING' ? 2.1 : 0.0,
    affectedPopulationEstimate: level === 'DANGER' ? 14800 : level === 'WARNING' ? 3200 : 0,
    confidenceScore: 94,
    projectedCrestHeight,
    projectedCrestTimeMinutes,
    trajectory,
    falseAlarmFilter: {
      passed: falseAlarmPassed,
      crossCheckScore: corroboratingSensors.length >= 2 ? 96 : 78,
      corroboratingSensors,
      anomalyReasoning,
    },
    aiAnalysis: {
      summary: level === 'DANGER' 
        ? 'CRITICAL FLOOD RISK: Telemetry confirms rapid hydraulic surging toward crest within ~15 minutes.' 
        : level === 'WARNING'
        ? 'ELEVATED FLOOD ADVISORY: Catchment runoff accelerating. Water levels approaching secondary spill threshold.'
        : 'NORMAL HYDRAULIC STATUS: River baseline within nominal capacity with adequate catchment reserve.',
      hydrologyAssessment: `Current rise rate ${effectiveRiseRate.toFixed(2)} m/hr with soil saturation at ${(soilSaturationFactor * 100).toFixed(0)}%. Infiltration capacity is heavily diminished in low-lying residential sectors.`,
      meteorologicalForecast: maxRain > 30 ? 'Severe cloudburst convective cell active over upper watershed.' : 'Scattered precipitation with localized showers.',
      recommendedActions: level === 'DANGER'
        ? [
            'Immediate evacuation of riverside settlements in Zone B and low-lying causeway roads.',
            'Activate acoustic edge sirens at 120 dB pattern and dispatch automated SMS/Voice calls.',
            'Deploy first responder barriers at underpasses and low bridges.',
            'Direct evacuees to Safe Shelter A (Highland Community Center, 52m elevation).'
          ]
        : level === 'WARNING'
        ? [
            'Alert residents to secure valuables and stage emergency go-bags.',
            'Pre-position civil defense rescue boats at staging hubs.',
            'Monitor storm drain outfalls for debris obstruction.'
          ]
        : [
            'Maintain continuous telemetry polling at 10-second intervals.',
            'Standard automated sensor health and battery checks ongoing.'
          ],
      timeSensitiveInstructions: level === 'DANGER'
        ? `MOVE IMMEDIATELY: Dangerous inundation predicted in approximately ${estimatedTimeToFloodMinutes || 15} minutes. Do not cross flowing water.`
        : 'Keep mobile devices charged and monitor civil protection frequency 104.5 MHz.',
    },
    offlineSirenAutonomousArmed: true,
  };
}

// Background simulation ticker to emulate realistic IoT variations
function tickSimulation() {
  const now = new Date();

  simulatedSensors = simulatedSensors.map(sensor => {
    let newVal = sensor.currentValue;
    const sType = sensor.type;

    if (currentScenario === 'NORMAL_CONDITIONS') {
      if (sType === 'water_level') {
        newVal = Number((3.2 + Math.sin(Date.now() / 15000) * 0.25).toFixed(2));
      } else if (sType === 'rainfall') {
        newVal = Number((8.0 + Math.random() * 4.0).toFixed(1));
      } else if (sType === 'flow_velocity') {
        newVal = Number((1.2 + Math.sin(Date.now() / 20000) * 0.15).toFixed(2));
      } else if (sType === 'soil_moisture') {
        newVal = Number((55.0 + Math.sin(Date.now() / 30000) * 2.0).toFixed(1));
      }
      sensor.status = 'online';
      sensor.health.driftDetected = false;
    } else if (currentScenario === 'FLASH_FLOOD_15MIN') {
      // Rapid surge scenario: rising quickly towards danger threshold 6.8m within 15 minutes!
      if (sType === 'water_level') {
        const base = sensor.id === 'WL-03' ? 4.5 : 6.6;
        newVal = Number((base + (Math.sin(Date.now() / 8000) * 0.2) + 0.1).toFixed(2));
      } else if (sType === 'rainfall') {
        newVal = Number((68.0 + Math.random() * 15.0).toFixed(1)); // torrential cloudburst
      } else if (sType === 'flow_velocity') {
        newVal = Number((3.8 + Math.random() * 0.5).toFixed(2)); // high torrent
      } else if (sType === 'soil_moisture') {
        newVal = Number((93.5 + Math.random() * 2.0).toFixed(1)); // 94% saturated ground
      }
      sensor.status = newVal >= sensor.thresholdDanger ? 'critical' : 'warning';
    } else if (currentScenario === 'RAPID_CLOUDBURST') {
      if (sType === 'rainfall') {
        newVal = Number((55.0 + Math.random() * 10.0).toFixed(1));
      } else if (sType === 'water_level') {
        newVal = Number((5.4 + Math.sin(Date.now() / 10000) * 0.2).toFixed(2));
      } else if (sType === 'soil_moisture') {
        newVal = 86.0;
      }
      sensor.status = 'warning';
    } else if (currentScenario === 'DAM_SLUICE_RELEASE') {
      if (sType === 'flow_velocity') {
        newVal = 4.4;
      } else if (sType === 'water_level') {
        newVal = Number((6.3 + Math.random() * 0.2).toFixed(2));
      }
      sensor.status = 'warning';
    } else if (currentScenario === 'SENSOR_DRIFT_FAILOVER') {
      if (sensor.id === 'WL-02') {
        // Simulates sensor frozen / drifting anomalously
        newVal = 8.9; 
        sensor.status = 'degraded';
        sensor.health.driftDetected = true;
        sensor.health.packetLossPercent = 14.5;
      }
    }

    // Append to history and maintain last 20 samples
    const history = [...sensor.history];
    if (history.length > 25) history.shift();
    history.push({
      timestamp: now.toISOString(),
      value: newVal,
    });

    return {
      ...sensor,
      currentValue: newVal,
      lastHeartbeat: now.toISOString(),
      history,
    };
  });

  // Evaluate alerts automatically based on calculation
  const prediction = calculatePrediction(simulatedSensors);
  if (prediction.level === 'DANGER' && !activeAlert) {
    triggerAutomatedEmergencyAlert(prediction);
  } else if (prediction.level === 'NORMAL' && activeAlert && activeAlert.level === 'DANGER') {
    // Automatic all-clear can be noted
  }
}

function triggerAutomatedEmergencyAlert(prediction: PredictionResult) {
  const eta = prediction.estimatedTimeToFloodMinutes || 15;
  const newAlert: EmergencyAlert = {
    id: `ALERT-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    level: prediction.level,
    zone: 'Riverside Settlement Zone B & Central Lowlands',
    etaMinutes: eta,
    headline: `⚠️ CRITICAL FLOOD WARNING: Inundation Predicted Within ~${eta} Minutes`,
    message: `Rapid water-level rise detected in your area. Dangerous flooding may occur within approximately ${eta} minutes. Move immediately to higher ground or the nearest designated safe shelter. Do not enter flooded roads or cross flowing water.`,
    recommendedSafetyAction: 'Evacuate immediately via North Ridge Arterial Road to Highland Community Center Shelter A (Elevation 52m). Keep 911/Civil Defense line clear.',
    affectedBasin: 'Adyar-Kaveri Hydrological Channel',
    evacuationRoutes: [
      'North Ridge Evacuation Arterial (Clear, High Ground)',
      'Causeway Bypass Elevated Viaduct (Clear)',
      'East Ridge Foothills Secondary Route (Caution near culverts)',
    ],
    channels: {
      sms: {
        status: 'delivered',
        sentCount: 14850,
        targetCount: 15200,
        sampleText: `EMERGENCY ALERT: Flood predicted in ~${eta} min in your sector. Evacuate to Highland Shelter A now. Do not drive through water.`,
      },
      pushNotification: {
        status: 'broadcasted',
        activeAppSubscribers: 18420,
        geoFencedRadiusKm: 5.5,
      },
      voiceTTS: {
        status: 'in_progress',
        callsQueued: 420,
        script: `Attention: This is the Civil Emergency Authority. Rapid water-level rise detected. Flooding predicted in your area within ${eta} minutes. Evacuate to high ground immediately.`,
      },
      localSirens: {
        status: 'sounding',
        activeSirensCount: 6,
        soundFrequencyHz: 440,
        decibelRating: 125,
        autonomousEdgeFallbackTriggered: false,
      },
      publicLedBoards: {
        status: 'displaying',
        boardsOnline: 8,
        displayMatrixText: `⚠️ FLOOD ALERT: EVACUATE LOW GROUND - ETA ${eta} MIN`,
        colorMode: 'RED_FLASH',
      },
      authorities: {
        status: 'dispatched',
        agencies: [
          { name: 'National Disaster Response Force (NDRF)', contact: 'Command Desk 107', acknowledged: true, eta: '6 min' },
          { name: 'City Fire & Swift Water Rescue', contact: 'Station 4 & 9', acknowledged: true, eta: '4 min' },
          { name: 'District Civil Administration', contact: 'EOC Operations Room', acknowledged: true, eta: 'On Scene' },
        ],
      },
    },
  };

  activeAlert = newAlert;
  alertHistory.unshift(newAlert);
  if (alertHistory.length > 20) alertHistory.pop();
}

// Run simulation interval every 3 seconds
setInterval(tickSimulation, 3000);

// ==========================================
// API ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    scenario: currentScenario,
    edgeNodesCount: simulatedSensors.length,
    activeAlertLevel: activeAlert ? activeAlert.level : 'NORMAL',
  });
});

// Telemetry Data (Current readings, history, health check)
app.get('/api/telemetry', (req, res) => {
  const prediction = calculatePrediction(simulatedSensors);
  res.json({
    timestamp: new Date().toISOString(),
    scenario: currentScenario,
    sensors: simulatedSensors,
    prediction,
    safeZones,
    activeAlert,
    alertHistory,
  });
});

// Update specific sensor manually (for testing threshold trips, drift, or battery)
app.post('/api/sensors/:id/update', (req, res) => {
  const { id } = req.params;
  const { currentValue, status, driftDetected } = req.body;
  
  const sensor = simulatedSensors.find(s => s.id === id);
  if (!sensor) {
    res.status(404).json({ error: 'Sensor not found' });
    return;
  }

  if (typeof currentValue === 'number') sensor.currentValue = currentValue;
  if (status) sensor.status = status;
  if (typeof driftDetected === 'boolean') sensor.health.driftDetected = driftDetected;

  const prediction = calculatePrediction(simulatedSensors);
  res.json({ success: true, sensor, prediction });
});

// Scenario Selection endpoint
app.post('/api/simulation/scenario', (req, res) => {
  const { scenario } = req.body;
  if (scenario) {
    currentScenario = scenario as SimulationScenario;
    if (scenario === 'FLASH_FLOOD_15MIN') {
      const pred = calculatePrediction(simulatedSensors);
      triggerAutomatedEmergencyAlert(pred);
    } else if (scenario === 'NORMAL_CONDITIONS') {
      activeAlert = null;
    }
  }
  tickSimulation();
  res.json({
    success: true,
    scenario: currentScenario,
    prediction: calculatePrediction(simulatedSensors),
  });
});

// Manual Emergency Alert Broadcast
app.post('/api/alerts/broadcast', (req, res) => {
  const { level, customMessage, zone } = req.body;
  const prediction = calculatePrediction(simulatedSensors);
  const targetLevel = level || 'DANGER';
  const eta = prediction.estimatedTimeToFloodMinutes || 15;

  const newAlert: EmergencyAlert = {
    id: `MANUAL-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    level: targetLevel,
    zone: zone || 'Riverside Settlement Zone B & Central Lowlands',
    etaMinutes: eta,
    headline: targetLevel === 'DANGER' 
      ? `⚠️ FLOOD ALERT: Urgent Evacuation Mandate (~${eta} min)`
      : `⚠️ FLOOD ADVISORY: Rapid Rise Detected`,
    message: customMessage || `Rapid water-level rise detected in your area. Flooding may occur within approximately ${eta} minutes. Move immediately to higher ground or the nearest designated safe location. Do not enter flooded roads or cross flowing water.`,
    recommendedSafetyAction: 'Evacuate immediately via North Ridge Arterial Road to Highland Shelter A.',
    affectedBasin: 'Adyar-Kaveri Hydrological Channel',
    evacuationRoutes: [
      'North Ridge Evacuation Arterial (Clear, Elevated)',
      'District Stadium Bypass Expressway',
    ],
    channels: {
      sms: {
        status: 'delivered',
        sentCount: 15400,
        targetCount: 15400,
        sampleText: customMessage || `⚠️ FLOOD ALERT: Flooding predicted within ~${eta}m. Evacuate to high ground immediately.`,
      },
      pushNotification: {
        status: 'broadcasted',
        activeAppSubscribers: 19100,
        geoFencedRadiusKm: 5.5,
      },
      voiceTTS: {
        status: 'in_progress',
        callsQueued: 520,
        script: `Emergency flood announcement. Evacuate to high ground immediately. Flooding imminent within ${eta} minutes.`,
      },
      localSirens: {
        status: targetLevel === 'DANGER' ? 'sounding' : 'idle',
        activeSirensCount: 6,
        soundFrequencyHz: 440,
        decibelRating: 125,
        autonomousEdgeFallbackTriggered: false,
      },
      publicLedBoards: {
        status: 'displaying',
        boardsOnline: 8,
        displayMatrixText: `⚠️ FLOOD ALERT: EVACUATE - ETA ${eta} MIN`,
        colorMode: targetLevel === 'DANGER' ? 'RED_FLASH' : 'AMBER',
      },
      authorities: {
        status: 'dispatched',
        agencies: [
          { name: 'NDRF First Battalion', contact: 'Command Radio 01', acknowledged: true, eta: '5 min' },
          { name: 'Civil Defense Evacuation Unit', contact: 'Hotline 108', acknowledged: true, eta: '3 min' },
        ],
      },
    },
  };

  activeAlert = newAlert;
  alertHistory.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

// Silence / Reset Alert
app.post('/api/alerts/silence', (req, res) => {
  if (activeAlert) {
    activeAlert.channels.localSirens.status = 'idle';
  }
  res.json({ success: true, activeAlert });
});

app.post('/api/alerts/clear', (req, res) => {
  activeAlert = null;
  res.json({ success: true });
});

// Server-side Gemini AI Situational Diagnosis & Flood Bulletin Generator
app.post('/api/ai-diagnose', async (req, res) => {
  const prediction = calculatePrediction(simulatedSensors);
  const ai = getAIClient();

  if (!ai) {
    // Return structured hydrological AI synthesis fallback if no API key is provided
    res.json({
      success: true,
      analysis: {
        headline: prediction.level === 'DANGER' 
          ? 'CRITICAL FLASH FLOOD CREST CONVERGENCE' 
          : prediction.level === 'WARNING'
          ? 'RAPID RUNOFF ACCUMULATION ADVISORY'
          : 'NOMINAL CATCHMENT EQUILIBRIUM',
        hydrologicalAssessment: `The river basin is experiencing an effective surge rate of ${prediction.rateOfRiseMetersPerHour} m/hr with soil saturation at ${(prediction.soilSaturationFactor * 100).toFixed(0)}%. Catchment storage capacity has been depleted, accelerating hydrograph peak timing.`,
        fifteenMinuteWindowPrediction: prediction.estimatedTimeToFloodMinutes !== null
          ? `Estimated ${prediction.estimatedTimeToFloodMinutes} minutes until water levels breach the 6.80m primary revetment embankment.`
          : 'Water levels projected to remain below critical crest thresholds for the next 45+ minutes.',
        evacuationStrategy: 'Prioritize vulnerable elderly and non-ambulatory populations along riverside wards. Utilize North Ridge Arterial Road towards Highland Shelter A (52m AMSL). Strict avoidance of underpass subway corridors.',
        falseAlarmConfidenceCheck: 'Physical correlation confirmed across Doppler flow velocity and upstream precipitation. Probability of false positive is under 4.2%.',
        officialBroadcastScript: `⚠️ FLOOD ALERT: Rapid water-level rise detected in your area. Flooding may occur within approximately ${prediction.estimatedTimeToFloodMinutes || 15} minutes. Move immediately to higher ground or the nearest designated safe location. Do not enter flooded roads or cross flowing water.`
      }
    });
    return;
  }

  try {
    const prompt = `
You are the Chief Hydrologist and Disaster Management AI for the Early Flood Awareness and Warning System (EFAWS).
Analyze the following real-time environmental IoT sensor readings:

Sensors:
${JSON.stringify(simulatedSensors.map(s => ({ id: s.id, name: s.name, val: `${s.currentValue} ${s.unit}`, status: s.status, threshold: s.thresholdDanger })), null, 2)}

Calculated Dynamics:
- Current Warning Level: ${prediction.level}
- Estimated Time to Flood (Minutes): ${prediction.estimatedTimeToFloodMinutes}
- Rate of Rise: ${prediction.rateOfRiseMetersPerHour} m/hr
- Ground Soil Saturation: ${(prediction.soilSaturationFactor * 100).toFixed(0)}%
- Corroborating Sensors: ${prediction.falseAlarmFilter.corroboratingSensors.join(', ')}

Please provide a concise, high-authority tactical disaster response assessment covering:
1. Executive Situation Headline
2. 15-Minute Critical Window Forecast
3. Hydrological Runoff Assessment (how soil saturation and rainfall affect time-to-crest)
4. Prioritized Evacuation & Shelter Directives
5. False Alarm / Cross-Validation Quality Assessment
6. Official Public Emergency Broadcast Bulletin (strictly formatted for radio, LED matrix, and SMS delivery)

Respond in clean JSON format matching these fields:
{
  "headline": string,
  "fifteenMinuteWindowPrediction": string,
  "hydrologicalAssessment": string,
  "evacuationStrategy": string,
  "falseAlarmConfidenceCheck": string,
  "officialBroadcastScript": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Gemini AI diagnosis error:', error);
    res.status(500).json({ error: error.message || 'AI diagnosis failed' });
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Early Flood Warning System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
