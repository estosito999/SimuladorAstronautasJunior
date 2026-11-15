import { House, RadioTower, Sun, Truck } from 'lucide-react'
import type { DeviceId, SimulatorStore } from '../../types'
import { getDeviceStatus } from '../../store/useSimulatorStore'

export const devices = {
  solar: { name: 'Sistema solar', short: 'Energía solar', subtitle: 'La energía que pone todo en marcha', icon: Sun, color: 'orange' },
  rover: { name: 'Rover explorador', short: 'Rover lunar', subtitle: 'Nuestro robot de investigación', icon: Truck, color: 'blue' },
  antenna: { name: 'Comunicaciones', short: 'Antena', subtitle: 'Un puente entre la Luna y la Tierra', icon: RadioTower, color: 'purple' },
  habitat: { name: 'Hábitat lunar', short: 'Hábitat', subtitle: 'Un lugar para investigar y aprender', icon: House, color: 'green' },
}

export function deviceStatus(id: DeviceId, s: SimulatorStore) {
  return getDeviceStatus(s, id)
}
