/**
 * Modelo de Generación Solar y Almacenamiento Fotovoltaico
 * Derivado de las ecuaciones físicas de ZERO-G (NASA Space Apps Challenge, Team 55 Cancri E).
 * Sin dependencias externas: implementación 100% autocontenida en TypeScript.
 */

export const JUNIOR_ARRAY_PEAK_W = 240;

const clamp = (value: number, low: number, high: number, fallback = low): number =>
  Math.min(high, Math.max(low, Number.isFinite(value) ? value : fallback));

export interface SolarStationPowerOptions {
  enabled: boolean;
  sunlight: number;
  panelAngle: number;
  dust?: number;
  dustEfficiency?: number;
}

export function dustEfficiencyAtCoverage(dust: number): number {
  return Math.max(0, 1 - clamp(dust, 0, 100) / 100 * 0.95);
}

export function calculateSolarGeneration({
  arrays,
  ratedPower,
  light,
  dustEfficiency,
}: {
  arrays: number;
  ratedPower: number;
  light: number;
  dustEfficiency: number;
}): number {
  if (arrays <= 0 || light <= 0 || dustEfficiency <= 0) return 0;
  return Math.round(arrays * ratedPower * clamp(light, 0, 1) * clamp(dustEfficiency, 0, 1) * 10) / 10;
}

/**
 * Calcula la potencia generada por los paneles solares de la estación Selene.
 * Orientación ideal de 45° con respecto al vector de incidencia de luz del simulador.
 */
export function calculateStationPower({
  enabled,
  sunlight,
  panelAngle,
  dust = 0,
  dustEfficiency,
}: SolarStationPowerOptions): number {
  const orientation = Math.cos(((clamp(panelAngle, 0, 90) - 45) * Math.PI) / 180);
  return calculateSolarGeneration({
    arrays: enabled ? 1 : 0,
    ratedPower: JUNIOR_ARRAY_PEAK_W,
    light: (clamp(sunlight, 0, 100) / 100) * orientation,
    dustEfficiency: dustEfficiency === undefined ? dustEfficiencyAtCoverage(dust) : clamp(dustEfficiency, 0, 1),
  });
}

export interface BatteryIntegrationOptions {
  battery: number;
  production: number;
  demand: number;
  seconds: number;
  capacityWh?: number;
  timeScale?: number;
}

/**
 * Integra la reserva de batería (SoC %) en el tiempo utilizando el modelo de balance de energía.
 */
export function integrateBatteryPct({
  battery,
  production,
  demand,
  seconds,
  capacityWh = 100,
  timeScale = 60,
}: BatteryIntegrationOptions): number {
  const capacity = Math.max(0.001, Number.isFinite(capacityWh) ? capacityWh : 100);
  const hours = (clamp(seconds, 0, 30) * clamp(timeScale, 0, 3600)) / 3600;
  const currentWh = (clamp(battery, 0, 100) / 100) * capacity;
  const netWh = (Math.max(0, production) - Math.max(0, demand)) * hours;
  const nextWh = clamp(currentWh + netWh, 0, capacity);
  return clamp((nextWh / capacity) * 100, 0, 100);
}
