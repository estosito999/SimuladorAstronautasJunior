/**
 * Contratos de datos e interfaces para la comunicación bidireccional con Unity.
 * Estandariza la serialización y deserialización de mensajes entre la web (JavaScript/TypeScript)
 * y los scripts de Unity C# (MonoBehaviour).
 */

export interface UnityMessage<T = unknown> {
  target: 'Rover' | 'BaseStation' | 'FlightControl' | 'ISS' | 'Camera' | 'GameManager';
  action: string;
  payload: T;
  timestamp?: number;
}

export interface UnityRoverTelemetry {
  position: [number, number, number];
  heading: number;
  battery: number;
  mode: 'parked' | 'driving' | 'charging' | 'returning';
  arm: {
    yaw: number;
    shoulder: number;
    elbow: number;
    gripperOpen: boolean;
  };
  heldRockId: string | null;
  collectedRocks: string[];
}

export interface UnityBaseStationState {
  solarPowerW: number;
  demandW: number;
  batteryPct: number;
  dustPct: number;
  isCleaning: boolean;
  antennaElevationDeg: number;
  antennaOn: boolean;
  dsnSignalPct: number;
  connections: Record<string, boolean>;
}

export interface UnityFlightControlState {
  activeGroundStation: 'madrid' | 'goldstone' | 'canberra';
  transmittedPackets: number;
  channelStates: Array<{
    id: string;
    name: string;
    value: string;
    status: 'nominal' | 'warning' | 'alert';
  }>;
}

export interface UnityISSState {
  altitudeKm: number;
  orbitalSpeedKmH: number;
  inclinationDeg: number;
  orbitalPeriodMin: number;
  solarGenerationKw: number;
  lifeSupportPressureKPa: number;
  interStationLinkActive: boolean;
  activeGroundCenter: string;
}

export interface UnityCameraCommand {
  mode: 'overview' | 'follow' | 'control' | 'iss';
  action?: 'reset' | 'left' | 'right' | 'in' | 'out';
  targetPosition?: [number, number, number];
}
