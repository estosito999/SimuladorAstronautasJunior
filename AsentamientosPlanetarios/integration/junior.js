import { calculateSolarGeneration, calculatePowerDemand, advancePowerStore, dustEfficiencyAtCoverage } from '../src/game/powerModel.js';

export { calculateSolarGeneration, calculatePowerDemand, advancePowerStore, dustEfficiencyAtCoverage };
export { makeTerrain } from '../src/scenes/terrain.js';

export const SOURCE_REPOSITORY = 'ZERO-G-Junior-Astronaut-Trainer';
export const JUNIOR_ARRAY_PEAK_W = 240;

const clamp = (value, low, high, fallback = low) => Math.min(high, Math.max(low, Number.isFinite(value) ? value : fallback));

/**
 * Adapts ZERO-G's shared generation equation to the junior station.
 * dustEfficiency may be supplied by Dust-Shield's exponential attenuation model.
 * 45 degrees is the exercise's light-facing orientation, not a lunar constant.
 */
export function calculateStationPower({ enabled, sunlight, panelAngle, dust = 0, dustEfficiency }) {
  const orientation = Math.cos((clamp(panelAngle, 0, 90) - 45) * Math.PI / 180);
  return calculateSolarGeneration({
    arrays: enabled ? 1 : 0,
    ratedPower: JUNIOR_ARRAY_PEAK_W,
    light: clamp(sunlight, 0, 100) / 100 * orientation,
    dustEfficiency: dustEfficiency === undefined ? dustEfficiencyAtCoverage(dust) : clamp(dustEfficiency, 0, 1),
  });
}

/** Wh based adapter over the same store-balance equation used by ZERO-G. */
export function integrateBatteryPct({ battery, production, demand, seconds, capacityWh = 100, timeScale = 60 }) {
  const capacity = Math.max(0.001, Number.isFinite(capacityWh) ? capacityWh : 100);
  const hours = clamp(seconds, 0, 30) * clamp(timeScale, 0, 3600) / 3600;
  const result = advancePowerStore({
    capacity,
    stored: clamp(battery, 0, 100) / 100 * capacity,
    generation: Math.max(0, production) * hours,
    demand: Math.max(0, demand) * hours,
  });
  return clamp(result.stored / capacity * 100, 0, 100);
}
