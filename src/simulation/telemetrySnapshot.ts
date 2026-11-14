import { metrics } from './engine';
import type { State } from './types';

export interface TelemetrySnapshotInput {
  time: number;
  production: number;
  demand: number;
  battery: number;
  roverBattery: number;
  signal: number;
  dust: number;
  roverDistance: number;
  observations: number;
  packets: number;
}

/** La telemetría de control de vuelo publica las lecturas de los subsistemas y del rover. */
export function missionTelemetrySnapshot(state: State): TelemetrySnapshotInput {
  const m = metrics(state);
  return {
    time: Math.floor(state.elapsed),
    production: m.production,
    demand: m.demand,
    battery: state.battery,
    roverBattery: state.lastRoverTelemetry.battery,
    signal: m.signal,
    dust: state.dust,
    roverDistance: state.lastRoverTelemetry.distance,
    observations: state.observations,
    packets: state.packets,
  };
}
