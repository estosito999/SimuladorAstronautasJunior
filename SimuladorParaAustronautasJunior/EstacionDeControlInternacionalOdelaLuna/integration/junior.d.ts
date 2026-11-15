export type JuniorChannelId =
  | 'solar.production' | 'station.demand' | 'station.battery' | 'rover.battery'
  | 'comms.signal' | 'solar.dust' | 'rover.distance' | 'station.observations'
  | 'comms.packets' | 'station.balance';

export interface JuniorSnapshot {
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
}

export interface PublishedSnapshot extends JuniorSnapshot {
  utc: number;
  roverDistance: number;
  observations: number;
  packets: number;
  balance: number;
}

export interface TelemetryDatum {
  time: number;
  utc: number;
  value: number;
  [source: string]: number;
}

export interface ValueMetadata {
  key: string;
  source: string;
  name?: string;
  unit?: string;
  format?: string;
  min?: number;
  max?: number;
  hints: Record<string, number>;
}

export class TelemetryMetadataManager {
  constructor(metadata: { values: Partial<ValueMetadata>[] });
  metadata: { values: ValueMetadata[] };
  value(key: string): ValueMetadata | undefined;
  values(): ValueMetadata[];
  valuesForHints(hints: string[]): ValueMetadata[];
  getDefaultDisplayValue(): ValueMetadata;
}

export interface JuniorChannel {
  id: JuniorChannelId;
  source: string;
  name: string;
  unit: string;
  min?: number;
  max?: number;
}

export interface JuniorDomainObject {
  identifier: { namespace: string; key: JuniorChannelId };
  type: string;
  name: string;
  telemetry: { values: ValueMetadata[] };
}

export interface JuniorTelemetry {
  publish(snapshot: JuniorSnapshot): PublishedSnapshot;
  request(id: JuniorChannelId, start?: number, end?: number, domain?: 'time' | 'utc'): TelemetryDatum[];
  subscribe(id: JuniorChannelId, callback: (datum: TelemetryDatum) => void): () => void;
  reset(): void;
  getMetadata(id: JuniorChannelId): TelemetryMetadataManager;
  getDomainObjects(): JuniorDomainObject[];
  getSnapshot(): PublishedSnapshot | null;
  getHistory(): PublishedSnapshot[];
}

export interface JuniorRequestOptions {
  start?: number;
  end?: number;
  domain?: 'time' | 'utc';
  strategy?: string;
  size?: number;
  signal?: { aborted: boolean };
}

export interface JuniorTelemetryProvider {
  supportsRequest(object: JuniorDomainObject): boolean;
  supportsSubscribe(object: JuniorDomainObject): boolean;
  supportsMetadata(object: JuniorDomainObject): boolean;
  request(object: JuniorDomainObject, options?: JuniorRequestOptions): Promise<TelemetryDatum[]>;
  subscribe(object: JuniorDomainObject, callback: (datum: TelemetryDatum) => void): () => void;
  getMetadata(object: JuniorDomainObject): { values: ValueMetadata[] };
}

export interface JuniorOpenMctApi {
  types: { addType(key: string, definition: { name: string; cssClass: string }): void };
  objects: {
    addRoot(identifier: JuniorDomainObject['identifier']): void;
    addProvider(namespace: string, provider: { get(identifier: { key: string }): Promise<JuniorDomainObject | undefined> }): void;
  };
  telemetry: { addProvider(provider: JuniorTelemetryProvider): void };
}

export const JUNIOR_NAMESPACE: string;
export const JUNIOR_CHANNELS: readonly JuniorChannel[];
export function createJuniorTelemetry(options?: { capacity?: number; epoch?: number }): JuniorTelemetry;
export function createJuniorTelemetryProvider(source: JuniorTelemetry): JuniorTelemetryProvider;
export function createJuniorTelemetryPlugin(source: JuniorTelemetry): (openmct: JuniorOpenMctApi) => void;
