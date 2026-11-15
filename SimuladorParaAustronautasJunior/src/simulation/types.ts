export type ModuleId = 'solar' | 'rover' | 'comms' | 'control' | 'iss';
export type ConnectionId = 'solarBus' | 'roverDock' | 'antennaBus' | 'roverRadio' | 'controlBus' | 'issLink';

export interface RoverArm {
  yaw: number;
  shoulder: number;
  elbow: number;
  gripperOpen: boolean;
}

export interface Transmission {
  time: number;
  production: number;
  demand: number;
  stationBattery: number;
  roverBattery: number;
  roverPosition: [number, number];
  dust: number;
  signal: number;
  observations: number;
}

export interface Sample {
  time: number;
  production: number;
  demand: number;
  battery: number;
  signal: number;
}

export interface State {
  elapsed: number;
  paused: boolean;
  solarOn: boolean;
  sunlight: number;
  panelAngle: number;
  dust: number;
  cleaning: boolean;
  battery: number;
  roverBattery: number;
  roverPosition: [number, number];
  roverHeading: number;
  roverMode: 'parked' | 'driving' | 'charging' | 'returning';
  roverDrive: { forward: number; turn: number };
  roverDistance: number;
  roverArm: RoverArm;
  heldRockId: string | null;
  collectedRocks: string[];
  antennaOn: boolean;
  antennaAngle: number;
  packets: number;
  connections: Record<ConnectionId, boolean>;
  pendingRoverSamples: number;
  observations: number;
  lastTransmission: Transmission | null;
  lastRoverTelemetry: { time: number; battery: number; distance: number; position: [number, number] };
  completed: ModuleId[];
  activeGroundStation?: 'madrid' | 'goldstone' | 'canberra';
  issTelemetryActive?: boolean;
  edsVoltage: number;
  edsFrequency: number;
  edsResonance: number;
  edsEmergency: boolean;
  edsScore: number;
  roverAutopilot: boolean;
  events: { id: number; time: number; text: string }[];
  history: Sample[];
}

export type Action =
  | { type: 'tick'; dt: number }
  | { type: 'pause' }
  | { type: 'solar-toggle' }
  | { type: 'sunlight'; value: number }
  | { type: 'panel-angle'; value: number }
  | { type: 'add-dust' }
  | { type: 'clean' }
  | { type: 'eds-set-tuning'; voltage?: number; frequency?: number }
  | { type: 'eds-trigger-emergency' }
  | { type: 'eds-fire-pulse' }
  | { type: 'rover-autopilot-toggle' }
  | { type: 'rover-drive'; forward: number; turn: number }
  | { type: 'rover-stop' }
  | { type: 'rover-return' }
  | { type: 'rover-charge' }
  | { type: 'rover-arm'; joint: 'yaw' | 'shoulder' | 'elbow'; value: number }
  | { type: 'rover-gripper' }
  | { type: 'rover-collect' }
  | { type: 'rover-stow' }
  | { type: 'rover-arm-reset' }
  | { type: 'antenna-toggle' }
  | { type: 'antenna-angle'; value: number }
  | { type: 'transmit' }
  | { type: 'dsn-station'; station: 'madrid' | 'goldstone' | 'canberra' }
  | { type: 'dsn-sync' }
  | { type: 'iss-toggle-link' }
  | { type: 'iss-coordinate'; center: string }
  | { type: 'connection-toggle'; id: ConnectionId }
  | { type: 'reset' };
