export const SOURCE_REPOSITORY: 'ZERO-G-Junior-Astronaut-Trainer';
export const JUNIOR_ARRAY_PEAK_W: 240;
export interface TerrainCrater { x: number; z: number; r: number; depth: number }
export function makeTerrain(kind: 'moon' | 'mars'): { height: (x: number, z: number) => number; craters: TerrainCrater[] };
export function dustEfficiencyAtCoverage(coverage: number): number;
export function calculateSolarGeneration(input: { arrays: number; ratedPower: number; light: number; dustEfficiency: number; effects?: number }): number;
export function calculatePowerDemand(input: { base: number; science?: number; multiplier?: number }): { base: number; science: number; total: number };
export function advancePowerStore(input: { capacity: number; stored: number; generation: number; demand: number }): { stored: number; ratio: number };
export function calculateStationPower(input: { enabled: boolean; sunlight: number; panelAngle: number; dust?: number; dustEfficiency?: number }): number;
export function integrateBatteryPct(input: { battery: number; production: number; demand: number; seconds: number; capacityWh?: number; timeScale?: number }): number;
