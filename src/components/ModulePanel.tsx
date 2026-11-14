import { useEffect, useRef, type Dispatch } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BatteryCharging, Check, ChevronRight, CircleHelp, Home, Radio, Send, Sparkles, Sun, Truck, Zap } from 'lucide-react'
import type { Action, ModuleId, State } from '../simulation/types'
import { metrics } from '../simulation/engine'

export const modules = {
  solar: {
    name: 'Subsistema Fotovoltaico',
    number: '01',
    icon: Sun,
    tag: 'GENERACIÓN DE ENERGÍA Y BATERÍAS',
    color: 'amber',
    question: '¿Cómo afecta la acumulación de regolito a la generación?',
    intro: 'Las matrices solares convierten la radiación solar en electricidad y recargan el banco de baterías de la base.',
    experiment: 'Añade polvo, observa la caída de potencia y activa el sistema de limpieza.',
    discovery: 'Matrices limpias aumentan la captación solar y aseguran energía para todos los subsistemas.'
  },
  rover: {
    name: 'Vehículo de Exploración Superficial',
    number: '02',
    icon: Truck,
    tag: 'MOVILIDAD Y MUESTREO DE TERRENO',
    color: 'mint',
    question: '¿Cómo se administra la autonomía energética del vehículo?',
    intro: 'El vehículo opera con batería interna para tracción y sensores. Al volver a la estación, se recarga en la plataforma.',
    experiment: 'Conduce por la zona de operaciones, regresa a la base e inicia el ciclo de recarga.',
    discovery: 'La exploración de superficie consume energía que debe reponerse en la base.'
  },
  comms: {
    name: 'Subsistema de Telecomunicaciones',
    number: '03',
    icon: Radio,
    tag: 'ENLACE CON EL CONTROL DE MISIÓN',
    color: 'violet',
    question: '¿Cómo se optimiza la transmisión de datos hacia la Tierra?',
    intro: 'La antena parabólica orienta la señal de radiofrecuencia hacia las estaciones terrestres de la Red de Espacio Profundo.',
    experiment: 'Enciende la antena, ajusta el ángulo de elevación a 45° y transmite las observaciones guardadas.',
    discovery: 'Una alineación angular precisa y potencia adecuada garantizan el enlace de datos.'
  },
} as const

export function Meter({ label, value, color = 'mint' }: { label: string; value: number; color?: string }) {
  return (
    <div className="meter">
      <div className="meter-header">
        <span className="meter-label">{label}</span>
        <strong className="meter-val">{Math.round(value)}<small> %</small></strong>
      </div>
      <div className="meter-track" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <span className={color} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}

function Slider({ label, value, max = 100, onChange, unit = '%' }: { label: string; value: number; max?: number; onChange: (n: number) => void; unit?: string }) {
  return (
    <label className="slider">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <strong className="slider-val">{Math.round(value)}{unit}</strong>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={event => onChange(Number(event.target.value))} />
    </label>
  )
}

function Switch({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button className="switch-row" type="button" role="switch" aria-checked={checked} onClick={onClick}>
      <span><Zap size={16} /> {label}</span>
      <span className={`toggle ${checked ? 'on' : ''}`}><span /></span>
    </button>
  )
}

export default function ModulePanel({ selected, state: s, dispatch }: { selected: ModuleId; state: State; dispatch: Dispatch<Action> }) {
  const m = modules[selected], Icon = m.icon, e = metrics(s)
  return (
    <section className="module-panel" aria-labelledby="module-heading">
      <div className="panel-eyebrow">PANEL DE CONTROL DE SUBSISTEMA <span>{m.number} / 03</span></div>
      <div className="module-title">
        <span className={`module-icon ${m.color}`}><Icon size={25} /></span>
        <div>
          <h2 id="module-heading">{m.name}</h2>
          <span>Monitoreo y comandos operativos</span>
        </div>
      </div>
      <div className="learn-note">
        <CircleHelp size={17} />
        <div>
          <h3>{m.question}</h3>
          <p>{m.intro}</p>
        </div>
      </div>
      <fieldset className="module-controls" disabled={s.paused} aria-label="Controles del equipo">
        {selected === 'solar' && (
          <>
            <Switch label="Matrices solares activas" checked={s.solarOn} onClick={() => dispatch({ type: 'solar-toggle' })} />
            <div className="big-reading">
              <span className="big-reading-label">Generación fotovoltaica</span>
              <strong className="big-reading-val">{e.production.toFixed(0)}<small> W</small></strong>
              <span className="reading-caption"><Sun size={14} /> Potencia entregada a la red</span>
            </div>
            <Slider label="Radiación solar incidente" value={s.sunlight} onChange={value => dispatch({ type: 'sunlight', value })} />
            <Slider label="Ángulo de elevación de paneles" value={s.panelAngle} max={90} unit="°" onChange={value => dispatch({ type: 'panel-angle', value })} />
            <p className="control-hint">Elevación óptima recomendada: 45°.</p>
            <div className="maintenance">
              <div className="maintenance-heading">
                <Sparkles size={17} />
                <strong>Mantenimiento de superficie</strong>
                <span>Sistema EDS</span>
              </div>
              <Meter label="Acumulación de regolito en celdas" value={s.dust} color="amber" />
              <div className="button-pair">
                <button className="secondary" disabled={s.cleaning} onClick={() => dispatch({ type: 'add-dust' })}>Polvo simulado</button>
                <button className="primary" disabled={s.cleaning || s.dust <= 0 || !e.powered || s.paused} onClick={() => dispatch({ type: 'clean' })}>
                  <Sparkles size={15} /> {s.cleaning ? 'Limpiando…' : 'Activar limpieza EDS'}
                </button>
              </div>
              <p>El ciclo electrodinámico consume energía de la red durante la operación.</p>
            </div>
          </>
        )}
        {selected === 'rover' && (
          <>
            <div className="rover-status">
              <span className={`status-dot ${s.roverMode === 'parked' ? 'quiet' : ''}`} />
              {({ parked: 'Estacionado en plataforma', driving: 'En desplazamiento por superficie', returning: 'Retorno automático a base', charging: 'Ciclo de recarga activo' })[s.roverMode]}
            </div>
            <Meter label="Nivel de batería del vehículo" value={s.roverBattery} />
            <div className="rover-stats">
              <div>
                <span>Distancia recorrida</span>
                <strong>{s.roverDistance.toFixed(1)} <small>m</small></strong>
              </div>
              <Truck size={27} />
            </div>
            <RoverDrive dispatch={dispatch} disabled={s.paused || s.roverMode === 'returning' || s.roverMode === 'charging'} />
            <p className="control-hint center">Usa las flechas en pantalla o WASD para maniobrar.<br />Vuelve a la base para recargar.</p>
            <div className="button-pair">
              <button className="secondary" disabled={s.paused} onClick={() => dispatch({ type: 'rover-return' })}>
                <Home size={16} /> Retorno a base
              </button>
              <button className="primary" disabled={s.paused} onClick={() => dispatch({ type: 'rover-charge' })}>
                <BatteryCharging size={16} /> {s.roverMode === 'charging' ? 'Finalizar carga' : 'Iniciar recarga'}
              </button>
            </div>
            <p className="control-hint">La recarga requiere que el vehículo esté conectado a la plataforma.</p>
          </>
        )}
        {selected === 'comms' && (
          <>
            <Switch label="Transmisor de alta ganancia" checked={s.antennaOn} onClick={() => dispatch({ type: 'antenna-toggle' })} />
            <div className="signal-visual" aria-hidden="true">
              {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ height: 14 + n * 8 }} className={e.signal >= n * 19 ? 'lit' : ''} />)}
            </div>
            <Meter label="Calidad de enlace DSN" value={e.signal} color="violet" />
            <Slider label="Orientación azimutal de antena" value={s.antennaAngle} max={90} unit="°" onChange={value => dispatch({ type: 'antenna-angle', value })} />
            <p className="control-hint">Alineación óptima de enlace terrestre: 45°.</p>
            <div className="transmission">
              <Radio size={22} />
              <div className="transmission-info">
                <span className="transmission-label">Paquetes transmitidos</span>
                <strong className="transmission-val">{s.packets} <small>paquetes DSN</small></strong>
              </div>
            </div>
            <button className="primary full" disabled={s.paused || e.signal < 65} onClick={() => dispatch({ type: 'transmit' })}>
              <Send size={16} /> Transmitir telemetría y observaciones <ChevronRight size={16} />
            </button>
            <p className="control-hint">Requiere mínimo 65% de calidad de enlace para transmisión nominal.</p>
          </>
        )}
      </fieldset>
      <div className={`discovery ${s.completed.includes(selected) ? 'discovered' : ''}`}>
        <span>{s.completed.includes(selected) ? <Check size={18} /> : <Sparkles size={18} />}</span>
        <div>
          <strong>{s.completed.includes(selected) ? '¡Objetivo de misión completado!' : 'Protocolo operativo'}</strong>
          <p>{s.completed.includes(selected) ? m.discovery : m.experiment}</p>
        </div>
      </div>
    </section>
  )
}

function RoverDrive({ dispatch, disabled }: { dispatch: Dispatch<Action>; disabled: boolean }) {
  const pressed = useRef<Record<string, number>>({})
  useEffect(() => {
    const release = () => { pressed.current = {}; dispatch({ type: 'rover-stop' }) }
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', release)
    return () => { window.removeEventListener('blur', release); document.removeEventListener('visibilitychange', release); release() }
  }, [dispatch])
  useEffect(() => { if (disabled) pressed.current = {} }, [disabled])
  const drive = (key: string, value: number) => {
    pressed.current[key] = value
    dispatch({ type: 'rover-drive', forward: (pressed.current.up || 0) - (pressed.current.down || 0), turn: (pressed.current.left || 0) - (pressed.current.right || 0) })
  }
  return <div className="drive-pad" aria-label="Controles del rover">{[{ key: 'up', icon: ArrowUp, label: 'Avanzar' }, { key: 'left', icon: ArrowLeft, label: 'Girar a la izquierda' }, { key: 'down', icon: ArrowDown, label: 'Retroceder' }, { key: 'right', icon: ArrowRight, label: 'Girar a la derecha' }].map(({ key, icon: Icon, label }) => <button key={key} className={`drive-${key}`} aria-label={label} disabled={disabled} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); drive(key, 1) }} onPointerUp={() => drive(key, 0)} onPointerCancel={() => drive(key, 0)} onLostPointerCapture={() => drive(key, 0)} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); drive(key, 1) } }} onKeyUp={() => drive(key, 0)} onBlur={() => drive(key, 0)}><Icon size={23} /></button>)}<span className="drive-center"><Truck size={22} /></span></div>
}
