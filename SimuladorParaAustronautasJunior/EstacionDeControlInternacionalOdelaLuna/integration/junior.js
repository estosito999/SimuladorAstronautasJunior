/*****************************************************************************
 * Junior integration changes, 2026-11-14. Assisted by Codex.
 * Licensed under the Apache License, Version 2.0.
 * See ../LICENSE.md and the notices in the reused Open MCT source files.
 *****************************************************************************/

import TelemetryMetadataManager from '../src/api/telemetry/TelemetryMetadataManager.js';

export { default as TelemetryMetadataManager } from '../src/api/telemetry/TelemetryMetadataManager.js';

export const JUNIOR_NAMESPACE = 'selene-junior';
const TELEMETRY_TYPE = 'selene-junior.telemetry';
const DEFAULT_CAPACITY = 90;

export const JUNIOR_CHANNELS = Object.freeze([
  { id: 'solar.production', source: 'production', name: 'Producción solar', unit: 'W', max: 240 },
  { id: 'station.demand', source: 'demand', name: 'Consumo de la estación', unit: 'W', max: 250 },
  { id: 'station.battery', source: 'battery', name: 'Batería de la estación', unit: '%', max: 100 },
  { id: 'rover.battery', source: 'roverBattery', name: 'Batería del rover', unit: '%', max: 100 },
  { id: 'comms.signal', source: 'signal', name: 'Señal de comunicaciones', unit: '%', max: 100 },
  { id: 'solar.dust', source: 'dust', name: 'Polvo en los paneles', unit: '%', max: 100 },
  { id: 'rover.distance', source: 'roverDistance', name: 'Distancia recorrida', unit: 'm' },
  { id: 'station.observations', source: 'observations', name: 'Observaciones del rover', unit: 'observaciones' },
  { id: 'comms.packets', source: 'packets', name: 'Informes transmitidos', unit: 'informes' },
  { id: 'station.balance', source: 'balance', name: 'Balance energético', unit: 'W', min: -250, max: 240 }
].map(Object.freeze));

const REQUIRED_FIELDS = ['time', 'production', 'demand', 'battery', 'roverBattery', 'signal', 'dust'];

/** Creates a local provider with the original Open MCT metadata implementation. */
export function createJuniorTelemetry(options = {}) {
  return new JuniorTelemetry(options);
}

/** A source shared by React panels and the full Open MCT provider/plugin. */
class JuniorTelemetry {
  constructor({ capacity = DEFAULT_CAPACITY, epoch = Date.now() } = {}) {
    if (!Number.isInteger(capacity) || capacity < 1 || !Number.isFinite(epoch)) {
      throw new TypeError('Telemetry needs a positive capacity and a finite epoch.');
    }

    this.capacity = capacity;
    this.epoch = epoch;
    this.history = [];
    this.listeners = new Map();
    this.metadata = new Map(JUNIOR_CHANNELS.map(createMetadataEntry));
  }

  /** Publishes one immutable sample. A repeated time replaces its sample. */
  publish(snapshot) {
    const next = normalizeSnapshot(snapshot, this.epoch);
    const previous = this.history.at(-1);

    if (previous !== undefined && next.time < previous.time) {
      this.history = [];
    } else if (previous !== undefined && next.time === previous.time) {
      this.history.pop();
    }

    this.history.push(next);
    this.history = this.history.slice(-this.capacity);
    this.notify(next);

    return { ...next };
  }

  notify(snapshot) {
    for (const [id, callbacks] of this.listeners) {
      const datum = this.makeDatum(id, snapshot);
      for (const callback of callbacks) {
        callback({ ...datum });
      }
    }
  }

  /** Time bounds are seconds of activity unless domain is explicitly utc. */
  request(id, start = -Infinity, end = Infinity, domain = 'time') {
    this.getMetadata(id);
    if (domain !== 'time' && domain !== 'utc') {
      throw new TypeError('Unknown telemetry time domain.');
    }

    return this.history
      .filter((snapshot) => snapshot[domain] >= start && snapshot[domain] <= end)
      .map((snapshot) => this.makeDatum(id, snapshot));
  }

  /** Every subscription owns its own release function, including equal callbacks. */
  subscribe(id, callback) {
    this.getMetadata(id);
    const callbacks = this.listeners.get(id) || new Set();
    const listener = (datum) => callback(datum);
    callbacks.add(listener);
    this.listeners.set(id, callbacks);

    return () => {
      callbacks.delete(listener);
      if (callbacks.size === 0) {
        this.listeners.delete(id);
      }
    };
  }

  /** Returns the same class used by Open MCT TelemetryAPI for metadata. */
  getMetadata(id) {
    const metadata = this.metadata.get(id);
    if (metadata === undefined) {
      throw new RangeError(`Unknown junior telemetry channel: ${id}`);
    }

    return metadata;
  }

  getDomainObjects() {
    return JUNIOR_CHANNELS.map((channel) => ({
      identifier: { namespace: JUNIOR_NAMESPACE, key: channel.id },
      type: TELEMETRY_TYPE,
      name: channel.name,
      telemetry: structuredClone(this.getMetadata(channel.id).metadata)
    }));
  }

  getSnapshot() {
    const snapshot = this.history.at(-1);
    return snapshot === undefined ? null : { ...snapshot };
  }

  getHistory() {
    return this.history.map((snapshot) => ({ ...snapshot }));
  }

  reset() {
    this.history = [];
  }

  makeDatum(id, snapshot) {
    const metadata = this.getMetadata(id).getDefaultDisplayValue();
    const value = snapshot[metadata.source];
    return { time: snapshot.time, utc: snapshot.utc, value, [metadata.source]: value };
  }
}

function createMetadataEntry(channel) {
  const range = { key: 'value', source: channel.source, name: channel.name,
    unit: channel.unit, format: 'float', hints: { range: 1 }, min: channel.min ?? 0 };
  if (channel.max !== undefined) {
    range.max = channel.max;
  }

  return [channel.id, new TelemetryMetadataManager({ values: [
    { key: 'utc', source: 'utc', name: 'Tiempo local simulado', format: 'utc', hints: { domain: 1 } },
    { key: 'time', source: 'time', name: 'Tiempo de actividad', format: 'float', unit: 's', hints: { domain: 2 } },
    range
  ] })];
}

function normalizeSnapshot(snapshot, epoch) {
  for (const field of REQUIRED_FIELDS) {
    if (!Number.isFinite(snapshot[field])) {
      throw new TypeError(`Telemetry field ${field} must be finite.`);
    }
  }

  const next = { ...snapshot, utc: epoch + snapshot.time * 1000,
    roverDistance: snapshot.roverDistance ?? 0, observations: snapshot.observations ?? 0,
    packets: snapshot.packets ?? 0, balance: snapshot.production - snapshot.demand };
  if (![next.roverDistance, next.observations, next.packets].every(Number.isFinite)) {
    throw new TypeError('Optional telemetry counters must be finite.');
  }

  return Object.freeze(next);
}

/** Returns a real Open MCT install function, sharing the live source with React. */
export function createJuniorTelemetryPlugin(source) {
  return function installJuniorTelemetry(openmct) {
    openmct.types.addType(TELEMETRY_TYPE, { name: 'Telemetría Selene', cssClass: 'icon-telemetry' });
    const objects = source.getDomainObjects();
    openmct.objects.addProvider(JUNIOR_NAMESPACE, {
      get(identifier) {
        const domainObject = objects.find((object) => object.identifier.key === identifier.key);
        return Promise.resolve(domainObject === undefined ? undefined : structuredClone(domainObject));
      }
    });
    objects.forEach((object) => openmct.objects.addRoot(object.identifier));
    openmct.telemetry.addProvider(createJuniorTelemetryProvider(source));
  };
}

/** Provider methods implement the historical/realtime contracts in API.md. */
export function createJuniorTelemetryProvider(source) {
  function supports(domainObject) {
    return domainObject.identifier?.namespace === JUNIOR_NAMESPACE
      && JUNIOR_CHANNELS.some((channel) => channel.id === domainObject.identifier.key);
  }

  return {
    supportsRequest: supports,
    supportsSubscribe: supports,
    supportsMetadata: supports,
    getMetadata(domainObject) {
      return structuredClone(source.getMetadata(domainObject.identifier.key).metadata);
    },
    request(domainObject, options = {}) {
      if (options.signal?.aborted) {
        return Promise.resolve([]);
      }

      const rows = source.request(domainObject.identifier.key, options.start, options.end, options.domain);
      return Promise.resolve(options.strategy === 'latest' ? rows.slice(-(options.size || 1)) : rows);
    },
    subscribe(domainObject, callback) {
      return source.subscribe(domainObject.identifier.key, callback);
    }
  };
}
