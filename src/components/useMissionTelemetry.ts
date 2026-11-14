import { useEffect, useState } from 'react';
import { defaultTelemetryEngine, type TelemetrySnapshot } from '../telemetry/telemetryEngine';
import { missionTelemetrySnapshot } from '../simulation/telemetrySnapshot';
import type { State } from '../simulation/types';

/** Proveedor reactivo de telemetría Open MCT para la estación lunar Selene. */
export function useMissionTelemetry(state: State) {
  const [engine] = useState(() => defaultTelemetryEngine);
  const [history, setHistory] = useState<TelemetrySnapshot[]>(() => engine.getHistory());

  useEffect(() => {
    return engine.subscribe(() => {
      setHistory(engine.getHistory());
    });
  }, [engine]);

  useEffect(() => {
    engine.publish(missionTelemetrySnapshot(state));
  }, [state, engine]);

  return { source: engine, history };
}
