/**
 * Shared power equations extracted from resourceSystem.js.
 * ZERO-G keeps its original cycle units; the junior adapter supplies W / Wh.
 * ZERO-G source is MIT licensed; see ../../LICENSE.
 */
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const nonnegative = value => Math.max(0, finite(value));

export function dustEfficiencyAtCoverage(coverage) {
  return 1 - 0.55 * Math.min(100, Math.max(0, finite(coverage))) / 100;
}

export function calculateSolarGeneration({ arrays, ratedPower, light, dustEfficiency, effects = 1 }) {
  return nonnegative(arrays) * nonnegative(ratedPower) * nonnegative(light)
    * Math.min(1, nonnegative(dustEfficiency)) * nonnegative(effects);
}

export function calculatePowerDemand({ base, science = 0, multiplier = 1 }) {
  const factor = nonnegative(multiplier);
  const baseInput = nonnegative(base), scienceInput = nonnegative(science);
  return { base: baseInput * factor, science: scienceInput * factor, total: (baseInput + scienceInput) * factor };
}

/** Preserve the cycle resource engine's supply ratio and storage limit. */
export function advancePowerStore({ capacity, stored, generation, demand }) {
  const cap = Math.max(Number.EPSILON, nonnegative(capacity));
  const available = Math.min(cap, nonnegative(stored)) + nonnegative(generation);
  const requested = nonnegative(demand);
  return {
    stored: Math.min(cap, Math.max(0, available - requested)),
    ratio: requested === 0 ? 1 : Math.min(1, available / requested),
  };
}
