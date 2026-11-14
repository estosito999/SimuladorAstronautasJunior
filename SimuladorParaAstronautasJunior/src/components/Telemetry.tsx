import { Activity, ArrowDownToLine, Battery, Radio, Zap } from 'lucide-react'
import type { State } from '../simulation/types'
import { metrics } from '../simulation/engine'
import { useState } from 'react'
import type { TelemetryEngine, TelemetrySnapshot } from '../telemetry/telemetryEngine'

export default function Telemetry({
  state: s,
  history,
  source
}: {
  state: State
  history: TelemetrySnapshot[]
  source: TelemetryEngine
}) {
  const e = metrics(s)
  const [tab, setTab] = useState<'chart' | 'events'>('chart')

  const exportCSV = () => {
    source.downloadCSV('selene_telemetria.csv')
  }

  const points = (key: 'production' | 'demand') =>
    history.map((h, i) => `${12 + (i / Math.max(1, history.length - 1)) * 576},${95 - (Math.min(250, h[key]) / 250) * 80}`).join(' ')

  return (
    <section className="telemetry" aria-labelledby="telemetry-heading">
      <div className="section-heading">
        <div>
          <Activity size={19} />
          <h2 id="telemetry-heading">El pulso de nuestra base</h2>
          <span className="soft-badge">Telemetría Open MCT</span>
        </div>
        <button className="text-button" disabled={!history.length} onClick={exportCSV}>
          <ArrowDownToLine size={15} />
          Descargar datos (CSV)
        </button>
      </div>

      <div className="telemetry-content">
        <div className="metric-grid">
          <div className="metric-tile">
            <span><Zap size={15} />Producción solar</span>
            <strong>{e.production.toFixed(0)}<small> W</small></strong>
            <p>La energía que llega</p>
          </div>
          <div className="metric-tile">
            <span><Activity size={15} />Consumo total</span>
            <strong>{e.demand.toFixed(0)}<small> W</small></strong>
            <p>Lo que usan los equipos</p>
          </div>
          <div className="metric-tile">
            <span><Battery size={15} />Batería de la base</span>
            <strong>{s.battery.toFixed(0)}<small> %</small></strong>
            <p>{e.balance > 0.1 ? 'Guardando energía' : e.balance < -0.1 ? 'Entregando energía' : 'En equilibrio'}</p>
          </div>
          <div className="metric-tile">
            <span><Radio size={15} />Señal a la Tierra</span>
            <strong>{e.signal.toFixed(0)}<small> %</small></strong>
            <p>{e.signal >= 65 ? 'Lista para transmitir' : 'Comprueba la antena'}</p>
          </div>
        </div>

        <div className="history-panel">
          <div className="history-tabs" role="tablist" aria-label="Vista de telemetría">
            <button role="tab" id="tab-chart" aria-selected={tab === 'chart'} aria-controls="telemetry-chart" onClick={() => setTab('chart')}>
              Energía en el tiempo
            </button>
            <button role="tab" id="tab-events" aria-selected={tab === 'events'} aria-controls="telemetry-events" onClick={() => setTab('events')}>
              Registro de operaciones
            </button>
          </div>

          {tab === 'chart' ? (
            <div role="tabpanel" id="telemetry-chart" aria-labelledby="tab-chart">
              <div className="chart-legend">
                <span><i style={{ background: '#38bdf8' }} />Producción</span>
                <span><i style={{ background: '#fbbf24' }} />Consumo</span>
                <small>Últimas {history.length} muestras · escala 0–250 W</small>
              </div>
              <svg className="chart" viewBox="0 0 600 112" role="img" aria-label={`Histórico de producción y consumo. Ahora: ${e.production.toFixed(0)} W producidos y ${e.demand.toFixed(0)} W consumidos.`}>
                {[15, 55, 95].map(y => <line key={y} x1={12} x2={588} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 5" />)}
                <polyline points={points('production')} fill="none" stroke="#38bdf8" strokeWidth="2.4" strokeLinejoin="round" />
                <polyline points={points('demand')} fill="none" stroke="#fbbf24" strokeWidth="2.4" strokeLinejoin="round" />
                <text x="12" y="109" fontSize="9" fill="#768580">Antes</text>
                <text x="566" y="109" fontSize="9" fill="#768580">Ahora</text>
              </svg>
            </div>
          ) : (
            <ol className="event-list" role="tabpanel" id="telemetry-events" aria-labelledby="tab-events">
              {s.events.length ? (
                [...s.events].reverse().map(event => (
                  <li key={event.id}>
                    <time>
                      {Math.floor(event.time / 60).toString().padStart(2, '0')}:
                      {Math.floor(event.time % 60).toString().padStart(2, '0')}
                    </time>
                    <span>{event.text}</span>
                  </li>
                ))
              ) : (
                <li>Los cambios de tus equipos aparecerán aquí.</li>
              )}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}
