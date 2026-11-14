import type { DeviceId, DeviceStatus, SimulationState } from '../types'
import { getSignal } from './communicationSimulation'
import { getEnergy } from './energySimulation'

export function getDeviceStatus(state: SimulationState, id: DeviceId): DeviceStatus {
  if (state.maintenance === id) return 'En mantenimiento'
  if (id === 'solar') return !state.solarOn ? 'Apagado' : state.illumination < 15 ? 'Necesita revisión' : 'Funcionando'
  if (id === 'rover') return state.roverBattery < 15 ? 'Necesita revisión' : 'Funcionando'
  const on = id === 'antenna' ? state.antennaOn : state.habitatOn
  if (!on) return 'Apagado'
  if (!getEnergy(state).powered || (id === 'antenna' && getSignal(state) < 75)) return 'Necesita revisión'
  return 'Funcionando'
}
