import { useEffect, useRef, useState, type Dispatch } from 'react'
import { Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BatteryCharging, Check, ChevronRight, CircleHelp, Compass, Gem, Globe, Hand, Home, Layers, Navigation, PackageCheck, Radio, RotateCcw, Send, Share2, Sparkles, Sun, Truck, Zap } from 'lucide-react'
import type { Action, ModuleId, State } from '../simulation/types'
import { DOCK, metrics } from '../simulation/engine'
import { ARM_LIMITS, getNearestRock, getRockPickupStatus, LUNAR_ROCKS, ROVER_BOUNDS } from '../simulation/roverExploration'

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
    question: '¿Qué podemos descubrir en las rocas lunares?',
    intro: 'Explora más lejos, acerca el rover a una roca marcada y usa el brazo para recogerla. Guarda la muestra y vuelve a la base para recargar.',
    experiment: 'Explora el terreno, recoge una roca con el brazo y guarda la muestra antes de regresar.',
    discovery: 'Las muestras lunares nos ayudan a estudiar la superficie. Conserva energía para volver a la base.'
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
  control: {
    name: 'Estación de Control de Vuelo: Enlace de Telemetría (DSN)',
    number: '04',
    icon: Activity,
    tag: 'CONTROL DE VUELO Y RED DSN',
    color: 'cyan',
    question: '¿Cómo supervisa la estación de control las operaciones y la telemetría?',
    intro: 'La Estación de Control de Vuelo centraliza la telemetría DSN de la base Selene y coordina misiones en tiempo real con las estaciones en Tierra y la Estación Espacial Internacional.',
    experiment: 'Sincroniza los enlaces de telemetría DSN (Madrid, Goldstone y Canberra) y monitorea los 10 canales críticos.',
    discovery: 'Una estación de control dedicada y enlaces DSN redundantes aseguran la comunicación continua en el espacio profundo.'
  },
  iss: {
    name: 'Estación Espacial Internacional (ISS)',
    number: '05',
    icon: Globe,
    tag: 'NODO ORBITAL Y GESTIÓN DE MISIONES EN TIERRA',
    color: 'blue',
    question: '¿Qué papel cumple la ISS en la gestión de misiones espaciales y terrestres?',
    intro: 'La ISS actúa como puesto de avanzada y centro de relevo orbital a 420 km de altitud, coordinando telemetría entre centros espaciales en Tierra (Houston, ESOC, Tsukuba) y la Base Selene.',
    experiment: 'Activa el enlace orbital TDRS/DSN y coordina las ventanas de comunicación con las misiones en tierra.',
    discovery: 'La cooperación entre bases lunares, la ISS y estaciones terrestres permite una gestión integrada y segura del vuelo espacial.'
  }
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

function Slider({ label, value, min = 0, max = 100, onChange, unit = '%' }: { label: string; value: number; min?: number; max?: number; onChange: (n: number) => void; unit?: string }) {
  return (
    <label className="slider">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <strong className="slider-val">{Math.round(value)}{unit}</strong>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} />
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
      <fieldset className="module-controls" disabled={s.paused && selected !== 'rover'} aria-label="Controles del equipo">
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
          <RoverControls state={s} dispatch={dispatch} />
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
        {selected === 'control' && (
          <FlightControlPanel state={s} dispatch={dispatch} />
        )}
        {selected === 'iss' && (
          <ISSControlPanel state={s} dispatch={dispatch} />
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

function FlightControlPanel({ state: s, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const e = metrics(s);
  const activeStation = s.activeGroundStation || 'madrid';
  const stations = [
    { id: 'madrid', name: 'Madrid DSN (España)', code: 'DSS 63/65', delay: '1.28 s', freq: '8.4 GHz Banda X', status: 'Enlace Primario' },
    { id: 'goldstone', name: 'Goldstone DSN (EE. UU.)', code: 'DSS 14/24', delay: '1.28 s', freq: '32 GHz Banda Ka', status: 'Enlace Activo' },
    { id: 'canberra', name: 'Canberra DSN (Australia)', code: 'DSS 43/34', delay: '1.29 s', freq: '8.4 GHz Banda X', status: 'Reserva Caliente' },
  ] as const;

  const channels = [
    { num: '01', name: 'Fotovoltaico', value: `${e.production.toFixed(0)} W`, ok: e.production > 0 },
    { num: '02', name: 'Banco Baterías', value: `${s.battery.toFixed(0)} %`, ok: s.battery > 15 },
    { num: '03', name: 'Escudo EDS', value: s.cleaning ? 'Activo' : 'Standby', ok: true },
    { num: '04', name: 'Propulsión Rover', value: `${s.roverBattery.toFixed(0)} %`, ok: s.roverBattery > 12 },
    { num: '05', name: 'Muestras Regolito', value: `${s.collectedRocks.length}/5`, ok: true },
    { num: '06', name: 'Antena Parabólica', value: s.antennaOn ? `${s.antennaAngle}°` : 'Off', ok: s.antennaOn },
    { num: '07', name: 'Enlace RF DSN', value: `${e.signal.toFixed(0)} %`, ok: e.signal >= 20 },
    { num: '08', name: 'Presurización Base', value: '101.3 kPa', ok: true },
    { num: '09', name: 'Enlace Orbital ISS', value: s.issTelemetryActive ? 'Sincronizado' : 'En espera', ok: s.issTelemetryActive ?? true },
    { num: '10', name: 'Registro Open MCT', value: `${s.events.length} logs`, ok: true },
  ];

  return (
    <div className="flight-control-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#38bdf8' }}>
            <Activity size={16} /> Red de Espacio Profundo (DSN)
          </strong>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>3 Estaciones Terrestres</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {stations.map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => dispatch({ type: 'dsn-station', station: st.id })}
              style={{
                padding: '8px 6px',
                borderRadius: '6px',
                border: activeStation === st.id ? '1px solid #38bdf8' : '1px solid #334155',
                background: activeStation === st.id ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                color: activeStation === st.id ? '#38bdf8' : '#cbd5e1',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                fontSize: '11px'
              }}
            >
              <span style={{ fontWeight: 600 }}>{st.name}</span>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>{st.code} · {st.delay}</span>
              <span style={{ color: activeStation === st.id ? '#4ade80' : '#64748b', fontSize: '9px' }}>{st.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#e2e8f0' }}>
            <Layers size={16} /> 10 Canales Críticos de Selene (Open MCT)
          </strong>
          <span style={{ color: '#4ade80', fontSize: '11px' }}>● 10/10 Nominales</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
          {channels.map(ch => (
            <div key={ch.num} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#1e293b', borderRadius: '4px' }}>
              <span style={{ color: '#94a3b8' }}>{ch.num}. {ch.name}</span>
              <strong style={{ color: ch.ok ? '#38bdf8' : '#f87171' }}>{ch.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="primary full"
          disabled={s.paused}
          onClick={() => dispatch({ type: 'dsn-sync' })}
          style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Send size={15} /> Sincronizar Paquete DSN con {activeStation.toUpperCase()}
        </button>
        <button
          type="button"
          className="sim-btn-sub"
          onClick={() => dispatch({ type: 'iss-toggle-link' })}
          title="Alternar enlace de telemetría con la ISS"
          style={{ padding: '0 14px', borderRadius: '6px', border: '1px solid #334155', background: s.issTelemetryActive ? '#065f46' : '#1e293b', color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Globe size={15} /> {s.issTelemetryActive ? 'Enlace ISS Activo' : 'Enlace ISS Pausa'}
        </button>
      </div>
    </div>
  );
}

function ISSControlPanel({ state: s, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const groundCenters = [
    { id: 'houston', name: 'Houston MCC (NASA JSC)', role: 'Control de Vuelo y Trayectoria Orbital', loc: 'Texas, EE. UU.' },
    { id: 'esoc', name: 'Col-CC / ESOC (ESA)', role: 'Módulo Científico Columbus y Microgravedad', loc: 'Darmstadt / Múnich, Europa' },
    { id: 'tsukuba', name: 'Tsukuba SSIPC (JAXA)', role: 'Módulo Experimental Kibo y Logística', loc: 'Ibaraki, Japón' },
    { id: 'ksc', name: 'Cabo Cañaveral (NASA KSC)', role: 'Lanzamiento de Naves y Relevo Comercial', loc: 'Florida, EE. UU.' },
  ];

  return (
    <div className="iss-control-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#38bdf8' }}>
            <Globe size={16} /> Parámetros Orbitales de la Estación (ISS)
          </strong>
          <span style={{ color: '#4ade80', fontSize: '11px' }}>● Órbita LEO Nominal</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
          <div style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Altitud Media:</span> <strong style={{ color: '#f1f5f9' }}>420.5 km</strong>
          </div>
          <div style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Velocidad Orbital:</span> <strong style={{ color: '#f1f5f9' }}>27.600 km/h (7.66 km/s)</strong>
          </div>
          <div style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Inclinación:</span> <strong style={{ color: '#f1f5f9' }}>51.64°</strong>
          </div>
          <div style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Período Orbital:</span> <strong style={{ color: '#f1f5f9' }}>92.68 min (15.5 órbitas/día)</strong>
          </div>
          <div style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Generación Solar (SAW):</span> <strong style={{ color: '#facc15' }}>120 kW (8 alas activas)</strong>
          </div>
          <div style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Soporte Vital (ECLSS):</span> <strong style={{ color: '#38bdf8' }}>101.3 kPa · 21% O₂</strong>
          </div>
        </div>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#e2e8f0' }}>
            <Compass size={16} /> Gestión de Misiones en Tierra (Centros Espaciales)
          </strong>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Coordinación Global</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {groundCenters.map(center => (
            <div
              key={center.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: '#1e293b',
                borderRadius: '6px',
                fontSize: '11px'
              }}
            >
              <div>
                <strong style={{ color: '#f1f5f9', display: 'block' }}>{center.name}</strong>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>{center.role} · {center.loc}</span>
              </div>
              <button
                type="button"
                className="sim-btn-sub"
                onClick={() => dispatch({ type: 'iss-coordinate', center: center.name })}
                style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', background: '#334155', color: '#38bdf8', border: '1px solid #475569' }}
              >
                Coordinar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="primary full"
          disabled={s.paused}
          onClick={() => dispatch({ type: 'iss-coordinate', center: 'Houston MCC y ESOC' })}
          style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Share2 size={15} /> Coordinar Telemetría Orbital ISS con Misiones en Tierra
        </button>
      </div>
    </div>
  );
}

function RoverControls({ state: s, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [tab, setTab] = useState<'drive' | 'arm' | 'samples'>('drive')
  const distanceHome = Math.hypot(s.roverPosition[0] - DOCK[0], s.roverPosition[1] - DOCK[1])
  const nearest = getNearestRock(s)
  const pickup = getRockPickupStatus(s)
  const heldRock = LUNAR_ROCKS.find(rock => rock.id === s.heldRockId)
  const collected = LUNAR_ROCKS.filter(rock => s.collectedRocks.includes(rock.id))
  const armLocked = s.paused || s.roverMode !== 'parked' || s.roverBattery <= 12
  const canStow = !s.paused && s.roverMode === 'parked' && s.roverBattery > 0.3 && !!heldRock
  const armLockReason = s.roverMode !== 'parked'
    ? 'Detén el rover y termina la recarga o el regreso para mover el brazo.'
    : s.roverBattery <= 12 ? 'Recarga la batería del rover para usar el brazo.' : ''
  const armMessage = s.paused ? 'Continúa la simulación para usar el brazo.'
    : heldRock ? s.roverMode !== 'parked' ? 'Detén el rover para guardar la muestra en el depósito.'
      : canStow ? 'Guarda la muestra en el depósito antes de seguir explorando o recargar.'
      : 'Regresa a la base y recarga para guardar la muestra. La roca seguirá en la pinza.'
    : armLockReason || pickup.message
  const direction = nearest.rock
    ? Math.abs(nearest.bearing) < 8 ? 'delante del rover' : `${Math.abs(nearest.bearing).toFixed(0)}° a la ${nearest.bearing > 0 ? 'derecha' : 'izquierda'}`
    : ''

  return <>
    <div className="rover-status">
      <span className={`status-dot ${s.roverMode === 'parked' ? 'quiet' : ''}`} />
      {({ parked: distanceHome < 0.18 ? 'Estacionado en plataforma' : 'Detenido en la superficie', driving: 'En desplazamiento por superficie', returning: 'Retorno automático a base', charging: 'Ciclo de recarga activo' })[s.roverMode]}
    </div>
    <Meter label="Nivel de batería del vehículo" value={s.roverBattery} />
    <nav className="rover-control-tabs" aria-label="Controles de exploración">
      <button type="button" className={tab === 'drive' ? 'active' : ''} aria-pressed={tab === 'drive'} onClick={() => setTab('drive')}><Truck size={15} />Conducir</button>
      <button type="button" className={tab === 'arm' ? 'active' : ''} aria-pressed={tab === 'arm'} onClick={() => setTab('arm')}><Hand size={15} />Brazo</button>
      <button type="button" className={tab === 'samples' ? 'active' : ''} aria-pressed={tab === 'samples'} onClick={() => setTab('samples')}><Gem size={15} />Muestras <span>{collected.length}</span></button>
    </nav>

    {tab === 'drive' ? <>
      <div className="rover-exploration-stats">
        <div><span>Recorrido</span><strong>{s.roverDistance.toFixed(1)} <small>m</small></strong></div>
        <div><span>Hasta la base</span><strong>{distanceHome.toFixed(1)} <small>m</small></strong></div>
        <p>Zona de exploración: {ROVER_BOUNDS.maxX - ROVER_BOUNDS.minX} × {ROVER_BOUNDS.maxZ - ROVER_BOUNDS.minZ} m</p>
      </div>
      <RoverDrive dispatch={dispatch} disabled={s.paused || s.roverMode === 'returning' || s.roverMode === 'charging'} />
      <p className="control-hint center">Mantén pulsadas las flechas o conduce con WASD al seleccionar la escena.</p>
      {nearest.rock && <div className="rover-target-card">
        <Navigation size={17} />
        <div><strong>{nearest.rock.name}</strong><p>A {nearest.distance.toFixed(1)} m · {direction}</p></div>
      </div>}
      <button type="button" className="secondary full" onClick={() => { dispatch({ type: 'rover-stop' }); setTab('arm') }}><Hand size={16} />Detener y manejar el brazo</button>
      <div className="button-pair">
        <button type="button" className="secondary" disabled={s.paused || s.roverMode === 'returning' || s.roverMode === 'charging'} onClick={() => dispatch({ type: 'rover-return' })}><Home size={16} />Retorno a base</button>
        <button type="button" className="primary" disabled={s.paused || s.roverMode === 'returning' || s.roverMode === 'driving' || (s.roverMode !== 'charging' && distanceHome >= 0.18)} onClick={() => dispatch({ type: 'rover-charge' })}><BatteryCharging size={16} />{s.roverMode === 'charging' ? 'Finalizar carga' : 'Iniciar recarga'}</button>
      </div>
      <p className="control-hint">El rover reserva energía para regresar. La recarga requiere conectarlo a la plataforma.</p>
    </> : tab === 'arm' ? <>
      <ol className="rover-sampling-steps">
        <li>Acércate a una roca marcada y detén el rover.</li>
        <li>Gira y baja el brazo hasta que la roca esté al alcance.</li>
        <li>Recoge la roca y guarda la muestra.</li>
      </ol>
      <div className={`rover-target-card ${pickup.canCollect ? 'ready' : ''}`}>
        <Gem size={19} />
        <div>
          <strong>{heldRock ? `${heldRock.name} en la pinza` : pickup.rock?.name || 'Busca una roca marcada'}</strong>
          {pickup.rock && !heldRock && Number.isFinite(pickup.distance) && <p>Distancia a la pinza: {pickup.distance.toFixed(2)} m</p>}
          <p>{armMessage}</p>
        </div>
      </div>
      <fieldset className="rover-arm-controls" disabled={armLocked} aria-label="Articulaciones y pinza del brazo">
        {([{ joint: 'yaw', label: 'Giro de la base del brazo' }, { joint: 'shoulder', label: 'Elevación del hombro' }, { joint: 'elbow', label: 'Ángulo del codo' }] as const).map(({ joint, label }) => <Slider key={joint} label={label} value={s.roverArm[joint]} min={ARM_LIMITS[joint].min} max={ARM_LIMITS[joint].max} unit="°" onChange={value => dispatch({ type: 'rover-arm', joint, value })} />)}
        <div className="button-pair rover-arm-buttons">
          <button type="button" className="secondary" disabled={!!heldRock} onClick={() => dispatch({ type: 'rover-gripper' })}><Hand size={15} />{s.roverArm.gripperOpen ? 'Cerrar pinza' : 'Abrir pinza'}</button>
          <button type="button" className="primary" disabled={!pickup.canCollect} onClick={() => dispatch({ type: 'rover-collect' })}><Gem size={15} />Recoger roca</button>
        </div>
      </fieldset>
      <div className="button-pair rover-arm-buttons">
        <button type="button" className="secondary" disabled={armLocked} onClick={() => dispatch({ type: 'rover-arm-reset' })}><RotateCcw size={15} />Replegar brazo</button>
        <button type="button" className="primary" disabled={!canStow} onClick={() => dispatch({ type: 'rover-stow' })}><PackageCheck size={15} />Guardar muestra</button>
      </div>
      {heldRock && <p className="control-hint">{canStow ? 'La roca sigue en la pinza. Pulsa «Guardar muestra» para añadirla al depósito.' : 'La muestra seguirá sujeta mientras detienes el rover o recuperas la energía necesaria para guardarla.'}</p>}
    </> : <>
      <div className="rover-sample-summary"><Gem size={25} /><div><strong>{collected.length} / {LUNAR_ROCKS.length}</strong><span>Muestras guardadas en el rover</span></div></div>
      {heldRock && <div className="rover-target-card ready"><Hand size={18} /><div><strong>{heldRock.name}</strong><p>En la pinza · todavía no está guardada.</p><button type="button" className="text-button" onClick={() => setTab('arm')}>Volver al brazo para guardarla</button></div></div>}
      {collected.length ? <ul className="rover-sample-list">{collected.map(rock => <li key={rock.id}><span className="rover-rock-swatch" style={{ background: rock.color }} /><div><strong>{rock.name}</strong><span>{rock.kind}</span></div><Check size={16} /></li>)}</ul> : <p className="rover-sample-empty">Tu depósito está listo. Busca una roca marcada, acércala a la pinza y recoge tu primera muestra lunar.</p>}
      <button type="button" className="secondary full" onClick={() => setTab('arm')}><Hand size={16} />Manejar el brazo</button>
    </>}
  </>
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
