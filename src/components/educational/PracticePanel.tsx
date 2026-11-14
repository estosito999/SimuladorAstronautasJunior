import { ArrowRight, Check, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react'
import { practices } from '../../education/practices'
import { useSimulatorStore } from '../../store/useSimulatorStore'
import type { ModuleId } from '../../types'

export function PracticeCards({ onStart }: { onStart: (id: ModuleId) => void }) {
  const completed = useSimulatorStore(s => s.completedPractices)
  const ids: ModuleId[] = ['solar', 'rover', 'antenna']
  return <div className="practice-grid">{ids.map(id => { const p = practices[id]; const done = completed.includes(id); return <button key={id} className={`practice-card ${done ? 'completed' : ''}`} onClick={() => onStart(id)}><div className="practice-card-top"><span className={`practice-number ${id}`}>{done ? <Check size={18} /> : `0${p.number}`}</span><span>{done ? 'COMPLETADA' : `${p.duration} · GUIADA`}</span><ArrowRight size={18} className="practice-arrow" /></div><h3>{p.title}</h3><p>{p.objective}</p><div className="practice-card-bottom"><span>{done ? 'Volver a experimentar' : 'Comenzar práctica'}</span><ArrowRight size={15} /></div></button> })}</div>
}

export default function PracticePanel({ module }: { module: ModuleId }) {
  const s = useSimulatorStore()
  const p = practices[module]
  const active = s.activePractice === module
  const completed = s.completedPractices.includes(module)
  return <div className="practice-detail"><div className="callout-icon"><Sparkles size={20} /></div><span className="eyebrow">PRÁCTICA 0{p.number}</span><h3>{p.title}</h3><p>{p.introduction}</p><ol className="practice-steps">{p.steps.map((step, i) => <li key={step}><span>{i + 1}</span>{step}</li>)}</ol>{active && module === 'solar' && <div className="practice-timer"><span>Estación equilibrada</span><progress aria-label="Segundos de equilibrio energético" max={4} value={s.energyStableSeconds} /><small>{Math.min(4, s.energyStableSeconds).toFixed(1)} / 4 s</small></div>}{completed && !active && <div className="success-note"><CheckCircle2 size={19} /> Ya descubriste cómo funciona. ¡Puedes repetir!</div>}<button className="primary-button full-width" onClick={() => active ? s.resetPractice() : s.startPractice(module)}>{active ? <><RotateCcw size={17} /> Reiniciar práctica</> : <>{completed ? 'Repetir práctica' : 'Comenzar práctica'}<ArrowRight size={17} /></>}</button></div>
}
