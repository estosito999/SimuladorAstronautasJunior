import { lazy, Suspense, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import {
  Compass,
  Rocket,
  Zap,
  Radio,
  Play,
  Pause,
  Terminal,
  Sparkles,
  Moon,
  Maximize2,
  Minimize2,
  BookOpen,
  CircleHelp,
  Home,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Leaf,
  ArrowUp,
  ArrowDown,
  X,
  Presentation,
  Truck
} from 'lucide-react'

import { createInitialState, metrics, reduce } from './simulation/engine'
import type { ModuleId, State } from './simulation/types'
import ModulePanel, { modules } from './components/ModulePanel'
import Telemetry from './components/Telemetry'
import NetworkPanel from './components/NetworkPanel'
import { useMissionTelemetry } from './components/useMissionTelemetry'
import PitchDeck from './components/PitchDeck'

const Scene = lazy(() => import('./scene/Scene'))
type CameraAction = 'reset' | 'left' | 'right' | 'in' | 'out'

export interface RepoMission {
  id: string
  title: string
  subtitle: string
  folder: string
  url: string
  icon: typeof Rocket
  accentColor: string
  badge: string
  description: string
  highlights: string[]
  tags: string[]
  moduleId?: ModuleId
}

const MISSIONS: RepoMission[] = [
  {
    id: 'lunar-e',
    title: 'Misión de Reconocimiento: Rover Lunar de Exploración',
    subtitle: 'Navegación en terreno lunar, cinemática y muestreo geológico',
    folder: 'final-project-Lunar-E',
    url: '#rover',
    moduleId: 'rover',
    icon: Compass,
    accentColor: '#38bdf8',
    badge: 'Movilidad Lunar · Rover 3D',
    description: 'Comanda el vehículo de exploración sobre la superficie lunar. Maniobra sobre regolito con tracción 4x4, orienta la cámara e inspecciona el entorno del polo sur.',
    highlights: [
      'Control de tracción y maniobra en terreno escarpado con WASD o flechas',
      'Cámara orbital y modo de seguimiento dinámico del vehículo',
      'Muestreo de rocas y retorno a la plataforma de recarga'
    ],
    tags: ['Geología Lunar', 'Navegación Superficial', 'Cinemática', 'Tracción']
  },
  {
    id: 'habitat-management',
    title: 'Misión de Gestión y Recursos: Asentamiento Lunar Selene',
    subtitle: 'Planificación de infraestructura, balance energético y soporte de base',
    folder: 'ZERO-G-Junior-Astronaut-Trainer',
    url: '#solar',
    moduleId: 'solar',
    icon: Rocket,
    accentColor: '#34d399',
    badge: 'Gestión de Hábitat · Estación',
    description: 'Comanda la gestión integral de recursos en la base lunar. Balancea generación fotovoltaica, reserva en baterías y consumo de los subsistemas en el Polo Sur Lunar.',
    highlights: [
      'Generación fotovoltaica con ángulo de elevación solar e irradiancia',
      'Banco de baterías de alta capacidad con integración de Wh en tiempo real',
      'Matriz de distribución energética hacia hábitat, antenas y plataforma'
    ],
    tags: ['Gestión de Hábitat', 'Balance de Potencia', 'Baterías', 'Soporte Vital']
  },
  {
    id: 'dust-shield',
    title: 'Misión de Mantenimiento Energético: Escudo Electrodinámico (EDS)',
    subtitle: 'Mitigación de polvo de regolito mediante escudo de ondas viajeras',
    folder: 'Dust-Shield',
    url: '#solar',
    moduleId: 'solar',
    icon: Zap,
    accentColor: '#fbbf24',
    badge: 'Energía Fotovoltaica · EDS',
    description: 'Supervisa el rendimiento de las matrices solares expuestas al polvo lunar. Activa el escudo electrodinámico para repeler partículas y restaurar el suministro eléctrico.',
    highlights: [
      'Monitoreo de atenuación exponencial de luz por polvo acumulado',
      'Limpieza electrodinámica por ondas viajeras de alta frecuencia',
      'Curvas reales de recuperación de potencia y consumo del pulso EDS'
    ],
    tags: ['Generación Fotovoltaica', 'Escudo Electrodinámico', 'Regolito', 'Mantenimiento']
  },
  {
    id: 'openmct',
    title: 'Estación de Control de Vuelo: Enlace de Telemetría (DSN)',
    subtitle: 'Supervisión de telemetría en tiempo real de 10 canales y exportación CSV',
    folder: 'openmct',
    url: '#comms',
    moduleId: 'comms',
    icon: Radio,
    accentColor: '#a78bfa',
    badge: 'Control de Vuelo · DSN',
    description: 'Consola operativa estilo NASA adaptada para niños: supervisa en vivo los 10 canales críticos de la estación Selene, analiza gráficos temporales y descarga datos de vuelo.',
    highlights: [
      'Transmisión en tiempo real de 10 canales de subsistemas con búfer circular',
      'Alineación azimutal de antena hacia estaciones terrestres DSN a 45°',
      'Exportación estructurada de registros de vuelo en formato CSV'
    ],
    tags: ['Control de Vuelo', 'Telemetría en Vivo', 'Red DSN', 'Análisis de Datos']
  }
]

function lunaTip(s: State, selected: ModuleId) {
  const e = metrics(s)
  if (!s.connections.solarBus) return 'Los paneles están desconectados de la batería. Conecta el cable en la red de equipos para recibir energía.'
  if (selected === 'comms' && !s.connections.antennaBus) return 'La antena necesita su cable de alimentación. Conéctalo en la red de equipos.'
  if (s.paused) return 'La simulación está en pausa. Pulsa Continuar cuando quieras seguir experimentando.'
  if (!e.powered) return 'La batería de la base necesita energía. Enciende los paneles, aumenta la luz o limpia el polvo acumulado.'
  if (selected === 'solar') {
    if (s.cleaning) return '¡El escudo electrodinámico (EDS) está activo! Observa cómo se repelen las partículas y sube la potencia.'
    if (!s.solarOn) return '¡Hola, astronauta! Soy LUNA. Enciende los paneles para que la base reciba energía del Sol.'
    if (s.dust > 30) return 'El polvo tapa parte de la luz solar. Pulsa "Activar limpieza EDS" para restaurar la potencia fotovoltaica.'
    return 'Prueba a cambiar la luz o el ángulo de los paneles. A 45° de elevación captamos la máxima radiación solar.'
  }
  if (selected === 'rover') {
    return s.roverMode === 'charging'
      ? 'La base está recargando la batería del rover por el cable de plataforma. ¡Observa el flujo de energía!'
      : s.roverMode === 'returning'
      ? 'El rover regresa automáticamente a la plataforma de acoplamiento.'
      : 'Conduce por la superficie lunar con las flechas o WASD. Recuerda vigilar la batería y regresar a recargar.'
  }
  if (!s.antennaOn) return 'Vamos a compartir nuestros descubrimientos con la Tierra. Enciende el transmisor de la antena.'
  return e.signal >= 65
    ? '¡Excelente alineación! La señal con la Tierra supera el 65%. Pulsa "Transmitir" para enviar la telemetría.'
    : 'Mueve la orientación de la antena despacio. En este simulador, la mejor dirección hacia la Tierra está cerca de 45°.'
}

export default function App() {
  const [viewMode, setViewMode] = useState<'simulator' | 'pitch'>('simulator')
  const [fullscreen, setFullscreen] = useState(false)
  const [clock, setClock] = useState('')

  // Estado del motor de simulación 3D integrado
  const [s, dispatch] = useReducer(reduce, undefined, createInitialState)
  const telemetry = useMissionTelemetry(s)
  const [selected, setSelected] = useState<ModuleId>('solar')
  const [dialog, setDialog] = useState<'guide' | 'notebook' | 'reset' | null>(null)
  const [cameraMode, setCameraMode] = useState<'overview' | 'follow'>('overview')
  const [cameraCommand, setCameraCommand] = useState<{ id: number; action: CameraAction }>({ id: 0, action: 'reset' })
  const [quality, setQuality] = useState<'standard' | 'low'>('standard')
  const sceneRef = useRef<HTMLDivElement>(null)
  const currentState = useRef(s)
  currentState.current = s
  const e = metrics(s)

  const select = (id: ModuleId) => {
    dispatch({ type: 'rover-stop' })
    setSelected(id)
    if (id !== 'rover') setCameraMode('overview')
  }

  const camera = (action: CameraAction) => {
    if (action === 'reset') setCameraMode('overview')
    setCameraCommand(c => ({ id: c.id + 1, action }))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('es-ES', { hour12: false }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Bucle físico en tiempo real a 10 Hz
  useEffect(() => {
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const dt = Math.min(0.25, (now - last) / 1000)
      last = now
      if (!document.hidden && viewMode === 'simulator') {
        dispatch({ type: 'tick', dt })
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [viewMode])

  // Controles de teclado para el rover lunar
  useEffect(() => {
    const keys = new Set<string>()
    const controls = () =>
      dispatch({
        type: 'rover-drive',
        forward: Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown')),
        turn: Number(keys.has('a') || keys.has('arrowleft')) - Number(keys.has('d') || keys.has('arrowright'))
      })
    const allowed = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']
    const down = (event: KeyboardEvent) => {
      const k = event.key.toLowerCase()
      const live = currentState.current
      if (document.activeElement !== sceneRef.current || selected !== 'rover' || live.paused || live.roverMode === 'returning' || live.roverMode === 'charging' || !allowed.includes(k)) return
      event.preventDefault()
      keys.add(k)
      controls()
    }
    const up = (event: KeyboardEvent) => {
      if (keys.delete(event.key.toLowerCase())) controls()
    }
    const stop = () => {
      keys.clear()
      dispatch({ type: 'rover-stop' })
    }
    document.addEventListener('keydown', down)
    document.addEventListener('keyup', up)
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', stop)
    const scene = sceneRef.current
    scene?.addEventListener('blur', stop)
    return () => {
      document.removeEventListener('keydown', down)
      document.removeEventListener('keyup', up)
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', stop)
      scene?.removeEventListener('blur', stop)
    }
  }, [selected])

  return (
    <div className={`hub-shell ${fullscreen ? 'is-fullscreen' : ''}`}>
      {/* ── BARRA SUPERIOR DE LA ESTACIÓN ESPACIAL ──────────────────────── */}
      <header className="hub-header">
        <div className="hub-brand" onClick={() => setViewMode('simulator')} style={{ cursor: 'pointer' }}>
          <div className="hub-logo">
            <Moon size={22} className="hub-moon-icon" />
            <Sparkles size={12} className="hub-sparkle-icon" />
          </div>
          <div>
            <div className="hub-title-row">
              <span className="hub-title">SELENE</span>
              <span className="hub-title-badge">ASTRONAUTAS JUNIOR</span>
            </div>
            <span className="hub-tagline">Simulador Educativo Lunar 3D · Estación Unificada</span>
          </div>
        </div>

        <nav className="hub-nav-tabs">
          <button
            className={`nav-tab-btn ${viewMode === 'simulator' ? 'active' : ''}`}
            onClick={() => setViewMode('simulator')}
            title="Ir a la estación lunar interactiva 3D"
          >
            <Rocket size={16} />
            <span>Estación Lunar 3D</span>
          </button>
          <button
            className={`nav-tab-btn ${viewMode === 'pitch' ? 'active' : ''}`}
            onClick={() => setViewMode('pitch')}
            title="Ver presentación y pitch interactivo"
          >
            <Presentation size={16} />
            <span>Pitch & Presentación</span>
          </button>
        </nav>

        <div className="hub-status-bar">
          <button onClick={() => setDialog('guide')} className="sim-btn-sub" title="Guía y protocolo">
            <CircleHelp size={15} /> <span>Protocolo</span>
          </button>
          <button onClick={() => setDialog('notebook')} className="sim-btn-sub" title="Cuaderno de descubrimientos">
            <BookOpen size={15} /> <span>Bitácora</span>
          </button>
          <button onClick={() => setDialog('reset')} className="sim-btn-sub" title="Reiniciar simulación">
            <RotateCcw size={15} /> <span>Reiniciar</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className={`sim-btn-sub sim-btn-fullscreen ${fullscreen ? 'is-active' : ''}`}
            title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{fullscreen ? 'Restaurar' : 'Pantalla Completa'}</span>
          </button>
          <div className="status-pill">
            <span className="status-dot-pulse" />
            <span>100% Integrada</span>
          </div>
          <div className="status-pill clock-pill">
            <Terminal size={14} />
            <span>MET {clock || '12:00:00'}</span>
          </div>
        </div>
      </header>

      {/* ── MODO 1: PRESENTACIÓN INTERACTIVA DE PITCH ───────────────────── */}
      {viewMode === 'pitch' ? (
        <PitchDeck
          missions={MISSIONS}
          onLaunchMission={(m) => {
            const map: Record<string, ModuleId> = {
              'lunar-e': 'rover',
              'habitat-management': 'solar',
              'dust-shield': 'solar',
              'openmct': 'comms'
            }
            const mod = map[m.id]
            if (mod) {
              select(mod)
            }
            setViewMode('simulator')
          }}
          onOpenStation={() => setViewMode('simulator')}
        />
      ) : (
        /* ── MODO 2: SIMULADOR EDUCATIVO LUNAR 3D PRINCIPAL ──────────────── */
        <div className="simulator-container">
          <main className="simulator-main">
            {/* ENCABEZADO DE MISIÓN */}
            <section className="intro">
              <div>
                <div className="eyebrow">
                  <span />
                  GESTIÓN Y CONTROL DE BASE LUNAR
                </div>
                <h1>
                  Base Selene.<br className="mobile-break" /> <em>Centro de Operaciones y Exploración Lunar.</em>
                </h1>
                <p>
                  Supervisa el balance de energía fotovoltaica, maniobra el rover de exploración sobre regolito,
                  activa la limpieza electrodinámica de paneles y monitorea la telemetría en tiempo real con la Tierra.
                </p>
              </div>
            </section>

            {/* SELECTOR DE SUBSISTEMAS */}
            <div className="module-tabs" aria-label="Seleccionar subsistema">
              {(Object.keys(modules) as ModuleId[]).map(id => {
                const m = modules[id]
                const Icon = m.icon
                return (
                  <button
                    key={id}
                    className={`module-tab ${selected === id ? 'selected' : ''} ${m.color}`}
                    onClick={() => select(id)}
                    aria-pressed={selected === id}
                  >
                    <span className="tab-number">{m.number}</span>
                    <span className="tab-icon">
                      <Icon size={23} />
                    </span>
                    <span>
                      <strong>{m.name}</strong>
                      <small>{m.tag}</small>
                    </span>
                    {s.completed.includes(id) ? (
                      <Check className="tab-check" size={19} aria-label="Objetivo completado" />
                    ) : (
                      <ChevronRight className="tab-arrow" size={18} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* ESCENA 3D Y PANEL DE CONTROL CONTEXTUAL */}
            <div className="station-grid">
              <section className="scene-card" aria-labelledby="scene-heading">
                <div className="scene-toolbar">
                  <div>
                    <span className="live-indicator" />
                    <h2 id="scene-heading">Superficie de operaciones · Base Selene</h2>
                    <span className="scene-tag">ESCENA LUNAR 3D REACT THREE FIBER</span>
                  </div>
                  <div className="scene-toolbar-actions">
                    <button onClick={() => dispatch({ type: 'pause' })} className="scene-pause">
                      {s.paused ? <Play size={14} /> : <Pause size={14} />}
                      {s.paused ? 'Continuar' : 'Pausar'}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className={`scene-fullscreen-btn ${fullscreen ? 'is-active' : ''}`}
                      title={fullscreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
                    >
                      {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      <span>{fullscreen ? 'Restaurar' : 'Pantalla completa'}</span>
                    </button>
                  </div>
                </div>

                <div
                  className="scene-wrap"
                  ref={sceneRef}
                  tabIndex={0}
                  aria-label="Explorar la superficie lunar. Arrastra para orbitar y usa la rueda para zoom. Con el rover seleccionado, conduce con WASD o flechas."
                >
                  <Suspense fallback={<div className="scene-loading"><Moon size={36} /><p>Cargando estación lunar 3D…</p></div>}>
                    <Scene
                      state={s}
                      selected={selected}
                      onSelect={select}
                      cameraMode={cameraMode}
                      cameraCommand={cameraCommand}
                      quality={quality}
                    />
                  </Suspense>
                  <div className="scene-coordinate">
                    <span>BASE SELENE</span>
                    <small>Polo Sur Lunar · Relieve y Físicas Unificadas</small>
                  </div>
                  <div className="scene-controls">
                    <button title="Vista general" aria-label="Restablecer vista general" onClick={() => camera('reset')}>
                      <Home size={17} />
                    </button>
                    <span />
                    <button aria-label="Girar cámara a la izquierda" onClick={() => camera('left')}>
                      <ChevronLeft size={19} />
                    </button>
                    <button aria-label="Girar cámara a la derecha" onClick={() => camera('right')}>
                      <ChevronRight size={19} />
                    </button>
                    <span />
                    <button aria-label="Acercar cámara" onClick={() => camera('in')}>
                      <Plus size={18} />
                    </button>
                    <button aria-label="Alejar cámara" onClick={() => camera('out')}>
                      <Minus size={18} />
                    </button>
                    <span />
                    <button
                      title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                      aria-label="Pantalla completa"
                      onClick={toggleFullscreen}
                    >
                      {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                    </button>
                  </div>
                  <div className="scene-bottom">
                    <span>
                      <Maximize2 size={13} /> Arrastra para rotar cámara · Rueda para zoom · WASD para conducir rover
                    </span>
                    <select
                      aria-label="Calidad gráfica"
                      value={quality}
                      onChange={event => setQuality(event.target.value as 'standard' | 'low')}
                    >
                      <option value="standard">Calidad normal</option>
                      <option value="low">Calidad ligera</option>
                    </select>
                  </div>
                </div>

                <div className="equipment-strip">
                  <span>INSPECCIONAR SUBSISTEMA:</span>
                  {(Object.keys(modules) as ModuleId[]).map(id => {
                    const Icon = modules[id].icon
                    return (
                      <button
                        key={id}
                        className={selected === id ? 'selected' : ''}
                        aria-pressed={selected === id}
                        onClick={() => select(id)}
                      >
                        <Icon size={15} />
                        {id === 'solar' ? 'Paneles y Limpieza EDS' : id === 'rover' ? 'Rover Lunar' : 'Antena DSN'}
                      </button>
                    )
                  })}
                  {selected === 'rover' && (
                    <button
                      className={cameraMode === 'follow' ? 'selected follow' : 'follow'}
                      aria-pressed={cameraMode === 'follow'}
                      onClick={() => setCameraMode(m => (m === 'follow' ? 'overview' : 'follow'))}
                    >
                      <Truck size={14} /> Seguir Rover
                    </button>
                  )}
                </div>

                <div className="energy-flow">
                  <span><Leaf size={16} /> Balance Energético</span>
                  <span>Sol → Paneles Solares → Banco Baterías → Subsistemas</span>
                  <strong className={e.balance >= 0 ? '' : 'negative'}>
                    {e.balance >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {Math.abs(e.balance).toFixed(0)} W {e.balance >= 0 ? 'hacia reserva' : 'de baterías'}
                  </strong>
                </div>
              </section>

              <ModulePanel key={selected} selected={selected} state={s} dispatch={dispatch} />
            </div>

            {/* ASISTENTE PEDAGÓGICO LUNA */}
            <section className="luna-card" aria-label="Orientación de LUNA">
              <LunaAvatar />
              <div className="luna-name">
                <strong>LUNA <Sparkles size={13} /></strong>
                <span>Compañera pedagógica de exploración</span>
              </div>
              <div className="luna-copy">
                <p>{lunaTip(s, selected)}</p>
                <div className="operation-feedback" role="status" aria-live="polite">
                  {s.events.at(-1)?.text || 'Experimenta a tu propio ritmo con los controles de cada subsistema.'}
                </div>
              </div>
            </section>

            {/* MATRIZ DE CONEXIONES Y RED */}
            <NetworkPanel state={s} dispatch={dispatch} />

            {/* TELEMETRÍA Y SUPERVISIÓN OPEN MCT */}
            <Telemetry state={s} history={telemetry.history} source={telemetry.source} />
          </main>

          {/* MODALES: PROTOCOLO, BITÁCORA Y REINICIO */}
          {dialog && (
            <Modal
              title={
                dialog === 'guide'
                  ? 'Protocolo de Operación Lunar'
                  : dialog === 'notebook'
                  ? 'Mi Bitácora de Descubrimientos'
                  : '¿Reiniciar Simulación de la Base?'
              }
              onClose={() => setDialog(null)}
            >
              {dialog === 'guide' ? (
                <>
                  <p>¡Hola! Soy LUNA. Vamos a descubrir cómo funciona una base lunar interactuando con sus tres subsistemas principales:</p>
                  <ol className="guide-steps">
                    <li>
                      <span>01</span>
                      <div>
                        <strong>Matrices Solares y Escudo EDS:</strong> Añade polvo para comprobar cómo cae la potencia fotovoltaica. Luego pulsa "Activar limpieza EDS" para ver cómo las ondas electrodinámicas repelen las partículas y recuperan la electricidad.
                      </div>
                    </li>
                    <li>
                      <span>02</span>
                      <div>
                        <strong>Rover Lunar de Exploración:</strong> Conduce con WASD o flechas por el relieve de cráteres, explora la superficie y regresa a la base para acoplarte e iniciar la recarga de batería.
                      </div>
                    </li>
                    <li>
                      <span>03</span>
                      <div>
                        <strong>Antena Direccional y DSN:</strong> Enciende el transmisor y ajusta el ángulo azimutal hacia los 45° óptimos para alcanzar un enlace de alta calidad y transmitir los paquetes científicos a la Tierra.
                      </div>
                    </li>
                  </ol>
                  <button className="btn-connect" style={{ marginTop: '16px' }} onClick={() => setDialog(null)}>
                    ¡Entendido, vamos a explorar!
                  </button>
                </>
              ) : dialog === 'notebook' ? (
                <div className="notebook-entries">
                  {(Object.keys(modules) as ModuleId[]).map(id => {
                    const Icon = modules[id].icon
                    const done = s.completed.includes(id)
                    return (
                      <article key={id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                        <span style={{ color: '#38bdf8' }}><Icon size={22} /></span>
                        <div>
                          <strong>{modules[id].name} {done && '✓'}</strong>
                          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
                            {done ? modules[id].discovery : modules[id].experiment}
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                  <p>La simulación se reiniciará a sus valores de inicio nominales (batería al 75%, paneles al 100% limpios, rover en plataforma).</p>
                  <button
                    className="btn-connect"
                    onClick={() => {
                      dispatch({ type: 'reset' })
                      setSelected('solar')
                      camera('reset')
                      setDialog(null)
                    }}
                  >
                    Confirmar reinicio de la base
                  </button>
                </div>
              )}
            </Modal>
          )}
        </div>
      )}
    </div>
  )
}

function LunaAvatar() {
  return (
    <svg className="luna-avatar" viewBox="0 0 72 72" role="img" aria-label="LUNA, robot pedagógico" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
      <circle cx="36" cy="36" r="35" fill="#1e3a5f" />
      <path d="M36 12v7" stroke="#38bdf8" strokeWidth="3" />
      <circle cx="36" cy="10" r="3" fill="#fbbf24" />
      <rect x="13" y="23" width="46" height="34" rx="15" fill="#0d1b30" stroke="#38bdf8" strokeWidth="1.5" />
      <rect x="19" y="29" width="34" height="20" rx="9" fill="#060c18" />
      <path d="M26 38q3-5 6 0m8 0q3-5 6 0" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M31 44q5 4 10 0" fill="none" stroke="#34d399" strokeWidth="1.5" />
      <rect x="8" y="33" width="5" height="13" rx="2.5" fill="#fbbf24" />
      <rect x="59" y="33" width="5" height="13" rx="2.5" fill="#fbbf24" />
    </svg>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) onClose()
      }}
      style={{
        background: '#0d1527',
        border: '1px solid #1e3a5f',
        borderRadius: '16px',
        color: '#e2e8f0',
        padding: '24px 28px',
        maxWidth: '560px',
        width: '90%',
        margin: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>{title}</h2>
        <button onClick={onClose} style={{ color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none' }}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}