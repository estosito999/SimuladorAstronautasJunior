import type { Action, ModuleId, Sample, State } from './types';
import { calculateStationPower, integrateBatteryPct } from './solarModel';
import { calculateDustEfficiency, advanceDust } from './dustModel';
import { advanceRover } from './roverModel';
import { ARM_LIMITS, DEFAULT_ROVER_ARM, getRockPickupStatus, LUNAR_ROCKS, ROVER_BOUNDS } from './roverExploration';

/** Teaching model: one activity second represents one minute of energy use.
 * Movement and the on-screen clock remain in activity seconds. This is a
 * deliberately accelerated model, not a mission engineering prediction.
 */
export const ENERGY_TIME_SCALE = 60;
export const STATION_CAPACITY_WH = 100;
export const ROVER_CAPACITY_WH = 60;
export const DOCK: [number, number] = [0, 5];
const STATION_LOAD_W = 40;
const ANTENNA_LOAD_W = 16;
const CLEANING_LOAD_W = 28;
const CHARGING_LOAD_W = 45;
const DRIVE_LOAD_W = 25;
const ROVER_SPEED = 1.6;

const clamp = (value: number, min: number, max: number, fallback = min) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));
const atDock = (s: State) => Math.hypot(s.roverPosition[0], s.roverPosition[1] - 5) < 0.18;
const energyPct = (watts: number, dt: number, capacity: number) =>
  (watts * dt * ENERGY_TIME_SCALE * 100) / (3600 * capacity);
const foldedArm = (s: State) => ({ ...DEFAULT_ROVER_ARM, gripperOpen: !s.heldRockId });

function solarPower(s: State) {
  return calculateStationPower({
    enabled: s.solarOn && s.connections.solarBus,
    sunlight: s.sunlight,
    panelAngle: s.panelAngle,
    dustEfficiency: calculateDustEfficiency(s.dust),
  });
}

function mayCharge(s: State, production = solarPower(s)) {
  const otherLoads = STATION_LOAD_W + (s.antennaOn && s.connections.antennaBus ? ANTENNA_LOAD_W : 0) + (s.cleaning ? CLEANING_LOAD_W : 0);
  return s.connections.roverDock && atDock(s) && s.roverBattery < 100 && (s.battery > 8 || production >= otherLoads + CHARGING_LOAD_W);
}

export function metrics(s: State) {
  const production = solarPower(s);
  const requested = STATION_LOAD_W + (s.antennaOn && s.connections.antennaBus ? ANTENNA_LOAD_W : 0)
    + (s.cleaning ? CLEANING_LOAD_W : 0)
    + (s.roverMode === 'charging' && mayCharge(s, production) ? CHARGING_LOAD_W : 0);
  // Preserve a small station reserve. Solar generation can restart the bus even
  // when its battery is empty; the standby circuit also allows gradual recovery.
  const powered = s.battery > 1 || production >= requested;
  const demand = powered ? requested : 4;
  const signal = s.antennaOn && s.connections.antennaBus && powered
    ? clamp(100 - Math.abs(clamp(s.antennaAngle, 0, 90) - 45) * 2, 0, 100)
    : 0;
  return { production, demand, balance: production - demand, powered, signal };
}

export function roverDataConnected(s: State) {
  const { powered, signal } = metrics(s);
  return powered && ((atDock(s) && s.connections.roverDock)
    || (s.connections.roverRadio && s.roverBattery > 0 && signal >= 20));
}

function record(s: State, text: string): State {
  const id = (s.events.at(-1)?.id ?? 0) + 1;
  return { ...s, events: [...s.events, { id, time: s.elapsed, text }].slice(-12) };
}

function recordOnce(s: State, text: string): State {
  return s.events.at(-1)?.text === text ? s : record(s, text);
}

function complete(s: State, module: ModuleId): State {
  return s.completed.includes(module) ? s : { ...s, completed: [...s.completed, module] };
}

function sample(s: State, time = s.elapsed): Sample {
  const { production, demand, signal } = metrics(s);
  return { time, production, demand, battery: s.battery, signal };
}

export function createInitialState(): State {
  const s: State = {
    elapsed: 0, paused: false, solarOn: true, sunlight: 85, panelAngle: 25,
    dust: 48, cleaning: false, battery: 62, roverBattery: 76,
    roverPosition: [...DOCK], roverHeading: 0, roverMode: 'parked',
    roverDrive: { forward: 0, turn: 0 }, roverDistance: 0,
    roverArm: { ...DEFAULT_ROVER_ARM }, heldRockId: null, collectedRocks: [],
    antennaOn: false, antennaAngle: 15, packets: 0, completed: [],
    connections: { solarBus: true, roverDock: true, antennaBus: true, roverRadio: true, controlBus: true, issLink: true },
    pendingRoverSamples: 0, observations: 0, lastTransmission: null,
    lastRoverTelemetry: { time: 0, battery: 76, distance: 0, position: [...DOCK] },
    activeGroundStation: 'madrid',
    issTelemetryActive: true,
    events: [{ id: 1, time: 0, text: 'LUNA: ¡Bienvenido! Vamos a cuidar juntos nuestra estación lunar.' }],
    history: [],
  };
  return { ...s, history: [sample(s)] };
}

function advance(original: State, dt: number): State {
  let s: State = { ...original, elapsed: original.elapsed + dt };
  const before = metrics(original);
  const charging = original.roverMode === 'charging' && mayCharge(original) && before.powered;
  // Stop drawing charging power at the exact instant the rover is full. The
  // remaining time in this substep supplies only the other station loads.
  const neededInputW = (100 - original.roverBattery) * ROVER_CAPACITY_WH * 36
    / (dt * ENERGY_TIME_SCALE * 0.9);
  const chargingInputW = charging ? clamp(neededInputW, 0, CHARGING_LOAD_W) : 0;
  const actualDemand = before.demand - (charging ? CHARGING_LOAD_W - chargingInputW : 0);
  s.battery = integrateBatteryPct({ battery: original.battery, production: before.production, demand: actualDemand,
    seconds: dt, capacityWh: STATION_CAPACITY_WH, timeScale: ENERGY_TIME_SCALE });

  if (s.cleaning) {
    if (!before.powered) {
      s = record({ ...s, cleaning: false }, 'LUNA: La limpieza espera energía. Enciende los paneles y busca la luz.');
    } else {
      s.dust = advanceDust({ coverage: s.dust, active: true, powered: before.powered }, dt).coverage;
      if (s.dust <= 0.000001) {
        s = record({ ...s, dust: 0, cleaning: false }, 'LUNA: ¡Paneles limpios! Ahora la luz llega a sus celdas solares.');
      }
    }
  }
  if (s.dust === 0 && metrics(s).production > 0) s = complete(s, 'solar');

  if (s.roverMode === 'driving') {
    const distanceHome = Math.hypot(s.roverPosition[0], s.roverPosition[1] - 5);
    const reserveNeeded = energyPct(DRIVE_LOAD_W, distanceHome / ROVER_SPEED, ROVER_CAPACITY_WH) + 6;
    if (s.roverBattery <= Math.max(12, reserveNeeded)) {
      s = record({ ...s, roverMode: 'returning', roverDrive: { forward: 0, turn: 0 }, roverArm: foldedArm(s) },
        'LUNA: Guardamos energía para el regreso. El rover vuelve a su base.');
    }
  }

  if (s.roverMode === 'driving') {
    const motion = advanceRover({ position: s.roverPosition, heading: s.roverHeading, forward: s.roverDrive.forward, turn: s.roverDrive.turn }, dt, { speed: ROVER_SPEED, turnSpeed: 1.15, bounds: ROVER_BOUNDS });
    const { position, heading, distance: moved } = motion;
    const watts = Math.abs(s.roverDrive.forward) * DRIVE_LOAD_W + Math.abs(s.roverDrive.turn) * 6;
    s = { ...s, roverPosition: position, roverHeading: heading,
      roverDistance: s.roverDistance + moved,
      roverBattery: clamp(s.roverBattery - energyPct(watts, dt, ROVER_CAPACITY_WH), 0, 100) };
    if (motion.blocked) {
      s = recordOnce({ ...s, roverMode: 'parked', roverDrive: { forward: 0, turn: 0 } },
        'LUNA: Llegamos al límite de exploración. Puedes girar o volver a la base.');
    }
  } else if (s.roverMode === 'returning') {
    const dx = DOCK[0] - s.roverPosition[0];
    const dz = DOCK[1] - s.roverPosition[1];
    const distance = Math.hypot(dx, dz);
    // An emergency teaching reserve permits recovery of an externally reset or
    // empty battery. Normal driving always returns before reaching this reserve.
    const movement = Math.min(distance, (s.roverBattery > 0 ? ROVER_SPEED : 0.75) * dt);
    if (distance > 0.001) {
      s = { ...s, roverPosition: [s.roverPosition[0] + dx / distance * movement,
        s.roverPosition[1] + dz / distance * movement], roverHeading: Math.atan2(dx, dz),
      roverDistance: s.roverDistance + movement,
      roverBattery: clamp(s.roverBattery - energyPct(DRIVE_LOAD_W, movement / ROVER_SPEED, ROVER_CAPACITY_WH), 0, 100) };
    }
    if (distance <= movement + 0.001) {
      s = record({ ...s, roverPosition: [...DOCK], roverMode: 'parked' },
        'LUNA: Rover en la base. Aquí podemos recargarlo con la energía de la estación.');
    }
  } else if (s.roverMode === 'charging') {
    if (!mayCharge(original) || !before.powered) {
      s = record({ ...s, roverMode: 'parked' },
        'LUNA: La recarga espera energía disponible en la base.');
    } else {
      s.roverBattery = clamp(s.roverBattery + energyPct(chargingInputW * 0.9, dt, ROVER_CAPACITY_WH), 0, 100);
      if (s.roverBattery >= 100) {
        s = record({ ...s, roverMode: 'parked' }, 'LUNA: La batería del rover está cargada y lista para explorar.');
      }
    }
  }

  // Rover observations travel over its radio, or over the dock data cable.
  // Breaking a connection keeps samples on the rover until it reconnects.
  const collected = Math.max(0, Math.floor(s.roverDistance / 2) - Math.floor(original.roverDistance / 2));
  s.pendingRoverSamples += collected;
  if (roverDataConnected(s)) {
    s.lastRoverTelemetry = { time: s.elapsed, battery: s.roverBattery, distance: s.roverDistance, position: [...s.roverPosition] };
    if (s.pendingRoverSamples > 0) {
      s = record({ ...s, observations: s.observations + s.pendingRoverSamples, pendingRoverSamples: 0 },
        `LUNA: La estación recibió ${s.pendingRoverSamples} observación(es) del rover.`);
    }
  }
  const movedThisStep = s.roverDistance - original.roverDistance;
  if (movedThisStep > 0 && !s.cleaning && Math.hypot(s.roverPosition[0] + 7, s.roverPosition[1] - 1.2) < 5) {
    s.dust = clamp(s.dust + movedThisStep * 0.7, 0, 100);
  }

  const previousSecond = Math.floor(original.elapsed + 0.000001);
  const nextSecond = Math.floor(s.elapsed + 0.000001);
  if (nextSecond > previousSecond) s.history = [...s.history, sample(s, nextSecond)].slice(-90);
  return s;
}

export function step(s: State, dt: number): State {
  if (s.paused || !Number.isFinite(dt) || dt <= 0) return s;
  // Bounded substeps keep controls and energy stable after a backgrounded tab.
  const duration = clamp(dt, 0, 30);
  const count = Math.ceil(duration / 0.1);
  let next = s;
  for (let i = 0; i < count; i++) next = advance(next, duration / count);
  return next;
}

export function reduce(s: State, action: Action): State {
  if (action.type === 'tick') return step(s, action.dt);
  if (action.type === 'reset') return createInitialState();
  if (action.type === 'pause') return { ...s, paused: !s.paused,
    roverMode: s.roverMode === 'driving' ? 'parked' : s.roverMode, roverDrive: { forward: 0, turn: 0 } };
  if (action.type === 'rover-stop') return { ...s,
    roverMode: s.roverMode === 'driving' ? 'parked' : s.roverMode, roverDrive: { forward: 0, turn: 0 } };
  if (s.paused) return s;

  const armAction = action.type === 'rover-arm' || action.type === 'rover-gripper' || action.type === 'rover-collect'
    || action.type === 'rover-stow' || action.type === 'rover-arm-reset';
  if (armAction && s.roverMode !== 'parked') return recordOnce(s, 'LUNA: Detén el rover para utilizar el brazo.');
  if (armAction && s.roverBattery <= (action.type === 'rover-stow' ? 0.3 : 12)) {
    return recordOnce(s, 'LUNA: Recarga el rover antes de utilizar el brazo.');
  }

  switch (action.type) {
    case 'solar-toggle': return record({ ...s, solarOn: !s.solarOn }, s.solarOn
      ? 'LUNA: Paneles desconectados. Ahora usamos la batería de la estación.'
      : 'LUNA: Paneles conectados. La luz puede convertirse en electricidad.');
    case 'sunlight': return { ...s, sunlight: clamp(action.value, 0, 100, s.sunlight) };
    case 'panel-angle': return { ...s, panelAngle: clamp(action.value, 0, 90, s.panelAngle) };
    case 'add-dust': return record({ ...s, dust: clamp(s.dust + 30, 0, 100) },
      'LUNA: Añadimos polvo para observar cómo cambia la energía solar.');
    case 'clean': {
      if (s.cleaning) return record({ ...s, cleaning: false }, 'LUNA: Limpieza en pausa. Puedes continuar cuando quieras.');
      if (s.dust === 0) return record(s, 'LUNA: Estos paneles ya están limpios.');
      if (!metrics({ ...s, cleaning: true }).powered) return record(s, 'LUNA: Primero necesitamos energía para limpiar. Conecta los paneles y aumenta la luz.');
      return record({ ...s, cleaning: true }, 'LUNA: Activamos el limpiador eléctrico. Usa energía y retira el polvo.');
    }
    case 'rover-drive': {
      const forward = clamp(action.forward, -1, 1, 0);
      const turn = clamp(action.turn, -1, 1, 0);
      if (forward === 0 && turn === 0) return { ...s, roverDrive: { forward, turn }, roverMode: s.roverMode === 'driving' ? 'parked' : s.roverMode };
      if (s.roverMode === 'returning') return s;
      if (s.roverBattery <= 12) return recordOnce({ ...s,
        roverMode: atDock(s) ? 'parked' : 'returning', roverDrive: { forward: 0, turn: 0 }, roverArm: foldedArm(s) },
        'LUNA: Conservemos la reserva del rover. Regresa a la base y recarga.');
      const dx = Math.sin(s.roverHeading) * forward;
      const dz = Math.cos(s.roverHeading) * forward;
      const outward = (s.roverPosition[0] >= ROVER_BOUNDS.maxX && dx > 0.0001)
        || (s.roverPosition[0] <= ROVER_BOUNDS.minX && dx < -0.0001)
        || (s.roverPosition[1] >= ROVER_BOUNDS.maxZ && dz > 0.0001)
        || (s.roverPosition[1] <= ROVER_BOUNDS.minZ && dz < -0.0001);
      if (outward && turn === 0) return recordOnce({ ...s, roverMode: 'parked', roverDrive: { forward: 0, turn: 0 } },
        'LUNA: Llegamos al límite de exploración. Puedes girar o volver a la base.');
      return { ...s, roverDrive: { forward, turn }, roverMode: 'driving', roverArm: foldedArm(s) };
    }
    case 'rover-return': return record({ ...s, roverMode: 'returning', roverDrive: { forward: 0, turn: 0 }, roverArm: foldedArm(s) },
      s.roverBattery === 0 ? 'LUNA: La reserva de emergencia permite volver despacio a la base.' : 'LUNA: Regreso automático a la base. Observa el camino del rover.');
    case 'rover-charge': {
      if (s.roverMode === 'charging') return { ...s, roverMode: 'parked' };
      if (!atDock(s)) return record(s, 'LUNA: El rover necesita estar en la base para recargarse. Pulsa Volver a la base.');
      if (!s.connections.roverDock) return record(s, 'LUNA: Conecta el cable de la plataforma para recargar el rover.');
      if (s.roverBattery >= 100) return record(s, 'LUNA: La batería del rover ya está llena.');
      if (!mayCharge(s) || !metrics({ ...s, roverMode: 'charging' }).powered) return record(s,
        'LUNA: Necesitamos energía disponible en la estación para recargar el rover.');
      let next: State = { ...s, roverMode: 'charging', roverPosition: [...DOCK], roverDrive: { forward: 0, turn: 0 }, roverArm: foldedArm(s) };
      if (s.roverDistance >= 5) next = complete(next, 'rover');
      return record(next, 'LUNA: La estación comparte su energía con el rover.');
    }
    case 'rover-arm': {
      const limits = ARM_LIMITS[action.joint];
      const value = clamp(action.value, limits.min, limits.max, s.roverArm[action.joint]);
      const difference = Math.abs(value - s.roverArm[action.joint]);
      if (difference === 0) return s;
      return { ...s, roverArm: { ...s.roverArm, [action.joint]: value },
        roverBattery: Math.max(12, s.roverBattery - difference * 0.003) };
    }
    case 'rover-gripper': {
      if (s.heldRockId) return recordOnce(s, 'LUNA: Guarda la muestra antes de abrir la pinza.');
      return { ...s, roverArm: { ...s.roverArm, gripperOpen: !s.roverArm.gripperOpen }, roverBattery: Math.max(12, s.roverBattery - 0.05) };
    }
    case 'rover-collect': {
      const status = getRockPickupStatus(s);
      if (!status.canCollect || !status.rock) return recordOnce(s, `LUNA: ${status.message}`);
      return record({ ...s, heldRockId: status.rock.id, roverArm: { ...s.roverArm, gripperOpen: false },
        roverBattery: Math.max(12, s.roverBattery - 0.6) }, `LUNA: ¡La pinza sujetó ${status.rock.name.toLowerCase()}! Guarda la muestra en el depósito.`);
    }
    case 'rover-stow': {
      if (!s.heldRockId) return recordOnce(s, 'LUNA: Primero recoge una roca con la pinza.');
      const rock = LUNAR_ROCKS.find(candidate => candidate.id === s.heldRockId);
      return record({ ...s, heldRockId: null,
        collectedRocks: s.collectedRocks.includes(s.heldRockId) ? s.collectedRocks : [...s.collectedRocks, s.heldRockId],
        roverArm: { ...DEFAULT_ROVER_ARM }, roverBattery: Math.max(0, s.roverBattery - 0.3) },
      `LUNA: Muestra guardada: ${rock?.kind ?? 'roca lunar'}. Llevamos ${s.collectedRocks.length + (s.collectedRocks.includes(s.heldRockId) ? 0 : 1)} roca(s) en el depósito.`);
    }
    case 'rover-arm-reset': return { ...s, roverArm: foldedArm(s), roverBattery: Math.max(12, s.roverBattery - 0.1) };
    case 'antenna-toggle': return record({ ...s, antennaOn: !s.antennaOn },
      s.antennaOn ? 'LUNA: Antena apagada. La estación consume menos energía.' : 'LUNA: Antena encendida. Oriéntala para enviar nuestros datos.');
    case 'antenna-angle': return { ...s, antennaAngle: clamp(action.value, 0, 90, s.antennaAngle) };
    case 'transmit': {
      if (metrics(s).signal < 65) return record(s, 'LUNA: Necesitamos al menos 65 % de señal. Enciende y orienta la antena; comprueba la energía.');
      const m = metrics(s);
      const next = complete({ ...s, packets: s.packets + 1, lastTransmission: {
        time: s.elapsed, production: m.production, demand: m.demand, stationBattery: s.battery,
        roverBattery: s.lastRoverTelemetry.battery, roverPosition: [...s.lastRoverTelemetry.position], dust: s.dust,
        signal: m.signal, observations: s.observations,
      } }, 'comms');
      return record(next, 'LUNA: ¡Informe enviado a nuestro centro de control local! Incluye energía, batería y señal.');
    }
    case 'dsn-station': {
      const stationNames = {
        madrid: 'Complejo DSN Madrid (Robledo de Chavela, España · DSS 63/65)',
        goldstone: 'Complejo DSN Goldstone (Desierto de Mojave, EE.UU. · DSS 14/24)',
        canberra: 'Complejo DSN Canberra (Tidbinbilla, Australia · DSS 43/34)'
      };
      return record(
        { ...s, activeGroundStation: action.station },
        `LUNA: Enlace DSN conmutado a ${stationNames[action.station]}. Sincronizando telemetría.`
      );
    }
    case 'dsn-sync': {
      const m = metrics(s);
      const next = complete({
        ...s,
        packets: s.packets + 5,
        lastTransmission: {
          time: s.elapsed,
          production: m.production,
          demand: m.demand,
          stationBattery: s.battery,
          roverBattery: s.lastRoverTelemetry.battery,
          roverPosition: [...s.lastRoverTelemetry.position],
          dust: s.dust,
          signal: Math.max(m.signal, 88),
          observations: s.observations,
        }
      }, 'control');
      return record(next, `LUNA: ¡Telemetría de vuelo transmitida con éxito al Complejo DSN ${s.activeGroundStation?.toUpperCase() || 'MADRID'} y Centro de Control!`);
    }
    case 'iss-toggle-link': {
      const active = !(s.issTelemetryActive ?? true);
      return record(
        { ...s, issTelemetryActive: active },
        `LUNA: Enlace inter-estaciones ISS ↔ Base Selene ${active ? 'conectado en banda Ka' : 'pausado por ventana orbital'}.`
      );
    }
    case 'iss-coordinate': {
      const next = complete(s, 'iss');
      return record(next, `LUNA: Operación coordinada con ${action.center}: Houston MCC y ESOC han validado el plan de vuelo y telemetría orbital.`);
    }
    case 'connection-toggle': {
      const names = {
        solarBus: 'paneles y batería',
        roverDock: 'plataforma y rover',
        antennaBus: 'batería y antena',
        roverRadio: 'radio del rover y estación',
        controlBus: 'estación de control y bus de datos',
        issLink: 'enlace orbital ISS'
      };
      const connected = !s.connections[action.id];
      const next = { ...s, connections: { ...s.connections, [action.id]: connected } };
      if (action.id === 'roverDock' && !connected && next.roverMode === 'charging') next.roverMode = 'parked';
      return record(next, `LUNA: ${connected ? 'Conectamos' : 'Desconectamos'} ${names[action.id]}. Observa qué cambia.`);
    }
  }
}
