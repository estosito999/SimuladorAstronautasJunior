export type ModuleId = 'solar' | 'rover' | 'comms';
export type ConnectionId = 'solarBus' | 'roverDock' | 'antennaBus' | 'roverRadio';

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
  antennaOn: boolean;
  antennaAngle: number;
  packets: number;
  connections: Record<ConnectionId, boolean>;
  pendingRoverSamples: number;
  observations: number;
  lastTransmission: Transmission | null;
  lastRoverTelemetry: { time: number; battery: number; distance: number; position: [number, number] };
  completed: ModuleId[];
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
  | { type: 'rover-drive'; forward: number; turn: number }
  | { type: 'rover-stop' }
  | { type: 'rover-return' }
  | { type: 'rover-charge' }
  | { type: 'antenna-toggle' }
  | { type: 'antenna-angle'; value: number }
  | { type: 'transmit' }
  | { type: 'connection-toggle'; id: ConnectionId }
  | { type: 'reset' };
