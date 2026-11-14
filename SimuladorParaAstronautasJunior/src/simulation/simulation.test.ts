import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { advanceEnergy, getEnergy } from './energySimulation'
import { getSignal } from './communicationSimulation'
import { getDeviceStatus } from './equipmentSimulation'
import { canCompleteRoute, ROVER_HOME } from './roverSimulation'
import { initialSimulationState, useSimulatorStore } from '../store/useSimulatorStore'

const advance = (seconds: number) => {
  for (let index = 0; index < seconds * 10; index += 1) useSimulatorStore.getState().tick(0.1)
}

beforeEach(() => useSimulatorStore.setState(initialSimulationState()))
afterEach(() => vi.unstubAllGlobals())

describe('educational energy model', () => {
  it('uses a stored reserve when production is smaller than demand', () => {
    const state = { ...initialSimulationState(), solarOn: false, antennaOn: true }
    expect(getEnergy(state).production).toBe(0)
    expect(getEnergy(state).consumption).toBe(14)
    expect(advanceEnergy(state, 1)).toBeLessThan(state.battery)
  })

  it('never creates electricity with no light, no reserve and no panels', () => {
    const state = { ...initialSimulationState(), solarOn: false, battery: 0, antennaOn: true }
    expect(getEnergy(state).powered).toBe(false)
    expect(advanceEnergy(state, 1)).toBe(0)
    expect(getSignal({ ...state, antennaAngle: 45 })).toBe(0)
  })

  it('switches consumers off after reserve depletion and lets the station recover', () => {
    useSimulatorStore.setState({ solarOn: false, battery: 0.02, habitatOn: true, antennaOn: true })
    advance(1)
    const depleted = useSimulatorStore.getState()
    expect(depleted.battery).toBe(0)
    expect(depleted.habitatOn).toBe(false)
    expect(depleted.antennaOn).toBe(false)
    depleted.toggleAntenna()
    expect(useSimulatorStore.getState().antennaOn).toBe(false)
    depleted.toggleSolar()
    advance(1)
    expect(useSimulatorStore.getState().battery).toBeGreaterThan(0)
  })

  it('a rover charge consumes station electricity and cannot charge without a source', () => {
    useSimulatorStore.setState({ battery: 0, solarOn: false, habitatOn: false })
    useSimulatorStore.getState().rechargeRover()
    expect(useSimulatorStore.getState().roverCharging).toBe(false)
    useSimulatorStore.setState({ battery: 82 })
    useSimulatorStore.getState().rechargeRover()
    const before = useSimulatorStore.getState().battery
    advance(2)
    expect(useSimulatorStore.getState().roverBattery).toBeGreaterThan(78)
    expect(useSimulatorStore.getState().battery).toBeLessThan(before)
  })
})

describe('communications', () => {
  it('reports equipment status with the same signal and maintenance rules', () => {
    const state = { ...initialSimulationState(), antennaOn: true }
    expect(getDeviceStatus(state, 'antenna')).toBe('Necesita revisión')
    expect(getDeviceStatus({ ...state, antennaAngle: 45 }, 'antenna')).toBe('Funcionando')
    expect(getDeviceStatus({ ...state, maintenance: 'antenna' }, 'antenna')).toBe('En mantenimiento')
  })

  it('requires power, alignment and an uninterrupted connection', () => {
    const aligned = { ...initialSimulationState(), antennaOn: true, antennaAngle: 45 }
    expect(getSignal(aligned)).toBe(100)
    expect(getSignal({ ...aligned, antennaAngle: 0 })).toBe(0)
    expect(getSignal({ ...aligned, interrupted: true })).toBe(0)
    expect(getSignal({ ...aligned, maintenance: 'antenna' })).toBe(0)
  })
})

describe('complete learning practices', () => {
  it('requires a real stable powered interval for the solar practice', () => {
    useSimulatorStore.getState().startPractice('solar')
    advance(5)
    expect(useSimulatorStore.getState().completedPractices).not.toContain('solar')
    useSimulatorStore.getState().toggleSolar()
    useSimulatorStore.getState().toggleHabitat()
    useSimulatorStore.getState().toggleAntenna()
    advance(3)
    expect(useSimulatorStore.getState().completedPractices).not.toContain('solar')
    advance(2)
    expect(useSimulatorStore.getState().completedPractices).toContain('solar')
    expect(useSimulatorStore.getState().feedback?.learned).toBeTruthy()
  })

  it('blocks an unsafe route and completes only after observation and return', () => {
    useSimulatorStore.getState().startPractice('rover')
    expect(canCompleteRoute(78, 'ridge')).toBe(false)
    useSimulatorStore.getState().chooseRoute('ridge')
    useSimulatorStore.getState().dispatchRover()
    expect(useSimulatorStore.getState().roverPhase).toBe('idle')
    expect(useSimulatorStore.getState().feedback?.kind).toBe('warning')
    useSimulatorStore.getState().chooseRoute('crater')
    useSimulatorStore.getState().dispatchRover()
    advance(5)
    expect(useSimulatorStore.getState().roverPosition).not.toEqual(ROVER_HOME)
    expect(useSimulatorStore.getState().completedPractices).not.toContain('rover')
    advance(16)
    expect(useSimulatorStore.getState().roverPosition).toEqual(ROVER_HOME)
    expect(useSimulatorStore.getState().roverBattery).toBeCloseTo(54, 4)
    expect(useSimulatorStore.getState().completedPractices).toContain('rover')
  })

  it('does not complete rover learning by returning before observing', () => {
    useSimulatorStore.getState().startPractice('rover')
    useSimulatorStore.getState().dispatchRover()
    advance(2)
    useSimulatorStore.getState().returnRover()
    advance(10)
    expect(useSimulatorStore.getState().roverPhase).toBe('idle')
    expect(useSimulatorStore.getState().completedPractices).not.toContain('rover')
  })

  it('requires a successful message, preserves previous progress and supports repeat practice', () => {
    useSimulatorStore.setState({ completedPractices: ['solar'] })
    useSimulatorStore.getState().startPractice('antenna')
    useSimulatorStore.getState().sendMessage()
    expect(useSimulatorStore.getState().completedPractices).toEqual(['solar'])
    useSimulatorStore.getState().toggleAntenna()
    useSimulatorStore.getState().setAntennaAngle(45)
    useSimulatorStore.getState().sendMessage()
    expect(useSimulatorStore.getState().completedPractices).toEqual(['solar', 'antenna'])
    useSimulatorStore.getState().resetPractice()
    expect(useSimulatorStore.getState().activePractice).toBe('antenna')
    expect(useSimulatorStore.getState().antennaOn).toBe(false)
    expect(useSimulatorStore.getState().completedPractices).toEqual(['solar', 'antenna'])
  })

  it('temporarily disconnects maintenance equipment and restores availability', () => {
    useSimulatorStore.getState().startMaintenance('solar')
    expect(getEnergy(useSimulatorStore.getState()).production).toBe(0)
    advance(9)
    expect(useSimulatorStore.getState().maintenance).toBeNull()
    expect(getEnergy(useSimulatorStore.getState()).production).toBeGreaterThan(0)
  })
})

describe('local learning persistence', () => {
  it('does not rewrite identical learning data while the simulation ticks', () => {
    const write = vi.fn()
    vi.stubGlobal('localStorage', { setItem: write })
    useSimulatorStore.getState().welcome()
    expect(write).toHaveBeenCalledTimes(1)
    advance(5)
    expect(write).toHaveBeenCalledTimes(1)
    useSimulatorStore.getState().selectDevice('solar')
    expect(write).toHaveBeenCalledTimes(2)
  })

  it('stores completed learning without resuming an old live simulation', async () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (name: string) => values.get(name) ?? null,
      setItem: (name: string, value: string) => values.set(name, value),
      removeItem: (name: string) => values.delete(name),
    })
    useSimulatorStore.setState({ welcomed: true, completedPractices: ['solar'], readLessons: ['solar', 'rover'], battery: 13, roverPhase: 'outbound' })
    const saved = JSON.parse(values.get('lunar-training-learning-v1') ?? '{}')
    expect(saved.state.completedPractices).toEqual(['solar'])
    expect(saved.state.battery).toBeUndefined()
    expect(saved.state.roverPhase).toBeUndefined()
    values.set('lunar-training-learning-v1', JSON.stringify({ version: 1, state: { welcomed: true, completedPractices: ['solar', 'invalid', 'solar'], readLessons: ['antenna'] } }))
    await useSimulatorStore.persist.rehydrate()
    expect(useSimulatorStore.getState().welcomed).toBe(true)
    expect(useSimulatorStore.getState().completedPractices).toEqual(['solar'])
    expect(useSimulatorStore.getState().readLessons).toEqual(['antenna'])
  })

  it('continues functioning and reports disabled local storage', async () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('Storage unavailable') } })
    expect(() => useSimulatorStore.getState().welcome()).not.toThrow()
    await Promise.resolve()
    expect(useSimulatorStore.getState().welcomed).toBe(true)
    expect(useSimulatorStore.getState().persistenceError).toBe(true)
  })
})
