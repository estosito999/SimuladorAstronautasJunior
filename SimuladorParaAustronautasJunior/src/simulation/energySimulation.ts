import type { SimulationState } from '../types'

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

export type EnergyInput = Pick<SimulationState, 'solarOn' | 'illumination' | 'battery' | 'habitatOn' | 'antennaOn' | 'roverCharging' | 'maintenance'>

/** Educational units: production and demand are NOT real spacecraft measurements. */
export function getEnergy(state: EnergyInput) {
  const production = state.solarOn && state.maintenance !== 'solar' ? 30 * clamp(state.illumination) / 100 : 0
  const consumption = (state.habitatOn && state.maintenance !== 'habitat' ? 8 : 0)
    + (state.antennaOn && state.maintenance !== 'antenna' ? 6 : 0)
    + (state.roverCharging && state.maintenance !== 'rover' ? 12 : 0)
  const balance = production - consumption
  // With an empty battery a demand larger than production cannot power the bus.
  const powered = consumption === 0 || state.battery > 0 || production >= consumption
  const batteryFlow = balance > 0.05 ? 'charging' : balance < -0.05 ? 'discharging' : 'steady'
  return { production, consumption, balance, powered, batteryFlow } as const
}

export function advanceEnergy(state: EnergyInput, seconds: number): number {
  const dt = clamp(seconds, 0, 1)
  const { production, consumption, powered } = getEnergy(state)
  // An unpowered bus disconnects its loads; solar generation may recharge it.
  const actualDemand = powered ? consumption : 0
  return clamp(state.battery + (production - actualDemand) * dt * 0.055)
}

