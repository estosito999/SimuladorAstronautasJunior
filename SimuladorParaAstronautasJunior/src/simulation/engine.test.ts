import { describe, expect, it } from 'vitest';
import { createInitialState, ENERGY_TIME_SCALE, metrics, reduce, ROVER_CAPACITY_WH, STATION_CAPACITY_WH, step } from './engine';
import type { State } from './types';

const sunny = (): State => ({ ...createInitialState(), sunlight: 100, panelAngle: 45, dust: 0, battery: 50 });

describe('energía solar y mantenimiento', () => {
  it('integra W a Wh con la aceleración documentada', () => {
    const s = sunny();
    expect(metrics(s).production).toBe(240);
    const expectedGain = (200 * ENERGY_TIME_SCALE / 3600 / STATION_CAPACITY_WH) * 100;
    expect(step(s, 1).battery).toBeCloseTo(50 + expectedGain, 7);
  });

  it('relaciona polvo, limpieza, consumo y generación sin mutar el estado', () => {
    const initial = createInitialState();
    const dusty = { ...initial, dust: 70 };
    const cleaning = reduce(dusty, { type: 'clean' });
    expect(metrics(cleaning).demand).toBeGreaterThan(metrics(dusty).demand);
    const next = step(cleaning, 10);
    expect(next.dust).toBe(0);
    expect(next.cleaning).toBe(false);
    expect(next.completed).toContain('solar');
    expect(metrics(next).production).toBeGreaterThan(metrics(dusty).production);
    expect(dusty.dust).toBe(70);
    expect(initial.completed).toEqual([]);
  });

  it('detiene limpieza sin alimentación y permite recuperar una estación vacía', () => {
    const empty = { ...createInitialState(), solarOn: false, battery: 0, cleaning: true };
    const stopped = step(empty, 1);
    expect(stopped.cleaning).toBe(false);
    expect(stopped.dust).toBe(empty.dust);
    expect(metrics(stopped).powered).toBe(false);
    const recovered = step({ ...stopped, solarOn: true, dust: 0, sunlight: 100, panelAngle: 45 }, 2);
    expect(recovered.battery).toBeGreaterThan(0);
    expect(metrics(recovered).powered).toBe(true);
  });
});

describe('rover conectado a la estación', () => {
  it('permite conducir, regresar y recargar usando energía de la estación', () => {
    const start = sunny();
    let s = step(reduce(start, { type: 'rover-drive', forward: 1, turn: 0 }), 3);
    expect(s.roverPosition[1]).toBeCloseTo(9.8);
    expect(s.roverBattery).toBeLessThan(start.roverBattery);
    s = step(reduce(s, { type: 'rover-return' }), 4);
    expect(s.roverPosition).toEqual([0, 5]);
    expect(s.completed).not.toContain('rover');
    const charging = reduce(s, { type: 'rover-charge' });
    expect(charging.roverMode).toBe('charging');
    expect(charging.completed).toContain('rover');
    expect(metrics(charging).demand).toBeGreaterThan(metrics(s).demand);
    expect(step(charging, 1).roverBattery).toBeGreaterThan(s.roverBattery);
  });

  it('rechaza carga fuera de la base o sin energía', () => {
    const away = { ...createInitialState(), roverPosition: [5, 8] as [number, number] };
    expect(reduce(away, { type: 'rover-charge' }).roverMode).toBe('parked');
    const empty = { ...createInitialState(), solarOn: false, battery: 0 };
    expect(reduce(empty, { type: 'rover-charge' }).roverMode).toBe('parked');
  });

  it('respeta la zona y reserva energía para el regreso automático', () => {
    let s = step(reduce(createInitialState(), { type: 'rover-drive', forward: 1, turn: 0 }), 20);
    expect(s.roverPosition[1]).toBeLessThanOrEqual(13);
    expect(s.roverMode).toBe('parked');
    s = { ...s, roverMode: 'driving', roverBattery: 11 };
    s = step(s, 1);
    expect(s.roverMode).toBe('returning');
    expect(s.roverDrive).toEqual({ forward: 0, turn: 0 });
    expect(step(s, 10).roverPosition).toEqual([0, 5]);
  });

  it('recupera un rover con batería vacía mediante reserva didáctica', () => {
    const empty: State = { ...createInitialState(), roverBattery: 0, roverPosition: [2, 7] };
    const recovered = step(reduce(empty, { type: 'rover-return' }), 10);
    expect(recovered.roverPosition).toEqual([0, 5]);
    expect(recovered.roverMode).toBe('parked');
    expect(step(reduce(recovered, { type: 'rover-charge' }), 1).roverBattery).toBeGreaterThan(0);
  });

  it('solo extrae de la estación la energía necesaria para terminar una recarga', () => {
    const start = { ...createInitialState(), solarOn: false, battery: 50, roverBattery: 99.99 };
    const next = step(reduce(start, { type: 'rover-charge' }), 0.1);
    const storedWh = (100 - start.roverBattery) / 100 * ROVER_CAPACITY_WH;
    const stationLoadWh = 40 * 0.1 * ENERGY_TIME_SCALE / 3600;
    const expectedStationDrop = (storedWh / 0.9 + stationLoadWh) / STATION_CAPACITY_WH * 100;
    expect(next.roverBattery).toBe(100);
    expect(next.roverMode).toBe('parked');
    expect(start.battery - next.battery).toBeCloseTo(expectedStationDrop, 8);
  });

  it('ignora conducción repetida durante retorno y en un borde sin inundar avisos', () => {
    let s: State = { ...createInitialState(), roverBattery: 11, roverPosition: [0, 10] };
    for (let i = 0; i < 12; i++) s = step(reduce(s, { type: 'rover-drive', forward: 1, turn: 0 }), 0.1);
    expect(s.roverMode).toBe('returning');
    expect(s.roverPosition[1]).toBeLessThan(10);
    expect(s.events).toHaveLength(2);
    s = { ...createInitialState(), roverPosition: [0, 13] };
    const battery = s.roverBattery;
    for (let i = 0; i < 12; i++) s = step(reduce(s, { type: 'rover-drive', forward: 1, turn: 0 }), 0.1);
    expect(s.roverPosition).toEqual([0, 13]);
    expect(s.roverBattery).toBe(battery);
    expect(s.events).toHaveLength(2);
  });
});

describe('comunicaciones y telemetría', () => {
  it('exige orientación, antena encendida y alimentación para enviar datos locales', () => {
    let s = createInitialState();
    expect(reduce(s, { type: 'transmit' }).packets).toBe(0);
    s = reduce(s, { type: 'antenna-toggle' });
    s = reduce(s, { type: 'antenna-angle', value: 45 });
    expect(metrics(s).signal).toBe(100);
    s = reduce(s, { type: 'transmit' });
    expect(s.packets).toBe(1);
    expect(s.completed).toContain('comms');
    expect(metrics({ ...s, battery: 0, solarOn: false }).signal).toBe(0);
  });

  it('mantiene históricos y eventos acotados, con datos finitos del motor', () => {
    let s = createInitialState();
    for (let i = 0; i < 120; i++) s = step(s, 1);
    expect(s.history).toHaveLength(90);
    expect(s.history.at(-1)?.time).toBe(120);
    for (const row of s.history) expect(Object.values(row).every(Number.isFinite)).toBe(true);
    for (let i = 0; i < 30; i++) s = reduce(s, { type: 'solar-toggle' });
    expect(s.events).toHaveLength(12);
    expect(new Set(s.events.map(event => event.id)).size).toBe(12);
  });
});

describe('controles del motor', () => {
  it('pausa sin movimiento residual y reinicia toda la actividad', () => {
    let s = reduce(createInitialState(), { type: 'rover-drive', forward: 1, turn: 1 });
    s = reduce(s, { type: 'pause' });
    expect(step(s, 10)).toBe(s);
    expect(s.roverDrive).toEqual({ forward: 0, turn: 0 });
    expect(s.roverMode).toBe('parked');
    expect(reduce(s, { type: 'reset' })).toEqual(createInitialState());
  });

  it('limita valores de entrada y rechaza pasos no finitos', () => {
    let s = createInitialState();
    s = reduce(s, { type: 'sunlight', value: 900 });
    s = reduce(s, { type: 'panel-angle', value: -50 });
    s = reduce(s, { type: 'antenna-angle', value: Number.NaN });
    expect(s.sunlight).toBe(100);
    expect(s.panelAngle).toBe(0);
    expect(s.antennaAngle).toBe(15);
    expect(step(s, Number.NaN)).toBe(s);
    expect(step(s, Number.POSITIVE_INFINITY)).toBe(s);
    expect(step(s, -1)).toBe(s);
  });
});

describe('recorrido educativo completo', () => {
  it('conecta limpieza, viaje, regreso, recarga e informe de comunicaciones', () => {
    let s = createInitialState();
    s = reduce(s, { type: 'panel-angle', value: 45 });
    s = step(reduce(s, { type: 'clean' }), 6);
    expect(s.completed).toEqual(['solar']);
    expect(s.dust).toBe(0);
    s = step(reduce(s, { type: 'rover-drive', forward: 1, turn: 0 }), 3);
    s = step(reduce(s, { type: 'rover-return' }), 4);
    expect(s.completed).toEqual(['solar']);
    const beforeCharge = s.roverBattery;
    s = step(reduce(s, { type: 'rover-charge' }), 1);
    expect(s.roverBattery).toBeGreaterThan(beforeCharge);
    expect(s.completed).toEqual(['solar', 'rover']);
    s = reduce(s, { type: 'antenna-toggle' });
    s = reduce(s, { type: 'antenna-angle', value: 45 });
    s = reduce(s, { type: 'transmit' });
    expect(s.completed).toEqual(['solar', 'rover', 'comms']);
    expect(s.packets).toBe(1);
    expect(s.history.length).toBeGreaterThan(10);
    expect(s.events.some(event => event.text.includes('centro de control local'))).toBe(true);
  });

  it('alimenta antena y recarga directamente del Sol con batería de estación vacía', () => {
    let s = { ...sunny(), battery: 0, antennaOn: true, antennaAngle: 45 };
    expect(metrics(s).powered).toBe(true);
    expect(metrics(s).signal).toBe(100);
    s = reduce(s, { type: 'rover-charge' });
    expect(s.roverMode).toBe('charging');
    const beforeCharge = s.roverBattery;
    s = step(s, 1);
    expect(s.battery).toBeGreaterThan(0);
    expect(s.roverBattery).toBeGreaterThan(beforeCharge);
    expect(reduce(s, { type: 'transmit' }).packets).toBe(1);
  });
});
