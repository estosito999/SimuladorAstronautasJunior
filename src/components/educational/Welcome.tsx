import { ArrowRight, MousePointer2, Orbit, Sparkles } from 'lucide-react'
import Modal from '../ui/Modal'
import { LunaAvatar } from '../ui/Controls'
import { useSimulatorStore } from '../../store/useSimulatorStore'

export default function Welcome() {
  const welcome = useSimulatorStore(s => s.welcome)
  return <Modal title="Bienvenido a la Academia de Astronautas Junior" className="welcome-modal"><div className="welcome-art"><div className="orbit-ring r1" /><div className="orbit-ring r2" /><span className="little-star star-one">✦</span><span className="little-star star-two">✧</span><LunaAvatar large /><span className="welcome-tag"><span className="status-dot" /> TU INSTRUCTORA · LUNA</span></div><div className="welcome-copy"><span className="eyebrow">TU AVENTURA DE APRENDIZAJE EMPIEZA AQUÍ</span><h1>La Luna tiene mucho<br />que enseñarte<span>.</span></h1><p>¡Hola, astronauta junior! Soy LUNA. Juntos exploraremos nuestra base, pondremos equipos en marcha y descubriremos cómo funcionan.</p><div className="welcome-features"><span><Orbit size={18} /> Explora en 3D</span><span><MousePointer2 size={18} /> Experimenta</span><span><Sparkles size={18} /> Aprende a tu ritmo</span></div><button autoFocus className="primary-button welcome-start" onClick={welcome}>Entrar a la estación <ArrowRight size={19} /></button><small>Sin cuentas. Sin puntuaciones. Con mucha curiosidad.</small></div></Modal>
}
