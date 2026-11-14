import type { SimulationState } from '../types'
import { clamp, getEnergy } from './energySimulation'

export const ANTENNA_TARGET = 45

/** Deliberately simplified alignment exercise, not a radio propagation model. */
export function getSignal(state: SimulationState): number {
  if (!state.antennaOn || state.interrupted || state.maintenance === 'antenna' || !getEnergy(state).powered) return 0
  return Math.round(clamp(100 - Math.abs(state.antennaAngle - ANTENNA_TARGET) * 2.3))
}

export const canSendMessage = (state: SimulationState) => getSignal(state) >= 75
