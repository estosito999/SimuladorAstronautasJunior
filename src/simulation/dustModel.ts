/**
 * Modelo de Mitigación de Polvo por Escudo Electrodinámico (EDS)
 * Derivado de las ecuaciones de Dust-Shield Digital Twin.
 * Implementación 100% autocontenida en TypeScript.
 */

export const EDS_K = 0.03;
export const MAX_POWER_W = 240;

const clamp = (value: number, low: number, high: number, fallback = low): number =>
  Math.min(high, Math.max(low, Number.isFinite(value) ? value : fallback));

/**
 * Atenuación exponencial de transmisión óptica debido a cobertura de regolito:
 * T(c) = exp(-k * cobertura)
 */
export function calculateDustEfficiency(coverage: number): number {
  return Math.exp(-EDS_K * clamp(coverage, 0, 100));
}

export const BASE_POWER_W = MAX_POWER_W * calculateDustEfficiency(100);

export function calculateDustPower(coverage: number, peakPowerW = MAX_POWER_W) {
  const transmission = calculateDustEfficiency(coverage);
  const peak = Math.max(0, Number.isFinite(peakPowerW) ? peakPowerW : MAX_POWER_W);
  const currentPowerW = peak * transmission;
  const baselinePowerW = peak * calculateDustEfficiency(100);
  return {
    transmission,
    currentPowerW,
    baselinePowerW,
    recoveredPowerW: Math.max(0, currentPowerW - baselinePowerW),
  };
}

/**
 * Velocidad de deriva electrodinámica de partículas bajo ondas viajeras de alta frecuencia.
 */
export function getClearingSpeed(voltage = 1250, phase = 3): number {
  const multiplier = phase === 3 ? 1.5 : 0.8;
  return (clamp(voltage, 0, 2000) / 2000) * multiplier * 0.06;
}

/**
 * Cálculo del índice de acoplamiento y resonancia electrodinámica de Coulomb (0-100%).
 * Resonancia óptima calibrada para regolito lunar: 60 Hz y 1500 V.
 */
export function calculateEdsResonance(voltage = 1250, frequency = 60): number {
  const fDiff = Math.abs(clamp(frequency, 10, 100) - 60);
  const vDiff = Math.abs(clamp(voltage, 500, 2000) - 1500);
  const fScore = Math.max(0, 1 - fDiff / 25);
  const vScore = Math.max(0, 1 - vDiff / 500);
  return Math.round(fScore * vScore * 100);
}

export function shouldStopCleaning(coverage: number, threshold = 1): boolean {
  return clamp(coverage, 0, 100) <= clamp(threshold, 0, 100);
}

export interface AdvanceDustOptions {
  coverage: number;
  active: boolean;
  powered: boolean;
  voltage?: number;
  phase?: number;
}

/**
 * Calcula la remoción progresiva de polvo en el intervalo de tiempo `seconds`.
 * Si el sistema no tiene energía suficiente, la limpieza se detiene inmediatamente.
 */
export function advanceDust(
  { coverage, active, powered, voltage = 1250, phase = 3 }: AdvanceDustOptions,
  seconds: number
) {
  const before = clamp(coverage, 0, 100);
  const duration = clamp(seconds, 0, 30);
  if (!active || !powered || duration === 0) {
    return {
      coverage: before,
      active: Boolean(active && powered && before > 0),
      removed: 0,
    };
  }

  const speed = getClearingSpeed(voltage, phase);
  const remaining = Math.max(0, before - speed * 160 * duration);
  const next = remaining < 0.000001 ? 0 : remaining;
  return {
    coverage: next,
    active: !shouldStopCleaning(next, 0),
    removed: before - next,
  };
}
