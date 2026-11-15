import { useMemo } from 'react';
import { powerForecast, commLevel } from '../game/resourceSystem.js';
import { radiationLevel } from '../utils/calculations.js';

/** Derived, display-ready numbers for the HUD. */
export function useResources(mission) {
  return useMemo(() => {
    if (!mission) return null;
    return { forecast: powerForecast(mission), comm: commLevel(mission), radiation: radiationLevel(mission.resources.radiation) };
  }, [mission]);
}
