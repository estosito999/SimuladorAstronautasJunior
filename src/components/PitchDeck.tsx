import { useEffect, useState, type ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Rocket,
  Compass,
  Zap,
  Radio,
  Sparkles,
  Cpu,
  Award,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Activity
} from 'lucide-react'

interface RepoMission {
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
}

interface PitchDeckProps {
  missions: RepoMission[]
  onLaunchMission: (mission: RepoMission) => void
  onOpenStation: () => void
}

interface Slide {
  id: string
  number: string
  category: string
  title: string
  subtitle: string
  render: (props: PitchDeckProps & { onNext: () => void; onPrev: () => void; goToSlide: (idx: number) => void }) => ReactNode
}

export default function PitchDeck({ missions, onLaunchMission, onOpenStation }: PitchDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [autoplay, setAutoplay] = useState(false)

  const SLIDES: Slide[] = [
    // ── SLIDE 1: PORTADA ───────────────────────────────────────────
    {
      id: 'cover',
      number: '01',
      category: 'VISIÓN & INTRODUCCIÓN',
      title: 'SELENE: Academia de Misión para Astronautas Junior',
      subtitle: 'Ecosistema interactivo de simulación y gestión aeroespacial para la nueva generación',
      render: ({ onNext, goToSlide }) => (
        <div className="pitch-slide cover-slide">
          <div className="pitch-cover-badge">
            <Sparkles size={14} />
            <span>NASA SPACE APPS CHALLENGE · PROPUESTA TECNOLÓGICA & EDUCATIVA</span>
          </div>

          <h1 className="pitch-hero-title">
            Inspirando a los exploradores<br />
            <span className="gradient-text">del mañana, hoy.</span>
          </h1>

          <p className="pitch-hero-description">
            SELENE une <strong>5 simuladores de alta fidelidad</strong> en una sola plataforma integrada:
            conducción de rovers, gestión y supervivencia en Marte y la Luna, mitigación de polvo electrodinámico,
            telemetría operativa estilo NASA y gestión de soporte vital en tiempo real.
          </p>

          <div className="pitch-metric-pills">
            <div className="metric-pill">
              <strong>5</strong>
              <span>Misiones Conectadas</span>
            </div>
            <div className="metric-pill">
              <strong>100%</strong>
              <span>Ejecución Local & Offline</span>
            </div>
            <div className="metric-pill">
              <strong>10</strong>
              <span>Canales de Telemetría Real</span>
            </div>
            <div className="metric-pill">
              <strong>0.166 G</strong>
              <span>Física Planetaria Realista</span>
            </div>
          </div>

          <div className="pitch-cta-row">
            <button className="pitch-primary-btn" onClick={onNext}>
              <span>Comenzar Presentación</span>
              <ArrowRight size={18} />
            </button>
            <button className="pitch-ghost-btn" onClick={() => goToSlide(3)}>
              <span>Explorar las 5 Misiones</span>
            </button>
          </div>
        </div>
      )
    },

    // ── SLIDE 2: EL PROBLEMA ───────────────────────────────────────
    {
      id: 'problem',
      number: '02',
      category: 'DIAGNÓSTICO & OPORTUNIDAD',
      title: 'El Problema: La Brecha Educativa Aeroespacial',
      subtitle: 'La ciencia espacial suele ser abstracta, fragmentada y pasiva en el aula',
      render: () => (
        <div className="pitch-slide">
          <div className="pitch-grid-two">
            <div className="pitch-card danger-card">
              <div className="card-top">
                <span className="card-icon red">⚠️</span>
                <h3>La Realidad Actual</h3>
              </div>
              <ul className="pitch-list">
                <li>
                  <strong>Teoría desarticulada:</strong> Los conceptos de física gravitatoria, conversión fotovoltaica y telemetría se enseñan en pizarras sin aplicación práctica.
                </li>
                <li>
                  <strong>Falta de integración sistémica:</strong> Los alumnos no ven cómo la batería afecta la antena o cómo el polvo en un panel paraliza un rover.
                </li>
                <li>
                  <strong>Simuladores aislados o inaccesibles:</strong> Requieren suscripciones de pago, servidores en la nube o hardware especializado incompatible con aulas escolares.
                </li>
              </ul>
            </div>

            <div className="pitch-card success-card">
              <div className="card-top">
                <span className="card-icon green">✦</span>
                <h3>Nuestra Propuesta de Valor</h3>
              </div>
              <ul className="pitch-list">
                <li>
                  <strong>Aprendizaje experiencial «Hands-On»:</strong> Aprender resolviendo situaciones críticas reales de una misión espacial.
                </li>
                <li>
                  <strong>Ecosistema unificado:</strong> 5 proyectos y repositorios complementarios que intercambian datos y se retroalimentan.
                </li>
                <li>
                  <strong>Accesibilidad universal:</strong> Funciona directamente en cualquier navegador web moderno, sin descargas pesadas ni requisitos de nube.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },

    // ── SLIDE 3: LA SOLUCIÓN & ARQUITECTURA ─────────────────────────
    {
      id: 'architecture',
      number: '03',
      category: 'INGENIERÍA & SOLUCIÓN',
      title: 'Arquitectura del Ecosistema Integrado',
      subtitle: 'Una sola consola de mando unificando 5 fuentes de tecnología y código',
      render: () => (
        <div className="pitch-slide">
          <div className="pitch-arch-diagram">
            <div className="arch-core-box">
              <div className="core-header">
                <Rocket size={20} className="core-icon" />
                <div>
                  <strong>HUB CENTRAL SELENE</strong>
                  <small>Orquestación, Conexión de Repositorios y Telemetría Compartida</small>
                </div>
              </div>
            </div>

            <div className="arch-branches-grid">
              <div className="arch-branch">
                <Compass size={18} style={{ color: '#38bdf8' }} />
                <strong>Misión Reconocimiento</strong>
                <small>final-project-Lunar-E</small>
                <p>Navegación cinemática del rover en regolito y cartografía de superficie.</p>
              </div>

              <div className="arch-branch">
                <Rocket size={18} style={{ color: '#34d399' }} />
                <strong>Gestión de Hábitat</strong>
                <small>Asentamientos Planetarios</small>
                <p>Supervivencia táctica, presupuestos, soporte vital y balance de masa en Luna/Marte.</p>
              </div>

              <div className="arch-branch">
                <Zap size={18} style={{ color: '#fbbf24' }} />
                <strong>Mantenimiento Energético</strong>
                <small>Dust-Shield Digital Twin</small>
                <p>Escudo electrodinámico (EDS) para mitigación de polvo por ondas viajeras.</p>
              </div>

              <div className="arch-branch">
                <Radio size={18} style={{ color: '#a78bfa' }} />
                <strong>Control de Vuelo DSN</strong>
                <small>NASA Open MCT</small>
                <p>Monitoreo y exportación de 10 canales en tiempo real mediante Deep Space Network.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ── SLIDE 4: LAS 5 MISIONES INTERACTIVAS ───────────────────────
    {
      id: 'missions',
      number: '04',
      category: 'MISIÓN POR MISIÓN (DEMO EN VIVO)',
      title: 'Las 5 Misiones Conectadas del Simulador',
      subtitle: 'Haz clic en cualquier misión para inspeccionarla o probarla en tiempo real',
      render: ({ missions, onLaunchMission, onOpenStation }) => (
        <div className="pitch-slide">
          <div className="pitch-missions-grid">
            {/* 1. Misión Central Selene */}
            <div className="pitch-mission-item highlight">
              <div className="item-header">
                <span className="item-badge" style={{ backgroundColor: '#f97316' }}>Misión Central</span>
                <span className="item-status">● Integrado</span>
              </div>
              <h4>Base Lunar Selene: Centro de Gestión</h4>
              <p>Simulador interactivo con asistente LUNA, gestión de energía, switches de red y conducción.</p>
              <button className="pitch-action-btn" onClick={onOpenStation}>
                <span>Abrir Base Selene</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 2. Reconocimiento Rover */}
            {missions.map(m => (
              <div className="pitch-mission-item" key={m.id}>
                <div className="item-header">
                  <span className="item-badge" style={{ backgroundColor: m.accentColor }}>{m.badge}</span>
                  <span className="item-status">● Conectado</span>
                </div>
                <h4>{m.title}</h4>
                <p>{m.subtitle}</p>
                <button className="pitch-action-btn" onClick={() => onLaunchMission(m)}>
                  <span>Lanzar Misión</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    },

    // ── SLIDE 5: INNOVACIÓN TÉCNICA ────────────────────────────────
    {
      id: 'technology',
      number: '05',
      category: 'TECNOLOGÍA & PERFORMANCE',
      title: 'Innovación Tecnológica e Integración Local',
      subtitle: 'Ingeniería de software robusta, sin pantallas en blanco ni dependencias frágiles',
      render: () => (
        <div className="pitch-slide">
          <div className="pitch-features-grid">
            <div className="pitch-feature">
              <Cpu size={24} style={{ color: '#38bdf8' }} />
              <h4>Bridges de Datos Sincronizados</h4>
              <p>Contratos tipados en TypeScript y módulos ES que comparten ecuaciones de potencia, atenuación y telemetría de forma determinista.</p>
            </div>

            <div className="pitch-feature">
              <ShieldCheck size={24} style={{ color: '#34d399' }} />
              <h4>Zero-Crash & Resiliencia</h4>
              <p>Manejo de errores por aislamiento de subprocesos y sandboxes estáticos: si una misión recarga, el resto del ecosistema continúa intacto.</p>
            </div>

            <div className="pitch-feature">
              <Activity size={24} style={{ color: '#fbbf24' }} />
              <h4>Telemetría NASA Open MCT</h4>
              <p>Integración con los estándares abiertos de la NASA para telemetría en tiempo real, trazado de gráficos y exportación en CSV para análisis.</p>
            </div>

            <div className="pitch-feature">
              <Terminal size={24} style={{ color: '#a78bfa' }} />
              <h4>54 Tests Automatizados</h4>
              <p>Pruebas unitarias y de integración que verifican las fórmulas físicas, los límites de movimiento del rover y el soporte vital.</p>
            </div>
          </div>
        </div>
      )
    },

    // ── SLIDE 6: METODOLOGÍA EDUCATIVA ─────────────────────────────
    {
      id: 'education',
      number: '06',
      category: 'PEDAGOGÍA STEM',
      title: 'Impacto Educativo: Formando Jóvenes Astronautas',
      subtitle: 'Diseñado bajo la metodología de indagación guiada y toma de decisiones',
      render: () => (
        <div className="pitch-slide">
          <div className="pitch-pillars-row">
            <div className="pitch-pillar">
              <div className="pillar-num">01</div>
              <h4>Aprender con LUNA</h4>
              <p>Una asistente virtual no invasiva que explica causas y efectos científicos en lenguaje claro para edades de 7 a 14 años.</p>
            </div>

            <div className="pitch-pillar">
              <div className="pillar-num">02</div>
              <h4>Decisiones con Impacto</h4>
              <p>Desconectar un cable de antena o no limpiar el polvo de las celdas solares tiene consecuencias inmediatas y medibles en la simulación.</p>
            </div>

            <div className="pitch-pillar">
              <div className="pillar-num">03</div>
              <h4>Vínculo con Ciencia Real</h4>
              <p>Módulos directamente inspirados en misiones oficiales: rovers de Marte, Red DSN y tecnología electrodinámica de la NASA.</p>
            </div>
          </div>
        </div>
      )
    },

    // ── SLIDE 7: HOJA DE RUTA Y FUTURO ─────────────────────────────
    {
      id: 'future',
      number: '07',
      category: 'VISIÓN A FUTURO & ESCALABILIDAD',
      title: 'Hoja de Ruta: El Futuro de SELENE',
      subtitle: 'De un simulador en navegador a una plataforma interplanetaria en aulas y museos',
      render: () => (
        <div className="pitch-slide">
          <div className="pitch-roadmap">
            <div className="roadmap-phase completed">
              <div className="phase-badge">FASE 1 · LOGRADO</div>
              <h4>Ecosistema 5 en 1</h4>
              <ul>
                <li>Fusión de los 5 proyectos en un solo hub local.</li>
                <li>Nombres y física aeroespacial realista.</li>
                <li>Telemetría unificada y cero pantallas en blanco.</li>
              </ul>
            </div>

            <div className="roadmap-phase active">
              <div className="phase-badge highlight">FASE 2 · EN CURSO</div>
              <h4>Modo Aula Multijugador</h4>
              <ul>
                <li>Roles asignados en red local (Comandante, Científico, Ingeniero, Director de Vuelo).</li>
                <li>Resolución colaborativa de emergencias en equipo.</li>
                <li>Panel de evaluación docente con bitácora de progreso.</li>
              </ul>
            </div>

            <div className="roadmap-phase">
              <div className="phase-badge">FASE 3 · PRÓXIMA</div>
              <h4>Telemetría IoT Real (Hardware)</h4>
              <ul>
                <li>Conexión con microcontroladores (ESP32/Arduino).</li>
                <li>Rovers impresos en 3D que reportan telemetría real al simulador.</li>
                <li>Celdas solares y sensores de luz físicos en el aula.</li>
              </ul>
            </div>

            <div className="roadmap-phase">
              <div className="phase-badge">FASE 4 · EXPANSIÓN</div>
              <h4>Red de Planetarios & Colegios</h4>
              <ul>
                <li>Despliegue curricular para escuelas públicas y centros de ciencias.</li>
                <li>Certificaciones de misiones y pasaporte de astronauta junior.</li>
                <li>Compatibilidad WebXR para visores de realidad inmersiva.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },

    // ── SLIDE 8: EQUIPO Y LLAMADO A LA ACCIÓN ──────────────────────
    {
      id: 'conclusion',
      number: '08',
      category: 'CONCLUSIÓN & LLAMADO',
      title: 'El Próximo Paso en la Exploración Comienza Aquí',
      subtitle: 'La curiosidad es el combustible que nos llevará de regreso a la Luna y hacia Marte',
      render: ({ onOpenStation }) => (
        <div className="pitch-slide conclusion-slide">
          <Award size={48} className="conclusion-trophy" />
          <h2>Listo para despegue.</h2>
          <p>
            SELENE demuestra que la tecnología web moderna puede transformar proyectos aislados en una experiencia unificada, pedagógica y profundamente inspiradora.
          </p>

          <div className="conclusion-buttons">
            <button className="pitch-primary-btn" onClick={onOpenStation}>
              <Rocket size={18} />
              <span>Explorar Estación Selene</span>
            </button>
            <a
              href="https://www.spaceappschallenge.org/"
              target="_blank"
              rel="noreferrer"
              className="pitch-ghost-btn"
            >
              <span>NASA Space Apps Challenge</span>
              <ExternalLink size={15} />
            </a>
          </div>

          <div className="conclusion-footer-badge">
            <Sparkles size={14} />
            <span>Desarrollado para mentes curiosas · Proyecto Educativo de Misión Espacial</span>
          </div>
        </div>
      )
    }
  ]

  // Controles de teclado para avanzar/retroceder diapositivas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        setCurrentSlide(prev => (prev < SLIDES.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Home') {
        setCurrentSlide(0)
      } else if (e.key === 'End') {
        setCurrentSlide(SLIDES.length - 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [SLIDES.length])

  // Autoplay de diapositivas
  useEffect(() => {
    if (!autoplay) return
    const timer = window.setInterval(() => {
      setCurrentSlide(prev => (prev < SLIDES.length - 1 ? prev + 1 : 0))
    }, 8000)
    return () => window.clearInterval(timer)
  }, [autoplay, SLIDES.length])

  const slide = SLIDES[currentSlide]
  const next = () => setCurrentSlide(prev => (prev < SLIDES.length - 1 ? prev + 1 : prev))
  const prev = () => setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev))
  const goToSlide = (idx: number) => setCurrentSlide(idx)

  return (
    <section className={`pitch-container ${fullscreen ? 'is-fullscreen' : ''}`}>
      {/* ── BARRA SUPERIOR DE LA PRESENTACIÓN ────────────────────────── */}
      <header className="pitch-header">
        <div className="pitch-header-info">
          <span className="pitch-slide-num">{slide.number} / 08</span>
          <span className="pitch-category">{slide.category}</span>
          <h2 className="pitch-slide-title-preview">{slide.title}</h2>
        </div>

        <div className="pitch-controls-right">
          <button
            className={`pitch-ctrl-btn ${autoplay ? 'active' : ''}`}
            onClick={() => setAutoplay(!autoplay)}
            title={autoplay ? 'Pausar reproducción automática' : 'Reproducción automática (8s)'}
          >
            {autoplay ? <Pause size={16} /> : <Play size={16} />}
            <span>{autoplay ? 'Pausar' : 'Autoplay'}</span>
          </button>

          <button
            className="pitch-ctrl-btn"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? 'Salir de pantalla completa' : 'Modo presentación pantalla completa'}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* ── LIENZO PRINCIPAL DE LA DIAPOSITIVA (ESTILO SLIDE 16:9) ───── */}
      <div className="pitch-stage">
        <div className="pitch-canvas">
          <header className="slide-content-header">
            <span className="slide-eyebrow">{slide.category}</span>
            <h1 className="slide-main-title">{slide.title}</h1>
            <p className="slide-subtitle">{slide.subtitle}</p>
          </header>

          <div className="slide-body">
            {slide.render({ missions, onLaunchMission, onOpenStation, onNext: next, onPrev: prev, goToSlide })}
          </div>
        </div>
      </div>

      {/* ── BARRA INFERIOR DE NAVEGACIÓN Y MINIATURAS ───────────────── */}
      <footer className="pitch-footer">
        <button
          className="pitch-nav-arrow"
          disabled={currentSlide === 0}
          onClick={prev}
          title="Diapositiva anterior (Flecha Izquierda)"
        >
          <ChevronLeft size={20} />
          <span>Anterior</span>
        </button>

        <div className="pitch-dots-tray">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              className={`pitch-dot-pill ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
              title={`${s.number}: ${s.title}`}
            >
              <span className="dot-index">{s.number}</span>
              <span className="dot-title">{s.title.split(':')[0]}</span>
            </button>
          ))}
        </div>

        <button
          className="pitch-nav-arrow next"
          disabled={currentSlide === SLIDES.length - 1}
          onClick={next}
          title="Siguiente diapositiva (Flecha Derecha / Espacio)"
        >
          <span>Siguiente</span>
          <ChevronRight size={20} />
        </button>
      </footer>
    </section>
  )
}
