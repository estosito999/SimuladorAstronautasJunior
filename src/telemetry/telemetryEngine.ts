/**
 * Motor de Telemetría Inspirado en NASA Open MCT
 * Proporciona un proveedor de datos para 10 canales operativos de la estación lunar,
 * buffer circular histórico para trazado en tiempo real, suscripciones reactivas y descarga en CSV.
 */

export interface TelemetryChannel {
  id: string;
  source: keyof TelemetrySnapshot;
  name: string;
  unit: string;
  min?: number;
  max?: number;
  alarmLow?: number;
  alarmHigh?: number;
}

export const JUNIOR_NAMESPACE = 'selene-junior';
export const TELEMETRY_TYPE = 'selene-junior.telemetry';

export const JUNIOR_CHANNELS: TelemetryChannel[] = [
  { id: 'solar.production', source: 'production', name: 'Producción solar', unit: 'W', max: 240, alarmLow: 20 },
  { id: 'station.demand', source: 'demand', name: 'Consumo de la estación', unit: 'W', max: 250, alarmHigh: 180 },
  { id: 'station.battery', source: 'battery', name: 'Batería de la estación', unit: '%', max: 100, alarmLow: 15 },
  { id: 'rover.battery', source: 'roverBattery', name: 'Batería del rover', unit: '%', max: 100, alarmLow: 20 },
  { id: 'comms.signal', source: 'signal', name: 'Señal de comunicaciones', unit: '%', max: 100, alarmLow: 40 },
  { id: 'solar.dust', source: 'dust', name: 'Polvo en los paneles', unit: '%', max: 100, alarmHigh: 60 },
  { id: 'rover.distance', source: 'roverDistance', name: 'Distancia recorrida', unit: 'm' },
  { id: 'station.observations', source: 'observations', name: 'Observaciones del rover', unit: 'observaciones' },
  { id: 'comms.packets', source: 'packets', name: 'Informes transmitidos', unit: 'informes' },
  { id: 'station.balance', source: 'balance', name: 'Balance energético', unit: 'W', min: -250, max: 240 }
];

export const TELEMETRY_CHANNELS = JUNIOR_CHANNELS;

export interface TelemetrySnapshot {
  time: number;
  utc: number;
  production: number;
  demand: number;
  battery: number;
  roverBattery: number;
  signal: number;
  dust: number;
  roverDistance: number;
  observations: number;
  packets: number;
  balance: number;
}

export type TelemetryListener = (snapshot: TelemetrySnapshot) => void;

function applyReasonableDefaults(valueMetadata: any, index: number) {
  const vm = { ...valueMetadata };
  vm.source = vm.source || vm.key;
  vm.hints = { ...(vm.hints || {}) };

  if (Object.prototype.hasOwnProperty.call(vm.hints, 'x')) {
    if (!Object.prototype.hasOwnProperty.call(vm.hints, 'domain')) {
      vm.hints.domain = vm.hints.x;
    }
    delete vm.hints.x;
  }

  if (Object.prototype.hasOwnProperty.call(vm.hints, 'y')) {
    if (!Object.prototype.hasOwnProperty.call(vm.hints, 'range')) {
      vm.hints.range = vm.hints.y;
    }
    delete vm.hints.y;
  }

  if (!Object.prototype.hasOwnProperty.call(vm.hints, 'priority')) {
    vm.hints.priority = index;
  }

  return vm;
}

export class TelemetryMetadataManager {
  public metadata: any;
  public valueMetadatas: any[];

  constructor(metadata: any) {
    this.metadata = metadata;
    this.valueMetadatas = metadata?.values
      ? metadata.values.map(applyReasonableDefaults)
      : [];
  }

  public value(key: string) {
    return this.valueMetadatas.find((m) => m.key === key);
  }

  public values() {
    return this.valuesForHints(['priority']);
  }

  public valuesForHints(hints: string[]) {
    return this.valueMetadatas
      .filter((m) => hints.every((hint) => Object.prototype.hasOwnProperty.call(m.hints, hint)))
      .sort((a, b) => {
        for (const hint of hints) {
          const leftWeight = a.hints[hint];
          const rightWeight = b.hints[hint];
          if (leftWeight < rightWeight) return -1;
          if (leftWeight > rightWeight) return 1;
        }
        return 0;
      });
  }

  public getDefaultDisplayValue() {
    let val = this.valuesForHints(['range'])[0];
    if (!val) {
      val = this.values().find((v) => !v.hints.domain);
    }
    if (!val) {
      val = this.values()[0];
    }
    return val;
  }
}

function createMetadataEntry(channel: TelemetryChannel): [string, TelemetryMetadataManager] {
  const range: any = {
    key: 'value',
    source: channel.source,
    name: channel.name,
    unit: channel.unit,
    format: 'float',
    hints: { range: 1 },
    min: channel.min ?? 0
  };
  if (channel.max !== undefined) {
    range.max = channel.max;
  }

  return [
    channel.id,
    new TelemetryMetadataManager({
      values: [
        { key: 'utc', source: 'utc', name: 'Tiempo local simulado', format: 'utc', hints: { domain: 1 } },
        { key: 'time', source: 'time', name: 'Tiempo de actividad', format: 'float', unit: 's', hints: { domain: 2 } },
        range
      ]
    })
  ];
}

export class TelemetryEngine {
  public capacity: number;
  public epoch: number;
  public history: TelemetrySnapshot[] = [];
  private generalListeners: Set<TelemetryListener> = new Set();
  private channelListeners: Map<string, Set<(datum: any) => void>> = new Map();
  private metadata: Map<string, TelemetryMetadataManager>;

  constructor(capacity = 90, epoch = Date.now()) {
    this.capacity = capacity;
    this.epoch = epoch;
    this.metadata = new Map(JUNIOR_CHANNELS.map(createMetadataEntry));
  }

  public publish(raw: {
    time: number;
    production: number;
    demand: number;
    battery: number;
    roverBattery: number;
    signal: number;
    dust: number;
    roverDistance?: number;
    observations?: number;
    packets?: number;
  }): TelemetrySnapshot {
    const balance = raw.production - raw.demand;
    const snapshot: TelemetrySnapshot = {
      time: raw.time,
      utc: this.epoch + raw.time * 1000,
      production: raw.production,
      demand: raw.demand,
      battery: raw.battery,
      roverBattery: raw.roverBattery,
      signal: raw.signal,
      dust: raw.dust,
      roverDistance: raw.roverDistance ?? 0,
      observations: raw.observations ?? 0,
      packets: raw.packets ?? 0,
      balance
    };

    const prev = this.history.at(-1);
    if (prev && snapshot.time < prev.time) {
      this.history = [];
    } else if (prev && snapshot.time === prev.time) {
      this.history.pop();
    }

    this.history.push(snapshot);
    if (this.history.length > this.capacity) {
      this.history = this.history.slice(-this.capacity);
    }

    this.generalListeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Error in general telemetry listener:', err);
      }
    });

    for (const [channelId, callbacks] of this.channelListeners) {
      const datum = this.makeDatum(channelId, snapshot);
      callbacks.forEach((cb) => {
        try {
          cb({ ...datum });
        } catch (err) {
          console.error(`Error in channel listener for ${channelId}:`, err);
        }
      });
    }

    return { ...snapshot };
  }

  public makeDatum(id: string, snapshot: TelemetrySnapshot) {
    const meta = this.getMetadata(id).getDefaultDisplayValue();
    const sourceKey = meta.source as keyof TelemetrySnapshot;
    const value = snapshot[sourceKey];
    return {
      time: snapshot.time,
      utc: snapshot.utc,
      value,
      [meta.source]: value
    };
  }

  public getMetadata(id: string): TelemetryMetadataManager {
    const meta = this.metadata.get(id);
    if (!meta) {
      throw new RangeError(`Unknown junior telemetry channel: ${id}`);
    }
    return meta;
  }

  public request(id: string, start = -Infinity, end = Infinity, domain: 'time' | 'utc' = 'time') {
    this.getMetadata(id);
    return this.history
      .filter((s) => s[domain] >= start && s[domain] <= end)
      .map((s) => this.makeDatum(id, s));
  }

  public getDomainObjects() {
    return JUNIOR_CHANNELS.map((channel) => ({
      identifier: { namespace: JUNIOR_NAMESPACE, key: channel.id },
      type: TELEMETRY_TYPE,
      name: channel.name,
      telemetry: structuredClone(this.getMetadata(channel.id).metadata)
    }));
  }

  public subscribe(
    channelOrListener: string | TelemetryListener,
    callback?: (datum: any) => void
  ): () => void {
    if (typeof channelOrListener === 'function') {
      const listener = channelOrListener;
      this.generalListeners.add(listener);
      return () => {
        this.generalListeners.delete(listener);
      };
    }

    const channelId = channelOrListener;
    this.getMetadata(channelId);
    if (!callback) return () => {};

    const callbacks = this.channelListeners.get(channelId) || new Set();
    callbacks.add(callback);
    this.channelListeners.set(channelId, callbacks);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.channelListeners.delete(channelId);
      }
    };
  }

  public getSnapshot(): TelemetrySnapshot | null {
    const last = this.history.at(-1);
    return last ? { ...last } : null;
  }

  public getHistory(): TelemetrySnapshot[] {
    return this.history.map((s) => ({ ...s }));
  }

  public reset(): void {
    this.history = [];
  }

  public exportCSV(): string {
    const headers = [
      'MET_Seconds',
      'UTC_Time',
      'Solar_Gen_W',
      'Load_Total_W',
      'Station_Battery_Pct',
      'Rover_Battery_Pct',
      'DSN_Signal_Pct',
      'Dust_Level_Pct',
      'Rover_Distance_m',
      'Geology_Samples',
      'Telemetry_Packets',
      'Net_Balance_W'
    ];

    const rows = this.history.map((s) => [
      s.time.toFixed(1),
      new Date(s.utc).toISOString(),
      s.production.toFixed(1),
      s.demand.toFixed(1),
      s.battery.toFixed(1),
      s.roverBattery.toFixed(1),
      s.signal.toFixed(0),
      s.dust.toFixed(1),
      s.roverDistance.toFixed(1),
      s.observations,
      s.packets,
      s.balance.toFixed(1)
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public downloadCSV(filename = 'selene_telemetria_vuelo.csv'): void {
    const csv = this.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function createJuniorTelemetry(options?: { capacity?: number; epoch?: number }): TelemetryEngine {
  return new TelemetryEngine(options?.capacity ?? 90, options?.epoch ?? Date.now());
}

export const defaultTelemetryEngine = new TelemetryEngine();
