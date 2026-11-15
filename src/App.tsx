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
  RotateCcw,
  Leaf,
  ArrowUp,
  ArrowDown,
  X,
  Presentation,
  Truck,
  CircleDot,
  Layers,
  PanelRight,
  ExternalLink,
  Activity,
  Globe
} from 'lucide-react'

import { createInitialState, metrics, reduce } from './simulation/engine'
import type { ModuleId, State } from './simulation/types'
import { getNearestRock, LUNAR_ROCKS } from './simulation/roverExploration'
import ModulePanel, { modules } from './components/ModulePanel'
import Telemetry from './components/Telemetry'
import NetworkPanel from './components/NetworkPanel'
import { useMissionTelemetry } from './components/useMissionTelemetry'
import PitchDeck from './components/PitchDeck'

const Scene = lazy(() => import('./scene/Scene'))
type CameraAction = 'reset' | 'left' | 'right' | 'in' | 'out'

export interface RepoMission {
  id: string
  number: string
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
    number: '01',
    title: 'Misión de Reconocimiento: Rover Lunar de Exploración',
    subtitle: 'Navegación en terreno lunar, cartografía de superficie y muestreo geológico',
    folder: 'final-project-Lunar-E',
    url: '/final-project-Lunar-E/',
    moduleId: 'rover',
    icon: Compass,
    accentColor: '#38bdf8',
    badge: 'Movilidad Lunar · Rover',
    description: 'Comanda el vehículo de exploración sobre la superficie lunar. Maniobra sobre regolito, orienta cámaras panorámicas e inspecciona el entorno orbital del polo sur.',
    highlights: [
      'Control de tracción y maniobra en terreno escarpado',
      'Cámaras panorámicas y de seguimiento orbital',
      'Cartografía de cráteres y zonas de prospección'
    ],
    tags: ['Geología Lunar', 'Navegación Superficial', 'Muestreo', 'Tracción']
  },
  {
    id: 'habitat-management',
    number: '02',
    title: 'Misión de Gestión y Supervivencia: Asentamientos Planetarios',
    subtitle: 'Planificación de hábitats, soporte vital y balance de recursos en Luna y Marte',
    folder: 'ZERO-G-Junior-Astronaut-Trainer',
    url: '/ZERO-G-Junior-Astronaut-Trainer/',
    moduleId: 'solar',
    icon: Leaf,
    accentColor: '#34d399',
    badge: 'Gestión de Hábitat · Misión Interplanetaria',
    description: 'Comanda la gestión integral y supervivencia de una base humana en entornos extremos. Planifica la infraestructura con presupuesto táctico, balancea soporte vital, energía y reservas de contingencia, y resuelve emergencias ambientales críticas en el Polo Sur Lunar o en Marte.',
    highlights: [
      'Selección de destino táctico: Polo Sur Lunar (0.166 G) o Cañón Marciano (0.379 G)',
      'Diseño modular de asentamiento: matrices de potencia, soporte vital, blindaje y laboratorios',
      'Consola de control de vuelo: resolución de alertas ambientales, balance de recursos y bitácora de misión'
    ],
    tags: ['Gestión de Hábitat', 'Supervivencia Planetaria', 'Soporte Vital', 'Toma de Decisiones', 'Luna y Marte']
  },
  {
    id: 'dust-shield',
    number: '03',
    title: 'Misión de Mantenimiento Energético: Escudo de Matrices Solares',
    subtitle: 'Mitigación de polvo de regolito mediante escudo electrodinámico (EDS)',
    folder: 'Dust-Shield',
    url: '/Dust-Shield/',
    moduleId: 'solar',
    icon: Zap,
    accentColor: '#fbbf24',
    badge: 'Energía Fotovoltaica · EDS',
    description: 'Supervisa el rendimiento de las matrices solares expuestas a regolito abrasivo. Activa el escudo electrodinámico para repeler partículas y restaurar el suministro eléctrico.',
    highlights: [
      'Monitoreo de atenuación de radiación solar por polvo acumulado',
      'Limpieza electrodinámica por ondas viajeras de alta frecuencia',
      'Curvas de recuperación de potencia y consumo de limpieza'
    ],
    tags: ['Generación Fotovoltaica', 'Escudo Electrodinámico', 'Regolito', 'Potencia']
  },
  {
    id: 'openmct',
    number: '04',
    title: 'Estación de Control de Vuelo: Enlace de Telemetría (DSN)',
    subtitle: 'Monitoreo de telemetría en tiempo real y registro con la Red de Espacio Profundo',
    folder: 'openmct',
    url: '/openmct/',
    moduleId: 'control',
    icon: Activity,
    accentColor: '#38bdf8',
    badge: 'Control de Vuelo · DSN',
    description: 'Consola operativa estilo NASA para supervisar en vivo los 10 canales críticos de la estación Selene: potencia, almacenamiento, enlace de comunicaciones y exportación de datos.',
    highlights: [
      'Transmisión en tiempo real de 10 canales de subsistemas',
      'Gráficas de series temporales y estados de alarma',
      'Exportación estructurada de registros de vuelo en CSV'
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
    if (s.heldRockId) return '¡La pinza sostiene una roca lunar! Pulsa Guardar muestra para colocarla en el depósito del rover.'
    return s.roverMode === 'charging'
      ? 'La base está recargando la batería del rover por el cable de plataforma. ¡Observa el flujo de energía!'
      : s.roverMode === 'returning'
      ? 'El rover regresa automáticamente a la plataforma de acoplamiento.'
      : 'Explora la zona de 120 × 120 m y busca las rocas marcadas. Detente cerca, baja el brazo y alinea la pinza; después recoge y guarda la muestra.'
  }
  if (selected === 'control') {
    return '¡Estación de Control de Vuelo DSN activa! Coordina telemetría de los 10 canales de la base Selene con las estaciones terrestres de Madrid, Goldstone y Canberra, y sincroniza con la ISS.'
  }
  if (selected === 'iss') {
    return '¡Enlace con la Estación Espacial Internacional (ISS) establecido! A 420 km de altitud orbital, la ISS coordina misiones terrestres (Houston, ESOC, Tsukuba) y retransmite datos espaciales.'
  }
  if (!s.antennaOn) return 'Vamos a compartir nuestros descubrimientos con la Tierra. Enciende el transmisor de la antena.'
  return e.signal >= 65
    ? '¡Excelente alineación! La señal con la Tierra supera el 65%. Pulsa "Transmitir" para enviar la telemetría.'
    : 'Mueve la orientación de la antena despacio. En este simulador, la mejor dirección hacia la Tierra está cerca de 45°.'
}

export default function App() {
  const [viewMode, setViewMode] = useState<'hub' | 'simulator' | 'pitch'>('hub')
  const [activeMission, setActiveMission] = useState<RepoMission | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [clock, setClock] = useState('')

  // Estado del motor de simulación 3D integrado
  const [s, dispatch] = useReducer(reduce, undefined, createInitialState)
  const telemetry = useMissionTelemetry(s)
  const [selected, setSelected] = useState<ModuleId>('solar')
  const [dialog, setDialog] = useState<'guide' | 'notebook' | 'reset' | null>(null)
  const [cameraMode, setCameraMode] = useState<'overview' | 'follow' | 'control' | 'iss'>('overview')
  const [cameraCommand, setCameraCommand] = useState<{ id: number; action: CameraAction }>({ id: 0, action: 'reset' })
  const [quality, setQuality] = useState<'standard' | 'low'>('standard')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'controls' | 'network' | 'telemetry'>('controls')
  const sceneRef = useRef<HTMLDivElement>(null)
  const panelHeadingRef = useRef<HTMLHeadingElement>(null)
  const currentState = useRef(s)
  currentState.current = s
  const e = metrics(s)
  const nearestRock = getNearestRock(s)

  const select = (id: ModuleId) => {
    dispatch({ type: 'rover-stop' })
    setSelected(id)
    if (id === 'rover') setCameraMode('follow')
    else if (id === 'control') setCameraMode('control')
    else if (id === 'iss') setCameraMode('iss')
    else setCameraMode('overview')
  }

  const camera = (action: CameraAction) => {
    if (action === 'reset') setCameraMode('overview')
    setCameraCommand(c => ({ id: c.id + 1, action }))
  }

  const inspect = (id: ModuleId) => {
    select(id)
    setPanelTab('controls')
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    sceneRef.current?.focus({ preventScroll: true })
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    if (!panelOpen || viewMode !== 'simulator' || activeMission) return
    panelHeadingRef.current?.focus({ preventScroll: true })
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return
      setPanelOpen(false)
      sceneRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [panelOpen, viewMode, activeMission])

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
      const isInput = ['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())
      if (isInput || viewMode !== 'simulator' || live.paused || live.roverMode === 'returning' || live.roverMode === 'charging') return
      if (selected === 'rover') {
        const jointKeys = { q: ['yaw', -4], e: ['yaw', 4], r: ['shoulder', 4], f: ['shoulder', -4], t: ['elbow', 4], g: ['elbow', -4] } as const
        if (k in jointKeys) {
          event.preventDefault()
          const [joint, change] = jointKeys[k as keyof typeof jointKeys]
          dispatch({ type: 'rover-arm', joint, value: live.roverArm[joint] + change })
          return
        }
        const sampleKeys = { ' ': 'rover-collect', b: 'rover-stow', c: 'rover-gripper', x: 'rover-arm-reset' } as const
        if (k in sampleKeys) {
          event.preventDefault()
          if (!event.repeat) dispatch({ type: sampleKeys[k as keyof typeof sampleKeys] })
          return
        }
      }
      if (!allowed.includes(k)) return
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
  }, [selected, viewMode, activeMission])

  const operationsPanel = (
    <aside id="operations-panel" className="operations-panel" hidden={!panelOpen} aria-labelledby="operations-panel-heading">
      <div className="operations-panel-header">
        <h2 id="operations-panel-heading" ref={panelHeadingRef} tabIndex={-1}>Control de la base</h2>
        <button onClick={closePanel} className="action-icon-btn" title="Cerrar panel y volver a explorar" aria-label="Cerrar panel y volver a explorar">
          <X size={18} />
        </button>
      </div>
      <nav className="operations-panel-tabs" aria-label="Secciones del panel de control">
        <button className={panelTab === 'controls' ? 'active' : ''} aria-pressed={panelTab === 'controls'} onClick={() => setPanelTab('controls')}><PanelRight size={14} />Controles</button>
        <button className={panelTab === 'network' ? 'active' : ''} aria-pressed={panelTab === 'network'} onClick={() => setPanelTab('network')}><Radio size={14} />Red</button>
        <button className={panelTab === 'telemetry' ? 'active' : ''} aria-pressed={panelTab === 'telemetry'} onClick={() => setPanelTab('telemetry')}><Layers size={14} />Telemetría</button>
      </nav>
      <div className="operations-panel-body" key={panelTab}>
        {panelTab === 'controls' ? <>
          <ModulePanel key={selected} selected={selected} state={s} dispatch={dispatch} />
          <section className="luna-card" aria-label="Orientación de LUNA">
            <LunaAvatar />
            <div className="luna-name">
              <strong>LUNA <Sparkles size={13} /></strong>
              <span>Compañera de exploración</span>
            </div>
            <div className="luna-copy">
              <p>{lunaTip(s, selected)}</p>
              <div className="operation-feedback" role="status" aria-live="polite">
                {s.events.at(-1)?.text || 'Experimenta a tu propio ritmo con los controles de cada subsistema.'}
              </div>
            </div>
          </section>
        </> : panelTab === 'network' ? (
          <NetworkPanel state={s} dispatch={dispatch} />
        ) : (
          <Telemetry state={s} history={telemetry.history} source={telemetry.source} />
        )}
      </div>
    </aside>
  )

  return (
    <div className={`hub-shell ${fullscreen ? 'is-fullscreen' : ''} ${viewMode === 'simulator' && !activeMission ? 'has-simulator' : ''} ${viewMode === 'pitch' && !activeMission ? 'has-pitch' : ''}`}>
      {/* ── BARRA SUPERIOR DE LA ESTACIÓN ESPACIAL ──────────────────────── */}
      <header className="hub-header">
        <div
          className="hub-brand"
          onClick={() => {
            setViewMode('hub')
            setActiveMission(null)
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="hub-logo">
            <Moon size={22} className="hub-moon-icon" />
            <Sparkles size={12} className="hub-sparkle-icon" />
          </div>
          <div>
            <div className="hub-title-row">
              <span className="hub-title">SELENE</span>
              <span className="hub-title-badge">ASTRONAUTAS JUNIOR</span>
            </div>
            <span className="hub-tagline">Centro de Misiones Espaciales · Conexión de Repositorios</span>
          </div>
        </div>

        <nav className="hub-nav-tabs">
          <button
            className={`nav-tab-btn ${viewMode === 'hub' && !activeMission ? 'active' : ''}`}
            onClick={() => {
              setViewMode('hub')
              setActiveMission(null)
            }}
            title="Ir al Centro de Misiones"
          >
            <Compass size={16} />
            <span>Centro de Misiones</span>
          </button>
          <button
            className={`nav-tab-btn ${viewMode === 'simulator' && !activeMission ? 'active' : ''}`}
            onClick={() => {
              setViewMode('simulator')
              setActiveMission(null)
            }}
            title="Ir a las Operaciones de la Base Lunar 3D"
          >
            <Rocket size={16} />
            <span>Operaciones de Base Lunar</span>
          </button>
          <button
            className={`nav-tab-btn ${viewMode === 'pitch' && !activeMission ? 'active' : ''}`}
            onClick={() => {
              setViewMode('pitch')
              setActiveMission(null)
            }}
            title="Ver presentación y pitch interactivo"
          >
            <Presentation size={16} />
            <span>Pitch & Presentación</span>
          </button>
        </nav>

        <div className="hub-status-bar">
          <div className="status-pill">
            <span className="status-dot-pulse" />
            <span>5 Misiones Conectadas</span>
          </div>
          <div className="status-pill clock-pill">
            <Terminal size={14} />
            <span>MET {clock || '20:25:33'}</span>
          </div>
        </div>
      </header>

      {/* ── VISTA ACTIVA: VISOR EMBEBIDO, HUB, PITCH O SIMULADOR 3D ────── */}
      {activeMission ? (
        <div className={`mission-viewer ${fullscreen ? 'is-fullscreen' : ''}`}>
          <div className="viewer-toolbar">
            <button className="back-button" onClick={() => setActiveMission(null)}>
              <ChevronLeft size={16} />
              <span>Volver al Centro de Misiones</span>
            </button>
            <div className="viewer-mission-info">
              <span className="viewer-mission-dot" style={{ background: activeMission.accentColor }} />
              <strong>{activeMission.title}</strong>
              <small>{activeMission.folder}</small>
            </div>
            <div className="viewer-actions">
              {activeMission.moduleId && (
                <button
                  className="action-launch-btn"
                  onClick={() => {
                    select(activeMission.moduleId!)
                    setViewMode('simulator')
                    setActiveMission(null)
                  }}
                >
                  <Rocket size={14} />
                  <span>Ver en Base Lunar</span>
                </button>
              )}
              <button
                className="action-icon-btn"
                title="Abrir en pestaña nueva"
                onClick={() => window.open(activeMission.url, '_blank')}
              >
                <ExternalLink size={16} />
              </button>
              <button
                className="action-icon-btn"
                title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                onClick={toggleFullscreen}
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          <div className="viewer-frame-container">
            <iframe
              src={activeMission.url}
              title={activeMission.title}
              className="mission-iframe"
            />
          </div>
        </div>
      ) : viewMode === 'hub' ? (
        <main className="hub-main">
          {/* ── MISIÓN PRINCIPAL DESTACADA ── */}
          <section className="featured-mission-banner">
            <div className="featured-badge">
              <Sparkles size={13} />
              <span>MISIÓN PRINCIPAL DESTACADA</span>
            </div>
            <div className="featured-content">
              <div className="featured-info">
                <h2>Base Lunar Selene: Centro de Gestión y Operaciones</h2>
                <p>
                  Entorno integrado de gestión y supervisión de la base lunar: controla el balance energético
                  fotovoltaico, maniobra el vehículo de superficie, ejecuta ciclos de limpieza electrodinámica
                  de celdas y transmite telemetría en tiempo real.
                </p>
                <div className="featured-tags">
                  <span className="tag-chip">Operaciones de Superficie</span>
                  <span className="tag-chip">Generación Fotovoltaica + Baterías</span>
                  <span className="tag-chip">Vehículo de Exploración</span>
                  <span className="tag-chip">Enlace de Telemetría DSN</span>
                </div>
              </div>
              <div className="featured-action">
                <button
                  className="btn-launch-featured"
                  onClick={() => {
                    setViewMode('simulator')
                  }}
                >
                  <Play size={16} fill="white" />
                  <span>Ingresar al Centro de Operaciones</span>
                </button>
                <button
                  className="btn-launch-pitch"
                  onClick={() => {
                    setViewMode('pitch')
                  }}
                >
                  <Presentation size={16} />
                  <span>Ver Pitch Interactivo</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── REPOSITORIOS Y LABORATORIOS CONECTADOS ── */}
          <section className="hub-hero">
            <div className="hero-kicker">
              <Rocket size={13} />
              <span>REPOSITORIOS Y LABORATORIOS CONECTADOS</span>
            </div>
            <h1>Conecta y Explora Cada Misión</h1>
            <p>
              Accede directamente a los entornos de los 4 repositorios espaciales. Puedes explorarlos a
              pantalla completa dentro de este centro de mando o abrirlos en pestañas independientes.
            </p>
          </section>

          {/* ── CUADRÍCULA DE MISIONES ── */}
          <div className="missions-grid">
            {MISSIONS.map(m => {
              const Icon = m.icon
              return (
                <article
                  key={m.id}
                  className="mission-card"
                  style={{ '--mission-accent': m.accentColor } as React.CSSProperties}
                >
                  <div className="mission-card-top">
                    <span className="mission-number">{m.number}</span>
                    <span className="mission-badge">{m.badge}</span>
                  </div>

                  <div className="mission-header">
                    <div className="mission-icon-wrap" style={{ color: m.accentColor }}>
                      <Icon size={26} />
                    </div>
                    <div>
                      <h2>{m.title}</h2>
                      <span className="mission-subtitle">{m.subtitle}</span>
                    </div>
                  </div>

                  <p className="mission-desc">{m.description}</p>

                  <div className="mission-highlights">
                    <span className="highlights-title">CARACTERÍSTICAS DE LA MISIÓN:</span>
                    <ul>
                      {m.highlights.map((h, i) => (
                        <li key={i}>
                          <CircleDot size={14} style={{ color: m.accentColor, flexShrink: 0 }} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Nombre del repositorio SIN icono de carpeta */}
                  <span className="mission-folder-pill">{m.folder}</span>

                  <div className="mission-tags">
                    {m.tags.map(tag => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mission-card-actions">
                    <button
                      className="btn-connect"
                      style={{
                        background: `linear-gradient(135deg, ${m.accentColor}33, ${m.accentColor}18)`,
                        border: `1px solid ${m.accentColor}99`,
                        color: '#ffffff',
                        boxShadow: `0 0 16px ${m.accentColor}22`
                      }}
                      onClick={() => {
                        setActiveMission(m)
                      }}
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Conectar y Abrir</span>
                    </button>
                    <button
                      className="btn-external"
                      onClick={() => {
                        window.open(m.url, '_blank')
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>Nueva pestaña</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {/* ── ARQUITECTURA DE REPOSITORIOS LOCALES CONECTADOS ── */}
          <section className="hub-infra">
            <div className="infra-header">
              <Layers size={18} />
              <h3>Arquitectura de Repositorios Locales Conectados</h3>
            </div>
            <div className="infra-grid">
              <div className="infra-item">
                <span className="infra-dot" />
                <strong>final-project-Lunar-E</strong>
                <code>D:\SimuladorParaAustronautasJunior\final-project-Lunar-E</code>
              </div>
              <div className="infra-item">
                <span className="infra-dot" />
                <strong>ZERO-G-Junior-Astronaut-Trainer</strong>
                <code>D:\SimuladorParaAustronautasJunior\ZERO-G-Junior-Astronaut-Trainer</code>
              </div>
              <div className="infra-item">
                <span className="infra-dot" />
                <strong>Dust-Shield</strong>
                <code>D:\SimuladorParaAustronautasJunior\Dust-Shield</code>
              </div>
              <div className="infra-item">
                <span className="infra-dot" />
                <strong>openmct</strong>
                <code>D:\SimuladorParaAustronautasJunior\openmct</code>
              </div>
            </div>
          </section>

          {/* ── PIE DE PÁGINA ── */}
          <footer className="hub-footer">
            <p>✦ Centro de Misión para Astronautas Junior • Todos los repositorios se ejecutan y enlazan localmente en tu equipo.</p>
          </footer>
        </main>
      ) : viewMode === 'pitch' ? (
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
        <div className={`simulator-container ${fullscreen ? 'is-fullscreen' : ''}`}>
          <div className="simulator-subnav">
            <button className="back-button" onClick={() => setViewMode('hub')} title="Volver al Centro de Misiones" aria-label="Volver al Centro de Misiones">
              <ChevronLeft size={16} />
              <span>Centro de Misiones</span>
            </button>
            <div className="simulator-title-badge">
              <Rocket size={15} />
              <h1>Centro de Operaciones y Exploración Lunar</h1>
            </div>
            <div className="sim-quick-actions">
              <button onClick={() => dispatch({ type: 'pause' })} className="sim-btn-sub" title={s.paused ? 'Continuar simulación' : 'Pausar simulación'} aria-label={s.paused ? 'Continuar simulación' : 'Pausar simulación'}>
                {s.paused ? <Play size={15} /> : <Pause size={15} />}
                <span>{s.paused ? 'Continuar' : 'Pausar'}</span>
              </button>
              <button
                onClick={() => panelOpen ? closePanel() : setPanelOpen(true)}
                className={`sim-btn-sub sim-panel-toggle ${panelOpen ? 'is-active' : ''}`}
                title="Panel de control y telemetría"
                aria-label="Panel de control y telemetría"
                aria-expanded={panelOpen}
                aria-controls="operations-panel"
              >
                <PanelRight size={15} /><span>Panel de control</span>
              </button>
              <button onClick={() => setDialog('guide')} className="sim-btn-sub" title="Guía y protocolo" aria-label="Guía y protocolo">
                <CircleHelp size={15} /> <span>Protocolo</span>
              </button>
              <button onClick={() => setDialog('notebook')} className="sim-btn-sub" title="Cuaderno de descubrimientos" aria-label="Cuaderno de descubrimientos">
                <BookOpen size={15} /> <span>Bitácora</span>
              </button>
              <button onClick={() => setDialog('reset')} className="sim-btn-sub" title="Reiniciar simulación" aria-label="Reiniciar simulación">
                <RotateCcw size={15} /> <span>Reiniciar</span>
              </button>
              <button
                onClick={toggleFullscreen}
                className={`sim-btn-sub sim-btn-fullscreen ${fullscreen ? 'is-active' : ''}`}
                title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                <span>{fullscreen ? 'Restaurar' : 'Pantalla Completa'}</span>
              </button>
            </div>
          </div>

          <main className={`simulator-main ${panelOpen ? 'has-panel-open' : ''}`}>
            {/* VISOR DE SUPERFICIE A TODO EL ANCHO */}
            <div className="station-grid">
              <section className="scene-card" aria-label="Superficie de operaciones · Base Selene">
                <div
                  className="scene-wrap"
                  ref={sceneRef}
                  tabIndex={0}
                  aria-label="Explorar la superficie lunar. Arrastra para orbitar y usa la rueda para zoom. Con el rover seleccionado, conduce con WASD o flechas."
                  onPointerDown={event => {
                    if (event.target instanceof HTMLCanvasElement) sceneRef.current?.focus({ preventScroll: true })
                  }}
                >
                  <Suspense fallback={<div className="scene-loading"><Moon size={36} /><p>Cargando estación lunar 3D…</p></div>}>
                    <Scene
                      state={s}
                      selected={selected}
                      onSelect={inspect}
                      cameraMode={cameraMode}
                      cameraCommand={cameraCommand}
                      quality={quality}
                    />
                  </Suspense>
                  <div className="scene-coordinate">
                    <span><span className="live-indicator" /> BASE SELENE {s.paused && '· EN PAUSA'}</span>
                    <small>
                      {selected === 'rover'
                        ? 'Polo Sur Lunar · Zona de exploración: 120 × 120 m'
                        : selected === 'control'
                        ? 'Base Selene · Estación de Control de Vuelo DSN (Centro Neurálgico)'
                        : selected === 'iss'
                        ? 'Órbita Terrestre Baja (LEO) · 420.5 km · Nodo de Misiones en Tierra'
                        : 'Polo Sur Lunar · Superficie de operaciones'}
                    </small>
                    {selected === 'rover' && <>
                      <small>Muestras guardadas: {s.collectedRocks.length}/{LUNAR_ROCKS.length}{s.heldRockId ? ' · Roca en la pinza' : ''}</small>
                      {nearestRock.rock && <small>Próxima roca: {nearestRock.rock.name} · {nearestRock.distance.toFixed(1)} m</small>}
                    </>}
                    {selected === 'control' && <>
                      <small>Estación DSN Activa: {s.activeGroundStation?.toUpperCase() || 'MADRID'} · 10 Canales Selene Nominales</small>
                    </>}
                    {selected === 'iss' && <>
                      <small>Velocidad Orbital: 27.600 km/h · Centros en Tierra: Houston, ESOC, Tsukuba, KSC</small>
                    </>}
                  </div>
                  <div className="scene-controls">
                    <button title="Vista general de la base" aria-label="Restablecer vista general" onClick={() => camera('reset')}>
                      <Home size={17} />
                    </button>
                    <button
                      title="Enfocar Estación de Control de Vuelo DSN"
                      aria-label="Enfocar Estación de Control de Vuelo DSN"
                      className={cameraMode === 'control' ? 'is-active' : ''}
                      onClick={() => {
                        setSelected('control')
                        setCameraMode('control')
                      }}
                    >
                      <Activity size={17} />
                    </button>
                    <button
                      title="Enfocar Estación Espacial Internacional (ISS) en Órbita"
                      aria-label="Enfocar Estación Espacial Internacional en Órbita"
                      className={cameraMode === 'iss' ? 'is-active' : ''}
                      onClick={() => {
                        setSelected('iss')
                        setCameraMode('iss')
                      }}
                    >
                      <Globe size={17} />
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
                      aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                      onClick={toggleFullscreen}
                    >
                      {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                    </button>
                  </div>
                  <div className="scene-bottom">
                    <span>
                      <Maximize2 size={13} /> {selected === 'rover'
                        ? 'WASD: conducir · Q/E: girar brazo · R/F: hombro · T/G: codo · Espacio: recoger · B: guardar'
                        : selected === 'control'
                        ? 'Estación de Control DSN · Supervisa los 10 canales y sincroniza enlaces terrestres'
                        : selected === 'iss'
                        ? 'Estación Espacial Internacional en órbita LEO · Coordina misiones con Houston y ESOC'
                        : 'Arrastra para rotar cámara · Rueda para zoom · Selecciona el rover para explorar y recoger rocas'}
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
                  {operationsPanel}
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
                        onClick={() => inspect(id)}
                      >
                        <Icon size={15} />
                        {id === 'solar'
                          ? 'Paneles y EDS'
                          : id === 'rover'
                          ? 'Rover Lunar'
                          : id === 'comms'
                          ? 'Antena DSN'
                          : id === 'control'
                          ? 'Estación de Control (DSN)'
                          : 'Estación Espacial (ISS)'}
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
                  {selected === 'control' && (
                    <button
                      className={cameraMode === 'control' ? 'selected follow' : 'follow'}
                      aria-pressed={cameraMode === 'control'}
                      onClick={() => setCameraMode(m => (m === 'control' ? 'overview' : 'control'))}
                    >
                      <Activity size={14} /> Vista Estación Control
                    </button>
                  )}
                  {selected === 'iss' && (
                    <button
                      className={cameraMode === 'iss' ? 'selected follow' : 'follow'}
                      aria-pressed={cameraMode === 'iss'}
                      onClick={() => setCameraMode(m => (m === 'iss' ? 'overview' : 'iss'))}
                    >
                      <Globe size={14} /> Vista ISS en Órbita
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

            </div>

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
                        <strong>Rover Lunar de Exploración:</strong> Conduce con WASD o flechas por una zona de 120 × 120 metros. Las rocas recolectables están marcadas. Detente cerca y abre la pestaña Brazo: orienta la base, baja el hombro y ajusta el codo hasta alinear la pinza; pulsa Recoger roca y después Guardar muestra. También puedes manejar el brazo con Q/E, R/F y T/G, recoger con Espacio y guardar con B cuando el visor tenga el foco. Usa C para abrir o cerrar la pinza vacía y X para replegar el brazo. Regresa a la base para recargar.
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
