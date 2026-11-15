/* Junior integration tests. Apache-2.0; see ../LICENSE.md. Assisted by Codex. */
import test from 'node:test';
import assert from 'node:assert/strict';
import TelemetryMetadataManager from '../src/api/telemetry/TelemetryMetadataManager.js';
import { createJuniorTelemetry, createJuniorTelemetryPlugin, JUNIOR_CHANNELS, JUNIOR_NAMESPACE } from './junior.js';

function snapshot(time, production = 120) {
  return { time, production, demand: 40, battery: 65, roverBattery: 72, signal: 85,
    dust: 23, roverDistance: 8, observations: 2, packets: 1 };
}

test('bridge reuses the original Open MCT metadata manager and priority semantics', () => {
  const telemetry = createJuniorTelemetry({ epoch: 0 });
  const metadata = telemetry.getMetadata('solar.production');
  assert.ok(metadata instanceof TelemetryMetadataManager);
  assert.equal(metadata.getDefaultDisplayValue().source, 'production');
  assert.equal(metadata.getDefaultDisplayValue().unit, 'W');
  assert.deepEqual(metadata.valuesForHints(['domain']).map((value) => value.key), ['utc', 'time']);
  const original = new TelemetryMetadataManager({ values: [
    { key: 'third', hints: { range: 2, priority: 0 } },
    { key: 'first', hints: { range: 1, priority: 1 } },
    { key: 'second', hints: { range: 1, priority: 1 } },
    { key: 'time', hints: { domain: 1 } }
  ] });
  assert.deepEqual(original.valuesForHints(['range', 'priority']).map((value) => value.key), ['first', 'second', 'third']);
  assert.equal(original.value('time').source, 'time');
});

test('history is ordered, bounded, replaces equal times and resets on rewind', () => {
  const telemetry = createJuniorTelemetry({ capacity: 3, epoch: 1000 });
  for (let time = 0; time < 5; time++) telemetry.publish(snapshot(time));
  assert.deepEqual(telemetry.getHistory().map((row) => row.time), [2, 3, 4]);
  telemetry.publish(snapshot(4, 150));
  assert.equal(telemetry.getHistory().length, 3);
  assert.equal(telemetry.getSnapshot().balance, 110);
  assert.deepEqual(telemetry.request('solar.production', 2, 3).map((row) => row.value), [120, 120]);
  assert.deepEqual(telemetry.request('solar.production', 4000, 5000, 'utc').map((row) => row.time), [3, 4]);
  telemetry.publish(snapshot(0));
  assert.equal(telemetry.getHistory().length, 1);
  telemetry.reset();
  assert.equal(telemetry.getSnapshot(), null);
});

test('subscriptions are independent, release correctly and cannot mutate stored samples', () => {
  const telemetry = createJuniorTelemetry({ epoch: 0 });
  const received = [];
  const callback = (datum) => { received.push(datum.value); datum.value = -1; };
  const first = telemetry.subscribe('rover.battery', callback);
  const second = telemetry.subscribe('rover.battery', callback);
  telemetry.publish(snapshot(0));
  first();
  telemetry.publish(snapshot(1));
  second();
  telemetry.publish(snapshot(2));
  assert.deepEqual(received, [72, 72, 72]);
  assert.equal(telemetry.request('rover.battery')[0].value, 72);
  const rows = telemetry.getHistory();
  rows[0].battery = -4;
  assert.equal(telemetry.getHistory()[0].battery, 65);
  assert.throws(() => telemetry.publish({ ...snapshot(3), signal: NaN }), TypeError);
});

test('installable Open MCT plugin exposes live source through actual provider contracts', async () => {
  const telemetry = createJuniorTelemetry({ epoch: 0 });
  const installed = { roots: [], types: [] };
  const openmct = {
    types: { addType(key, definition) { installed.types.push([key, definition]); } },
    objects: {
      addProvider(namespace, provider) { installed.namespace = namespace; installed.objects = provider; },
      addRoot(identifier) { installed.roots.push(identifier); }
    },
    telemetry: { addProvider(provider) { installed.telemetry = provider; } }
  };
  createJuniorTelemetryPlugin(telemetry)(openmct);
  assert.equal(installed.namespace, JUNIOR_NAMESPACE);
  assert.equal(installed.roots.length, JUNIOR_CHANNELS.length);
  const object = await installed.objects.get({ key: 'comms.signal' });
  const provider = installed.telemetry;
  assert.equal(provider.supportsRequest(object), true);
  assert.equal(provider.getMetadata(object).values[2].unit, '%');
  const received = [];
  const release = provider.subscribe(object, (datum) => received.push(datum.value));
  telemetry.publish(snapshot(1));
  telemetry.publish(snapshot(2));
  assert.deepEqual(received, [85, 85]);
  assert.equal((await provider.request(object, { start: 1000, end: 2000, domain: 'utc', strategy: 'latest', size: 1 })).length, 1);
  assert.deepEqual(await provider.request(object, { signal: { aborted: true } }), []);
  release();
  assert.equal(await installed.objects.get({ key: 'unknown' }), undefined);
});
