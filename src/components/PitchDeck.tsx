import { lazy, Suspense, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight, Atom, BookOpen, ChevronLeft, ChevronRight, Code2, Compass,
  Download, Eye, GraduationCap, Lightbulb, Maximize2, Minimize2, Moon,
  Orbit, Pause, Play, Radio, Rocket, RotateCcw, Sigma, Sparkles, Truck,
  WandSparkles, Waves, Wrench, X, Zap,
} from 'lucide-react'
import { PITCH_SECTIONS, PITCH_SCRIPT } from '../education/pitchContent'
import {
  getPitchSlideAt, getPitchSlideStart, initialPlayback, PITCH_DURATION,
  PITCH_DURATIONS, playbackReducer,
} from '../education/pitchPlayback'
import './pitch.css'

const PitchSpace = lazy(() => import('./pitch/PitchSpace'))

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

const clock = (seconds: number) => {
  const time = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`
}

const DISCIPLINES = [
  { name: 'Matemáticas', icon: Sigma, detail: 'Calcular una trayectoria para alcanzar un destino.' },
  { name: 'Física', icon: Atom, detail: 'Comprender el movimiento, la luz y la energía.' },
  { name: 'Ingeniería', icon: Wrench, detail: 'Construir los equipos que hacen posible una misión.' },
  { name: 'Informática', icon: Code2, detail: 'Programar un rover y conectar los datos de la estación.' },
  { name: 'Ciencia', icon: Lightbulb, detail: 'Observar, hacer preguntas y poner a prueba una explicación.' },
] as const

const VISUAL_LABELS = [
  ['La mirada', 'Un cielo de posibilidades', 'Mueve el cursor y explora las estrellas'],
  ['El impulso', 'Nuestra curiosidad nos mueve', 'Una historia de preguntas y descubrimientos'],
  ['El destino', 'La Luna dejó de ser imposible', 'El conocimiento hizo posible llegar'],
  ['La conexión', 'Muchas ciencias. Una misión.', 'Selecciona una disciplina para descubrir su papel'],
  ['El comienzo', 'La curiosidad no espera', 'Las primeras preguntas también importan'],
  ['La experiencia', 'Una base lunar para aprender', 'Explorar y comprender con nuestras decisiones'],
  ['El propósito', 'El próximo explorador', 'Su viaje puede comenzar aquí'],
] as const

export default function PitchDeck({ onOpenStation }: PitchDeckProps) {
  const [playback, dispatch] = useReducer(playbackReducer, initialPlayback)
  const [fullscreen, setFullscreen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [transition, setTransition] = useState<{ id: number; direction: 1 | -1 }>({ id: 0, direction: 1 })
  const [wonder, setWonder] = useState(0)
  const [route, setRoute] = useState(0)
  const [discipline, setDiscipline] = useState(0)
  const [question, setQuestion] = useState(false)
  const [project, setProject] = useState(0)
  const rootRef = useRef<HTMLElement>(null)
  const notesHeadingRef = useRef<HTMLHeadingElement>(null)
  const currentSlide = getPitchSlideAt(playback.elapsed)
  const previousSlide = useRef(currentSlide)
  const slideRef = useRef(currentSlide)
  slideRef.current = currentSlide
  const section = PITCH_SECTIONS[currentSlide]
  const start = getPitchSlideStart(currentSlide)
  const duration = PITCH_DURATIONS[currentSlide]
  const slideProgress = Math.min(1, Math.max(0, (playback.elapsed - start) / duration))
  const finished = playback.elapsed >= PITCH_DURATION

  useEffect(() => {
    if (currentSlide === previousSlide.current) return
    const direction = currentSlide > previousSlide.current ? 1 : -1
    previousSlide.current = currentSlide
    setTransition(value => ({ id: value.id + 1, direction }))
  }, [currentSlide])

  useEffect(() => {
    if (!playback.playing) return
    let previous = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      dispatch({ type: 'tick', seconds: (now - previous) / 1000 })
      previous = now
    }, 100)
    return () => window.clearInterval(timer)
  }, [playback.playing])

  useEffect(() => {
    const visibility = () => { if (document.hidden) dispatch({ type: 'pause' }) }
    const fullscreenChange = () => setFullscreen(document.fullscreenElement === rootRef.current)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const motionChange = () => setReducedMotion(media.matches)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('fullscreenchange', fullscreenChange)
    media.addEventListener('change', motionChange)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('fullscreenchange', fullscreenChange)
      media.removeEventListener('change', motionChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else rootRef.current?.requestFullscreen().catch(() => {})
  }

  const goToSlide = (index: number) => {
    if (index < 0 || index >= PITCH_SECTIONS.length) return
    // Manual navigation is rehearsal; the timed run resumes only on request.
    dispatch({ type: 'pause' })
    dispatch({ type: 'seek', slide: index })
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'Escape' && notesOpen) {
        setNotesOpen(false)
        rootRef.current?.querySelector<HTMLButtonElement>('[aria-controls="pitch-narration"]')?.focus()
        return
      }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); setNotesOpen(open => !open); return }
      if (notesOpen) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goToSlide(slideRef.current + 1) }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goToSlide(slideRef.current - 1) }
      else if (event.key === ' ' && !(event.target as HTMLElement | null)?.closest('button, a')) { event.preventDefault(); if (!event.repeat) dispatch({ type: 'toggle' }) }
      else if (event.key === 'Home') { event.preventDefault(); dispatch({ type: 'restart' }) }
      else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [notesOpen])

  useEffect(() => {
    if (notesOpen) notesHeadingRef.current?.focus({ preventScroll: true })
  }, [notesOpen])

  const downloadScript = () => {
    const timedScript = PITCH_SECTIONS.map((part, index) => {
      const from = getPitchSlideStart(index)
      return `[${clock(from)} a ${clock(from + PITCH_DURATIONS[index])}] ${part.label}\n\n${part.narration.join('\n\n')}`
    }).join('\n\n────────────────────────\n\n')
    const blob = new Blob([`Simulador para Astronautas Junior\nGuion del pitch · 3 minutos · ${PITCH_SCRIPT.split(/\s+/).length} palabras\n\n${timedScript}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Guion_Astronautas_Junior_3_minutos.txt'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const [beforeEmphasis, afterEmphasis] = section.title.split(section.emphasis)
  let interaction: ReactNode
  if (currentSlide === 0) {
    const feelings = [
      { name: 'Belleza', text: 'Pequeños puntos de luz. Distancias inimaginables.' },
      { name: 'Asombro', text: 'Aunque sabemos lo lejos que están, queremos alcanzarlos.' },
      { name: 'Misterio', text: 'El deseo de descubrir qué se encuentra más allá.' },
    ]
    interaction = <>
      <div className="cp-choice-row" aria-label="Explorar lo que nos inspira el universo">{feelings.map((feeling, index) => <button key={feeling.name} className={`cp-choice ${wonder === index ? 'is-selected' : ''}`} aria-pressed={wonder === index} onClick={() => setWonder(index)}><Sparkles size={15} />{feeling.name}</button>)}</div>
      <blockquote className="cp-reveal">{feelings[wonder].text}</blockquote>
    </>
  } else if (currentSlide === 1) {
    const routes = [
      { name: 'Océanos', icon: Waves, text: 'La curiosidad nos llevó a cruzar océanos y descubrir nuevos continentes.' },
      { name: 'Naturaleza', icon: Atom, text: 'Nos llevó a comprender las leyes de la naturaleza.' },
      { name: 'Espacio', icon: Rocket, text: 'Y, finalmente, a abandonar por primera vez nuestro propio planeta.' },
    ]
    interaction = <><div className="cp-route" aria-label="El recorrido de la curiosidad">{routes.map((step, index) => <button key={step.name} className={`cp-choice ${route === index ? 'is-selected' : ''}`} aria-pressed={route === index} onClick={() => setRoute(index)}><step.icon size={20} /><span>{step.name}</span></button>)}</div><blockquote className="cp-reveal">{routes[route].text}</blockquote></>
  } else if (currentSlide === 2) {
    interaction = <><div className="cp-choice-row"><span className="cp-moon-mark"><Moon size={22} />La imaginación se convirtió en una misión</span></div><blockquote className="cp-reveal">Llegar hasta allí fue el resultado de generaciones que unieron sus conocimientos.</blockquote></>
  } else if (currentSlide === 3) {
    interaction = <><div className="cp-discipline-grid" aria-label="Ciencias que hacen posible una misión">{DISCIPLINES.map((field, index) => <button key={field.name} className={`cp-choice ${discipline === index ? 'is-selected' : ''}`} aria-pressed={discipline === index} onClick={() => setDiscipline(index)}><field.icon size={18} /><span>{field.name}</span></button>)}</div><p className="cp-discipline-detail"><strong>{DISCIPLINES[discipline].name}</strong> {DISCIPLINES[discipline].detail}</p></>
  } else if (currentSlide === 4) {
    interaction = <><div className="cp-question-toggle"><button className={`cp-choice ${!question ? 'is-selected' : ''}`} aria-pressed={!question} onClick={() => setQuestion(false)}><Eye size={17} />Observar la Luna</button><button className={`cp-choice ${question ? 'is-selected' : ''}`} aria-pressed={question} onClick={() => setQuestion(true)}><Compass size={17} />Experimentar con ella</button></div><blockquote className="cp-reveal">{question ? 'Comprenderla, explorarla y resolver los desafíos que implica trabajar en ella.' : '¿Por qué no acercar a los niños, desde sus primeros años, a ese universo que despierta su imaginación?'}</blockquote></>
  } else if (currentSlide === 5) {
    const experiences = [
      { name: 'Explorar', icon: Truck, text: 'Conducir un rover y descubrir el relieve de la superficie lunar.' },
      { name: 'Descubrir', icon: Sparkles, text: 'Manejar un brazo robótico y recoger muestras de rocas lunares.' },
      { name: 'Comprender', icon: Zap, text: 'Experimentar con la energía que conecta los equipos de la base.' },
    ]
    interaction = <div className="cp-project-demo"><div className="cp-demo-controls">{experiences.map((experience, index) => <button key={experience.name} className={`cp-choice ${project === index ? 'is-selected' : ''}`} aria-pressed={project === index} onClick={() => setProject(index)}><experience.icon size={18} />{experience.name}</button>)}</div><p className="cp-demo-detail">{experiences[project].text}</p><span className="cp-hint"><Radio size={13} />Una plataforma educativa tridimensional</span></div>
  } else {
    interaction = <div className="cp-final-cta"><button className="cp-button cp-button--primary" onClick={() => { dispatch({ type: 'pause' }); onOpenStation() }}><Rocket size={18} />Comenzar a explorar<ArrowRight size={18} /></button>{finished && <p className="cp-finished" role="status">Presentación finalizada · 03:00</p>}</div>
  }

  return <section className="cinematic-pitch" data-scene={section.visual} data-reduced-motion={reducedMotion} ref={rootRef} aria-label="Pitch de Simulador para Astronautas Junior, duración de tres minutos">
    <div className="cp-scene" aria-hidden="true"><Suspense fallback={<div className="cp-loading" />}><PitchSpace slide={currentSlide} transitionId={transition.id} direction={transition.direction} reducedMotion={reducedMotion} playing={playback.playing} interactive /></Suspense></div>
    <div className="cp-vignette" />
    <header className="cp-toolbar">
      <div className="cp-heading"><Orbit size={23} /><div><span>Pitch del proyecto</span><small>Simulador para Astronautas Junior</small></div></div>
      <div className="cp-clock" role="timer" aria-label={`Tiempo restante: ${clock(PITCH_DURATION - playback.elapsed)}`}><time>{clock(PITCH_DURATION - playback.elapsed)}</time><small>de 03:00</small></div>
      <div className="cp-toolbar-actions">
        <button className={`cp-button cp-button--primary ${playback.playing ? 'is-active' : ''}`} onClick={() => dispatch({ type: 'toggle' })} title={playback.playing ? 'Pausar presentación' : finished ? 'Repetir los tres minutos' : 'Reproducir presentación de tres minutos'} aria-label={playback.playing ? 'Pausar presentación' : finished ? 'Repetir los tres minutos' : playback.elapsed > 0 ? 'Continuar presentación' : 'Presentar en tres minutos'}>{playback.playing ? <Pause size={16} /> : <Play size={16} />}<span>{playback.playing ? 'Pausar' : finished ? 'Repetir 3 min' : playback.elapsed > 0 ? 'Continuar' : 'Presentar 3 min'}</span></button>
        <button className="cp-button cp-icon-button" onClick={() => dispatch({ type: 'restart' })} title="Reiniciar ensayo" aria-label="Reiniciar ensayo"><RotateCcw size={17} /></button>
        <button className={`cp-button ${notesOpen ? 'is-active' : ''}`} onClick={() => setNotesOpen(open => !open)} aria-expanded={notesOpen} aria-controls="pitch-narration" title="Ver guion del presentador" aria-label="Ver guion del presentador"><BookOpen size={17} /><span>Guion</span></button>
        <button className={`cp-button cp-icon-button ${reducedMotion ? 'is-active' : ''}`} onClick={() => setReducedMotion(value => !value)} aria-pressed={reducedMotion} title={reducedMotion ? 'Activar animaciones de naves' : 'Reducir movimiento'} aria-label={reducedMotion ? 'Activar animaciones de naves' : 'Reducir movimiento'}><WandSparkles size={17} /></button>
        <button className="cp-button cp-icon-button" onClick={toggleFullscreen} title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
      </div>
    </header>
    <progress className="cp-total-progress" max={PITCH_DURATION} value={playback.elapsed} aria-label="Progreso de la presentación de tres minutos" />
    <main className="cp-stage">
      <article className="cp-slide" data-slide={currentSlide} key={section.id}>
        <div className="cp-eyebrow"><span>{String(currentSlide + 1).padStart(2, '0')} / 07</span>{section.eyebrow}</div>
        <h1 className="cp-title">{beforeEmphasis}<span className="cp-emphasis">{section.emphasis}</span>{afterEmphasis}</h1>
        <p className="cp-subtitle">{section.subtitle}</p>
        <div className="cp-interaction">{interaction}</div>
      </article>
      <aside className="cp-visual-label" aria-label="Escena de la diapositiva"><small>{VISUAL_LABELS[currentSlide][0]}</small><strong>{VISUAL_LABELS[currentSlide][1]}</strong><span>{VISUAL_LABELS[currentSlide][2]}</span></aside>
      <div className="cp-shortcuts"><span>{playback.playing ? 'Presentación en curso' : finished ? 'Fin del recorrido' : 'Modo ensayo'}</span><span>← → Cambiar escena · Espacio Reproducir · F Pantalla completa</span></div>
    </main>
    <footer className="cp-footer">
      <button className="cp-nav" onClick={() => goToSlide(currentSlide - 1)} disabled={currentSlide === 0} aria-label="Diapositiva anterior"><ChevronLeft size={19} /><span>Anterior</span></button>
      <nav className="cp-chapters" aria-label="Diapositivas del pitch">{PITCH_SECTIONS.map((part, index) => <button key={part.id} className={`cp-chapter ${currentSlide === index ? 'is-current' : ''} ${currentSlide > index ? 'is-complete' : ''}`} aria-current={currentSlide === index ? 'step' : undefined} onClick={() => goToSlide(index)} title={`${part.label}, ${clock(getPitchSlideStart(index))} a ${clock(getPitchSlideStart(index) + PITCH_DURATIONS[index])}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{part.label}</strong><span className="cp-chapter-line" style={{ width: `${index < currentSlide ? 100 : index === currentSlide ? slideProgress * 100 : 0}%` }} /></button>)}</nav>
      <div className="cp-slide-time"><time>{clock(Math.max(0, duration - (playback.elapsed - start)))}</time><small>en esta escena</small></div>
      <button className="cp-nav" onClick={() => goToSlide(currentSlide + 1)} disabled={currentSlide === PITCH_SECTIONS.length - 1} aria-label="Siguiente diapositiva"><span>Siguiente</span><ChevronRight size={19} /></button>
    </footer>
    {notesOpen && <aside id="pitch-narration" className="cp-notes" aria-labelledby="pitch-notes-heading">
      <header className="cp-notes-header"><div><span>Guion del presentador</span><h2 id="pitch-notes-heading" ref={notesHeadingRef} tabIndex={-1}>{section.label}</h2></div><button className="cp-button cp-icon-button" onClick={() => { setNotesOpen(false); rootRef.current?.querySelector<HTMLButtonElement>('[aria-controls="pitch-narration"]')?.focus() }} aria-label="Cerrar guion"><X size={19} /></button></header>
      <div className="cp-notes-meta"><GraduationCap size={16} /><span>{clock(start)} a {clock(start + duration)} · {duration} segundos</span></div>
      <div className="cp-notes-body" key={section.id}>{section.narration.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <button className="cp-button cp-download" onClick={downloadScript}><Download size={16} />Descargar guion completo</button>
    </aside>}
  </section>
}
