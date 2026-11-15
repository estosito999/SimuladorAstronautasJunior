import type { Dispatch } from 'react';
import { Activity, ArrowRight, BatteryCharging, Cable, Database, Globe, Link2, Radio, Satellite, Sun, Truck } from 'lucide-react';
import type { Action, ConnectionId, State } from '../simulation/types';
import { metrics, roverDataConnected } from '../simulation/engine';

const links: { id: ConnectionId; name: string; explanation: string }[] = [
  { id: 'solarBus', name: 'Paneles → batería', explanation: 'Lleva la energía solar a la estación.' },
  { id: 'controlBus', name: 'Estación de Control DSN', explanation: 'Bus de datos de vuelo y telemetría de 10 canales.' },
  { id: 'roverDock', name: 'Base ↔ rover', explanation: 'Cable de recarga y datos en la plataforma.' },
  { id: 'antennaBus', name: 'Batería → antena', explanation: 'Alimenta el equipo de comunicaciones.' },
  { id: 'roverRadio', name: 'Rover → estación', explanation: 'Comparte observaciones por radio con la antena encendida.' },
  { id: 'issLink', name: 'Enlace Orbital ISS', explanation: 'Conexión de telemetría inter-estaciones en banda Ka.' },
];

export default function NetworkPanel({ state: s, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const m = metrics(s);
  const dataLinked = roverDataConnected(s);
  return (
    <section className="network-panel" aria-labelledby="network-heading">
      <div className="network-heading">
        <div>
          <Link2 size={21} />
          <h2 id="network-heading">Una estación, todos conectados</h2>
        </div>
        <span>ENERGÍA + INFORMACIÓN</span>
      </div>
      <p className="network-intro">Prueba a desconectar un enlace. ¿Qué equipos siguen funcionando?</p>
      
      <div className="network-diagram" aria-label="Recorrido de la energía y la información" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div className={`network-device ${s.connections.solarBus && s.solarOn ? 'online' : ''}`}>
          <Sun size={24} />
          <strong>Paneles solares</strong>
          <span>{m.production.toFixed(0)} W hacia la base</span>
        </div>
        <ArrowRight className={s.connections.solarBus ? 'network-arrow active' : 'network-arrow'} size={20} />
        <div className={`network-device ${m.powered ? 'online' : ''}`}>
          <BatteryCharging size={24} />
          <strong>Batería y base</strong>
          <span>{s.battery.toFixed(0)} % de reserva</span>
        </div>
        <ArrowRight className={m.powered && (s.connections.controlBus ?? true) ? 'network-arrow active' : 'network-arrow'} size={20} />
        <div className={`network-device ${m.powered && (s.connections.controlBus ?? true) ? 'online' : ''}`}>
          <Activity size={24} />
          <strong>Estación Control</strong>
          <span>10 canales DSN</span>
        </div>
        <ArrowRight className={m.powered && s.connections.antennaBus ? 'network-arrow active' : 'network-arrow'} size={20} />
        <div className={`network-device ${m.signal >= 20 ? 'online' : ''}`}>
          <Radio size={24} />
          <strong>Antena DSN</strong>
          <span>{m.signal.toFixed(0)} % señal</span>
        </div>
        <ArrowRight className={s.issTelemetryActive && (s.connections.issLink ?? true) ? 'network-arrow active data' : 'network-arrow'} size={20} />
        <div className={`network-device ${s.issTelemetryActive && (s.connections.issLink ?? true) ? 'online' : ''}`}>
          <Globe size={24} />
          <strong>Nodo Orbital ISS</strong>
          <span>420 km LEO</span>
        </div>
        <ArrowRight className={s.lastTransmission ? 'network-arrow active data' : 'network-arrow'} size={20} />
        <div className={`network-device ${s.lastTransmission ? 'online' : ''}`}>
          <Satellite size={24} />
          <strong>Centros en Tierra</strong>
          <span>{s.packets} informes DSN</span>
        </div>
      </div>

      {!dataLinked && (
        <p className="network-intro">Sin enlace, la estación conserva la última lectura del rover. Los datos nuevos esperan a bordo.</p>
      )}

      <div className="network-rover-route">
        <Truck size={20} />
        <strong>Rover</strong>
        <span className="network-rover-battery">{s.roverBattery.toFixed(0)} % batería</span>
        <span className={`connection-state ${dataLinked ? 'online' : ''}`}>
          {dataLinked ? 'Datos conectados a la estación' : 'Observaciones guardadas a bordo'}
        </span>
        <span className="network-rover-samples">
          <Database size={15} /> {s.pendingRoverSamples} a bordo · {s.observations} en la estación
        </span>
      </div>

      <fieldset className="network-links" disabled={s.paused} aria-label="Conectar y desconectar dispositivos">
        {links.map(link => (
          <button
            key={link.id}
            type="button"
            role="switch"
            aria-checked={s.connections[link.id]}
            aria-label={link.name}
            onClick={() => dispatch({ type: 'connection-toggle', id: link.id })}
          >
            <span className={`cable-icon ${s.connections[link.id] ? 'connected' : ''}`}><Cable size={19} /></span>
            <span><strong>{link.name}</strong><small>{link.explanation}</small></span>
            <span className={`toggle ${s.connections[link.id] ? 'on' : ''}`}><span /></span>
          </button>
        ))}
      </fieldset>

      {s.lastTransmission && (
        <div className="transmitted-payload">
          <Database size={16} />
          <p>
            <strong>Último informe:</strong> {s.lastTransmission.production.toFixed(0)} W solares, batería de la base {s.lastTransmission.stationBattery.toFixed(0)} %, rover {s.lastTransmission.roverBattery.toFixed(0)} %, polvo {s.lastTransmission.dust.toFixed(0)} % y {s.lastTransmission.observations} observaciones. Son los datos capturados al transmitir.
          </p>
        </div>
      )}
    </section>
  );
}
