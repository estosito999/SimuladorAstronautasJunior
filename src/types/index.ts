export type DeviceId = 'solar' | 'rover' | 'antenna' | 'habitat'
export type ModuleId = Exclude<DeviceId, 'habitat'>
export type LearningStage = 'learn' | 'experiment' | 'practice'
export type ViewMode = 'overview' | 'inspect'
export type RouteId = 'crater' | 'rocks' | 'ridge'
export type Vec2 = [number, number]
export type RoverPhase = 'idle' | 'outbound' | 'observing' | 'returning'
export type DeviceStatus = 'Funcionando' | 'Apagado' | 'Necesita revisión' | 'En mantenimiento'

export interface Feedback {
  kind: 'success' | 'info' | 'warning'
  title: string
  message: string
  did?: string
  happened?: string
  why?: string
  learned?: string
}

export interface Lesson {
  title: string
  subtitle: string
  what: string
  purpose: string
  how: string
  parts: { name: string; description: string }[]
  experiment: string
  fact: string
}

export interface Practice {
  id: ModuleId
  number: number
  title: string
  objective: string
  introduction: string
  steps: string[]
  duration: string
  result: { did: string; happened: string; why: string; learned: string }
}

export interface SimulationState {
  selected: DeviceId | null
  view: ViewMode
  welcomed: boolean
  persistenceError: boolean
  stage: LearningStage
  solarOn: boolean
  illumination: number
  battery: number
  habitatOn: boolean
  antennaOn: boolean
  antennaAngle: number
  interrupted: boolean
  roverBattery: number
  roverPosition: Vec2
  roverMoving: boolean
  roverPhase: RoverPhase
  roverCharging: boolean
  roverPhaseProgress: number
  roverTripOrigin: Vec2
  roverObserved: boolean
  routeId: RouteId
  activePractice: ModuleId | null
  completedPractices: ModuleId[]
  readLessons: ModuleId[]
  lunaMessage: string
  feedback: Feedback | null
  maintenance: DeviceId | null
  maintenanceRemaining: number
  energyStableSeconds: number
}

export interface SimulationActions {
  selectDevice: (id: DeviceId | null) => void
  setView: (view: ViewMode) => void
  welcome: () => void
  toggleSolar: () => void
  setIllumination: (value: number) => void
  toggleHabitat: () => void
  toggleAntenna: () => void
  setAntennaAngle: (value: number) => void
  toggleInterruption: () => void
  sendMessage: () => void
  chooseRoute: (id: RouteId) => void
  dispatchRover: () => void
  returnRover: () => void
  rechargeRover: () => void
  startPractice: (id: ModuleId) => void
  resetPractice: () => void
  setStage: (stage: LearningStage) => void
  tick: (seconds: number) => void
  restartProgress: () => void
  startMaintenance: (id: DeviceId) => void
  dismissFeedback: () => void
}

export type SimulatorStore = SimulationState & SimulationActions
