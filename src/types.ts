export type SensorType = 
  | 'water_level' 
  | 'rainfall' 
  | 'flow_velocity' 
  | 'soil_moisture' 
  | 'weather_station';

export type AlertLevel = 'NORMAL' | 'WARNING' | 'DANGER';

export interface GeoLocation {
  lat: number;
  lng: number;
  elevationMeters: number;
  zoneName: string;
  basinName: string;
}

export interface SensorNode {
  id: string;
  name: string;
  type: SensorType;
  location: GeoLocation;
  currentValue: number;
  unit: string;
  thresholdWarning: number;
  thresholdDanger: number;
  status: 'online' | 'warning' | 'critical' | 'degraded' | 'offline';
  batteryPercent: number;
  signalStrengthDbm: number; // e.g. -68 dBm (LoRa / 4G)
  lastHeartbeat: string;
  samplingIntervalSec: number;
  health: {
    packetLossPercent: number;
    driftDetected: boolean;
    crossValidated: boolean;
    hardwareTamper: boolean;
    lastCalibrationDate: string;
    firmwareVersion: string;
  };
  history: Array<{
    timestamp: string;
    value: number;
    predicted?: boolean;
  }>;
}

export interface PredictionResult {
  currentRiskScore: number; // 0 to 100%
  level: AlertLevel;
  estimatedTimeToFloodMinutes: number | null; // e.g. 14.2 minutes
  rateOfRiseMetersPerHour: number;
  soilSaturationFactor: number; // 0.0 to 1.0
  inundationAreaSqKm: number;
  affectedPopulationEstimate: number;
  confidenceScore: number; // e.g. 96%
  projectedCrestHeight: number;
  projectedCrestTimeMinutes: number;
  trajectory: Array<{
    timeLabel: string;
    minuteOffset: number;
    waterLevel: number;
    dangerLevel: number;
    warningLevel: number;
    normalLevel: number;
    isPredicted: boolean;
  }>;
  falseAlarmFilter: {
    passed: boolean;
    crossCheckScore: number;
    corroboratingSensors: string[];
    anomalyReasoning: string;
  };
  aiAnalysis: {
    summary: string;
    hydrologyAssessment: string;
    meteorologicalForecast: string;
    recommendedActions: string[];
    timeSensitiveInstructions: string;
  };
  offlineSirenAutonomousArmed: boolean;
}

export interface EmergencyChannelStatus {
  sms: {
    status: 'idle' | 'queued' | 'dispatching' | 'delivered';
    sentCount: number;
    targetCount: number;
    sampleText: string;
  };
  pushNotification: {
    status: 'idle' | 'broadcasted';
    activeAppSubscribers: number;
    geoFencedRadiusKm: number;
  };
  voiceTTS: {
    status: 'idle' | 'in_progress' | 'completed';
    callsQueued: number;
    script: string;
  };
  localSirens: {
    status: 'idle' | 'sounding' | 'testing';
    activeSirensCount: number;
    soundFrequencyHz: number;
    decibelRating: number;
    autonomousEdgeFallbackTriggered: boolean;
  };
  publicLedBoards: {
    status: 'idle' | 'displaying';
    boardsOnline: number;
    displayMatrixText: string;
    colorMode: 'GREEN' | 'AMBER' | 'RED_FLASH';
  };
  authorities: {
    status: 'idle' | 'notified' | 'dispatched';
    agencies: Array<{
      name: string;
      contact: string;
      acknowledged: boolean;
      eta: string;
    }>;
  };
}

export interface EmergencyAlert {
  id: string;
  timestamp: string;
  level: AlertLevel;
  zone: string;
  etaMinutes: number | null;
  headline: string;
  message: string;
  recommendedSafetyAction: string;
  affectedBasin: string;
  evacuationRoutes: string[];
  channels: EmergencyChannelStatus;
}

export interface EvacuationSafeZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevationMeters: number;
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  contactPhone: string;
  distanceFromRiverKm: number;
}

export type SimulationScenario = 
  | 'NORMAL_CONDITIONS'
  | 'FLASH_FLOOD_15MIN'
  | 'RAPID_CLOUDBURST'
  | 'DAM_SLUICE_RELEASE'
  | 'SENSOR_DRIFT_FAILOVER';
