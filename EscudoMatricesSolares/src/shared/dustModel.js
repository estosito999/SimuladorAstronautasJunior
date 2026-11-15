/**
 * Equations extracted from the original Dust-Shield main.js.
 * These are demo parameters, not a validated regolith or high-voltage model.
 * No general license is asserted for the original repository: local use only.
 */
export const EDS_K = 0.03;
export const MAX_POWER_W = 240;

const clamp = (value, low, high, fallback = low) => Math.min(high, Math.max(low, Number.isFinite(value) ? value : fallback));

export function calculateDustEfficiency(coverage) {
  return Math.exp(-EDS_K * clamp(coverage, 0, 100));
}

export const BASE_POWER_W = MAX_POWER_W * calculateDustEfficiency(100);

export function calculateDustPower(coverage, peakPowerW = MAX_POWER_W) {
  const transmission = calculateDustEfficiency(coverage);
  const peak = Math.max(0, Number.isFinite(peakPowerW) ? peakPowerW : MAX_POWER_W);
  const currentPowerW = peak * transmission;
  const baselinePowerW = peak * calculateDustEfficiency(100);
  return { transmission, currentPowerW, baselinePowerW, recoveredPowerW: Math.max(0, currentPowerW - baselinePowerW) };
}

/** Original particle drift speed used by the Three.js demo. */
export function getClearingSpeed(voltage = 1250, phase = 3) {
  const multiplier = phase === 3 ? 1.5 : 0.8;
  return clamp(voltage, 0, 2000) / 2000 * multiplier * 0.06;
}

export function shouldStopCleaning(coverage, threshold = 1) {
  return clamp(coverage, 0, 100) <= clamp(threshold, 0, 100);
}

/** Original energy recovered integral; seconds here are physical demo seconds. */
export function accumulateRecoveredEnergy(energyWh, { active, coverage, recoveredPowerW }, seconds) {
  const previous = Math.max(0, Number.isFinite(energyWh) ? energyWh : 0);
  if (!active || coverage <= 0 || recoveredPowerW <= 0) return previous;
  return previous + Math.max(0, recoveredPowerW) * clamp(seconds, 0, 30) / 3600;
}

/**
 * Junior coverage adapter. It reuses the particle demo's voltage/phase speed,
 * with a didactic conversion from drift speed to percentage points per second.
 * The caller supplies station power; an unpowered cleaner cannot remove dust.
 */
export function advanceDust({ coverage, active, powered, voltage = 1250, phase = 3 }, seconds) {
  const before = clamp(coverage, 0, 100);
  const duration = clamp(seconds, 0, 30);
  if (!active || !powered || duration === 0) return { coverage: before, active: Boolean(active && powered && before > 0), removed: 0 };
  const remaining = Math.max(0, before - getClearingSpeed(voltage, phase) * 160 * duration);
  const next = remaining < 0.000001 ? 0 : remaining;
  return { coverage: next, active: !shouldStopCleaning(next, 0), removed: before - next };
}
