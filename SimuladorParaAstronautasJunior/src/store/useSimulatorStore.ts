import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { DeviceId, ModuleId, SimulationState, SimulatorStore } from '../types'
import { instructor } from '../education/instructor'
import { practices } from '../education/practices'
import { advanceEnergy, clamp, getEnergy } from '../simulation/energySimulation'
import { canSendMessage, getSignal } from '../simulation/communicationSimulation'
import { atRoverBase, canCompleteRoute, getRoute, lerpPosition, ROVER_HOME } from '../simulation/roverSimulation'

export { getEnergy, getSignal }
export { getDeviceStatus } from '../simulation/equipmentSimulation'

let storageFailed = false
let lastStorage: Storage | undefined
let lastSavedValue: string | null = null
function reportStorageFailure() {
  if (storageFailed) return
  storageFailed = true
  queueMicrotask(() => useSimulatorStore.setState({ persistenceError: true }))
}

const storage: StateStorage = {
  getItem(name) {
    try {
      if (typeof localStorage === 'undefined') return null
      const value = localStorage.getItem(name)
      lastStorage = localStorage; lastSavedValue = value
      return value
    }
    catch { reportStorageFailure(); return null }
  },
  setItem(name, value) {
    try {
      if (typeof localStorage === 'undefined') return
      // Simulation ticks do not change learning; avoid synchronous disk writes on each frame.
      if (lastStorage === localStorage && lastSavedValue === value) return
      localStorage.setItem(name, value)
      lastStorage = localStorage; lastSavedValue = value
    }
    catch { reportStorageFailure() }
  },
  removeItem(name) {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(name); lastSavedValue = null }
    catch { reportStorageFailure() }
  },
}

export function initialSimulationState(): SimulationState {
  return {
    selected: null, view: 'overview', welcomed: false, persistenceError: storageFailed,
    stage: 'learn', solarOn: true, illumination: 85, battery: 82, habitatOn: true,
    antennaOn: false, antennaAngle: 0, interrupted: false,
    roverBattery: 78, roverPosition: [...ROVER_HOME], roverMoving: false,
    roverPhase: 'idle', roverCharging: false, roverPhaseProgress: 0,
    roverTripOrigin: [...ROVER_HOME], roverObserved: false, routeId: 'crater',
    activePractice: null, completedPractices: [], readLessons: [],
    lunaMessage: instructor.welcome, feedback: null, maintenance: null,
    maintenanceRemaining: 0, energyStableSeconds: 0,
  }
}

function completePractice(state: SimulationState, id: ModuleId): Partial<SimulationState> {
  const practice = practices[id]
  return {
    activePractice: null,
    completedPractices: state.completedPractices.includes(id) ? state.completedPractices : [...state.completedPractices, id],
    lunaMessage: practice.result.learned,
    feedback: { kind: 'success', title: '¡Práctica completada!', message: practice.objective, ...practice.result },
  }
}

function warning(title: string, message: string): Pick<SimulationState, 'feedback' | 'lunaMessage'> {
  return { feedback: { kind: 'warning', title, message }, lunaMessage: message }
}

const startPracticeState = (state: SimulatorStore, id: ModuleId): Partial<SimulationState> => ({
  ...initialSimulationState(), welcomed: state.welcomed, persistenceError: state.persistenceError,
  completedPractices: state.completedPractices, readLessons: state.readLessons,
  selected: id, view: 'inspect', stage: 'practice', activePractice: id,
  solarOn: id !== 'solar', habitatOn: id !== 'solar', antennaOn: false,
  battery: 65, lunaMessage: practices[id].introduction,
  feedback: { kind: 'info', title: practices[id].title, message: practices[id].introduction },
})

function toggleDevice(state: SimulatorStore, id: 'solar' | 'habitat' | 'antenna'): Partial<SimulationState> {
  if (state.maintenance === id) return warning('Equipo en revisión', instructor.maintenance)
  const field = id === 'solar' ? 'solarOn' : id === 'habitat' ? 'habitatOn' : 'antennaOn'
  const on = !state[field]
  const next = { ...state, [field]: on }
  if (on && id !== 'solar' && !getEnergy(next).powered) return warning('Primero necesitamos energía', instructor.noPower)
  const name = id === 'solar' ? 'Sistema solar' : id === 'habitat' ? 'Hábitat' : 'Antena'
  return {
    [field]: on,
    feedback: { kind: 'info', title: `${name} ${on ? 'encendido' : 'apagado'}`, message: id === 'solar'
      ? (on ? 'Los paneles producen electricidad cuando reciben luz.' : 'Sin generación solar, los equipos usan la reserva de la batería.')
      : (on ? 'Este equipo ahora consume electricidad de la estación.' : 'Al apagarlo, reducimos el consumo de electricidad.') },
    lunaMessage: id === 'solar' && !on ? 'Observa la batería: ahora guarda la energía que podemos utilizar.' : instructor.select[id],
  }
}

export const useSimulatorStore = create<SimulatorStore>()(persist((set, get) => ({
  ...initialSimulationState(),
  selectDevice: (id) => set((state) => ({
    selected: id, view: id ? 'inspect' : 'overview', stage: state.activePractice === id ? 'practice' : 'learn',
    lunaMessage: id ? instructor.select[id] : instructor.welcome,
    readLessons: id && id !== 'habitat' && !state.readLessons.includes(id) ? [...state.readLessons, id] : state.readLessons,
  })),
  setView: (view) => set({ view }),
  welcome: () => set({ welcomed: true, lunaMessage: instructor.welcome }),
  toggleSolar: () => set((state) => toggleDevice(state, 'solar')),
  setIllumination: (value) => set({ illumination: clamp(value), lunaMessage: 'Menos luz significa menos producción solar. Compara lo que producimos con lo que consumimos.' }),
  toggleHabitat: () => set((state) => toggleDevice(state, 'habitat')),
  toggleAntenna: () => set((state) => toggleDevice(state, 'antenna')),
  setAntennaAngle: (value) => set({ antennaAngle: clamp(value, 0, 90), lunaMessage: 'Busca una orientación con señal fuerte. En este ejercicio la mejor dirección es 45°.' }),
  toggleInterruption: () => set((state) => ({ interrupted: !state.interrupted, lunaMessage: state.interrupted ? '¡Conexión restaurada! La señal vuelve si la antena está encendida y bien orientada.' : 'Interrumpimos la conexión para experimentar. Puedes restaurarla con el mismo control.' })),
  sendMessage: () => set((state) => {
    if (!canSendMessage(state)) return warning('Revisemos la conexión', 'Enciende la antena, restaura la conexión y busca una señal de al menos 75 % antes de enviar.')
    if (state.activePractice === 'antenna') return completePractice(state, 'antenna')
    return { feedback: { kind: 'success', title: '¡Mensaje recibido en la Tierra!', message: '«Base lunar: observación completada». Este envío es una simulación local; no sale de tu navegador.' }, lunaMessage: 'Las antenas comparten información con ondas de radio. ¡Tu conexión está lista!' }
  }),
  chooseRoute: (id) => set((state) => {
    if (state.roverPhase !== 'idle') return warning('El rover ya está explorando', 'Espera a que regrese antes de cambiar su ruta.')
    return { routeId: getRoute(id).id, lunaMessage: 'El gasto indicado incluye la ida y la vuelta. Deja al menos 5 % de reserva.' }
  }),
  dispatchRover: () => set((state) => {
    if (state.maintenance === 'rover') return warning('Rover en revisión', instructor.maintenance)
    if (state.roverPhase !== 'idle') return warning('Exploración en curso', 'El rover ya está siguiendo una ruta. Puedes ordenar su regreso.')
    if (!canCompleteRoute(state.roverBattery, state.routeId)) return warning('Probemos otra ruta', 'No alcanza la batería para ir, volver y guardar 5 % de reserva. Elige una ruta más corta o recarga el rover en la base.')
    return {
      roverPhase: 'outbound', roverMoving: true, roverCharging: false,
      roverPhaseProgress: 0, roverTripOrigin: [...state.roverPosition], roverObserved: false,
      feedback: { kind: 'info', title: 'Rover en camino', message: 'Observará el terreno y regresará automáticamente. También puedes pedirle que vuelva antes.' },
      lunaMessage: '¡Ruta comprobada! Observa cómo la batería se utiliza durante el recorrido.',
    }
  }),
  returnRover: () => set((state) => {
    if (state.roverPhase === 'idle') return { feedback: { kind: 'info', title: 'Rover en la base', message: 'El rover ya está en su estación de carga.' } }
    if (state.roverPhase === 'returning') return { lunaMessage: 'El rover ya está regresando a la base.' }
    return {
      roverPhase: 'returning', roverMoving: true, roverTripOrigin: [...state.roverPosition], roverPhaseProgress: 0,
      lunaMessage: state.roverObserved ? 'El rover regresa con su observación.' : 'Regresamos antes de observar. Puedes intentarlo de nuevo cuando llegue a la base.',
    }
  }),
  rechargeRover: () => set((state) => {
    if (state.roverPhase !== 'idle' || !atRoverBase(state.roverPosition)) return warning('Recargamos en la base', 'Primero espera a que el rover regrese a la estación.')
    if (state.maintenance === 'rover') return warning('Rover en revisión', instructor.maintenance)
    if (state.roverCharging) return { roverCharging: false, lunaMessage: 'Carga detenida. La estación reduce su consumo.' }
    if (state.roverBattery >= 100) return { feedback: { kind: 'info', title: 'Batería llena', message: 'El rover ya tiene toda su energía disponible.' } }
    if (!getEnergy({ ...state, roverCharging: true }).powered) return warning('El cargador necesita energía', instructor.noPower)
    return { roverCharging: true, lunaMessage: 'El cargador usa electricidad de la base para guardar energía en el rover. Observa el consumo de la estación.' }
  }),
  startPractice: (id) => set((state) => startPracticeState(state, id)),
  resetPractice: () => {
    const state = get()
    const id = state.activePractice ?? (state.selected !== 'habitat' ? state.selected : null)
    if (id) set(startPracticeState(state, id))
  },
  setStage: (stage) => set({ stage }),
  startMaintenance: (id: DeviceId) => set((state) => {
    if (state.maintenance) return warning('Ya hay una revisión en curso', 'Espera a que termine la revisión actual. Solo tarda 8 segundos.')
    if (id === 'rover' && state.roverPhase !== 'idle') return warning('Primero vuelve a la base', 'El rover debe regresar antes de revisar sus equipos.')
    return { maintenance: id, maintenanceRemaining: 8, roverCharging: id === 'rover' ? false : state.roverCharging, lunaMessage: instructor.maintenance,
      feedback: { kind: 'info', title: 'Revisión iniciada', message: 'Este equipo estará fuera de servicio durante 8 segundos. Observa cómo cambia el sistema.' } }
  }),
  dismissFeedback: () => set({ feedback: null }),
  tick: (seconds) => set((state) => {
    const dt = clamp(seconds, 0, 1)
    if (dt === 0) return state
    const next: SimulationState = { ...state, battery: advanceEnergy(state, dt) }
    if (state.maintenance) {
      next.maintenanceRemaining = Math.max(0, state.maintenanceRemaining - dt)
      if (next.maintenanceRemaining === 0) {
        next.maintenance = null
        next.lunaMessage = '¡Revisión terminada! El equipo vuelve a estar disponible.'
      }
    }
    if (next.battery === 0 && getEnergy(state).balance < 0) {
      next.habitatOn = false; next.antennaOn = false; next.roverCharging = false
      next.lunaMessage = instructor.noPower
      next.feedback = { kind: 'warning', title: 'Los equipos se han apagado', message: 'La reserva se agotó. Recupera energía solar y vuelve a encenderlos cuando haya electricidad suficiente.' }
    }
    if (state.roverCharging && getEnergy(state).powered && state.maintenance !== 'rover') {
      // Capacities differ: 1% of a small rover battery is not 1% of the station battery.
      const energyBefore = getEnergy(state)
      const available = state.battery / 0.055 + energyBefore.production * dt
      const suppliedFraction = energyBefore.consumption > 0 ? Math.min(1, available / (energyBefore.consumption * dt)) : 0
      next.roverBattery = clamp(state.roverBattery + dt * suppliedFraction * 2)
      if (next.roverBattery === 100) { next.roverCharging = false; next.lunaMessage = '¡Rover cargado! Su batería está lista para otra exploración.' }
    }
    const route = getRoute(state.routeId)
    if ((state.roverPhase === 'outbound' || state.roverPhase === 'returning') && state.roverBattery > 0) {
      const progress = Math.min(1, state.roverPhaseProgress + dt / route.duration)
      next.roverPhaseProgress = progress
      const destination = state.roverPhase === 'outbound' ? route.destination : ROVER_HOME
      next.roverPosition = lerpPosition(state.roverTripOrigin, destination, progress)
      next.roverBattery = clamp(state.roverBattery - (route.cost / 2) * (progress - state.roverPhaseProgress))
      if (progress === 1) {
        next.roverPhaseProgress = 0
        if (state.roverPhase === 'outbound') {
          next.roverPhase = 'observing'; next.roverMoving = false
          next.lunaMessage = 'El rover ha llegado. Su cámara está observando el terreno.'
        } else {
          next.roverPhase = 'idle'; next.roverMoving = false; next.roverPosition = [...ROVER_HOME]
          next.lunaMessage = state.roverObserved ? '¡Rover de vuelta! Observaste el terreno y guardaste energía para regresar.' : 'El rover regresó antes de observar. Puedes probar la ruta de nuevo.'
          if (state.roverObserved && state.activePractice === 'rover') Object.assign(next, completePractice(next, 'rover'))
        }
      }
    } else if (state.roverPhase === 'observing') {
      next.roverPhaseProgress = state.roverPhaseProgress + dt
      if (next.roverPhaseProgress >= 2) {
        next.roverObserved = true; next.roverPhase = 'returning'; next.roverMoving = true
        next.roverPhaseProgress = 0; next.roverTripOrigin = [...state.roverPosition]
        next.lunaMessage = 'Observación lista. El rover utiliza la energía reservada para regresar.'
      }
    }
    const energy = getEnergy(next)
    if (state.activePractice === 'solar') {
      next.energyStableSeconds = next.solarOn && next.habitatOn && next.antennaOn
        && next.maintenance === null && energy.powered && energy.production >= energy.consumption
        && next.battery > 20 ? state.energyStableSeconds + dt : 0
      if (next.energyStableSeconds >= 4) Object.assign(next, completePractice(next, 'solar'))
    }
    return next
  }),
  restartProgress: () => set(initialSimulationState()),
}), {
  name: 'lunar-training-learning-v1', version: 1,
  storage: createJSONStorage(() => storage),
  partialize: (state) => ({ welcomed: state.welcomed, completedPractices: state.completedPractices, readLessons: state.readLessons }),
  merge: (persisted, current) => {
    const saved = persisted as Partial<SimulationState> | undefined
    const valid = (value: unknown): ModuleId[] => Array.isArray(value) ? [...new Set(value.filter((id): id is ModuleId => id === 'solar' || id === 'rover' || id === 'antenna'))] : []
    return { ...current, welcomed: saved?.welcomed === true, completedPractices: valid(saved?.completedPractices), readLessons: valid(saved?.readLessons) }
  },
  onRehydrateStorage: () => (_state, error) => { if (error) reportStorageFailure() },
}))
