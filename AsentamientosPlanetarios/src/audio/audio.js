// Original synthesized audio (Web Audio API). No audio files, nothing copyrighted.
// Starts only after a user gesture (see unlock()). Fully optional.
let ctx = null, master, sfxBus, musicBus, noiseBuf;
let settings = { enabled: false, master: 0.7, music: 0.5, sfx: 0.8 };
let scene = 'menu';
let amb = [];
let musicTimer = null;
let lastHover = 0;

const SCENES = {
  menu: { drone: [110, 165], wind: 0, notes: [220, 262, 294, 392, 440], tempo: 1900 },
  moon: { drone: [55, 82.5], wind: 0, notes: [196, 247, 294, 330, 392], tempo: 2300, static: true },
  mars: { drone: [62, 93], wind: 0.5, notes: [165, 196, 220, 262, 330], tempo: 2400 },
  control: { drone: [73, 110], wind: 0, notes: [220, 277, 330, 415, 494], tempo: 2100 },
};

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain(); sfxBus = ctx.createGain(); musicBus = ctx.createGain();
    sfxBus.connect(master); musicBus.connect(master); master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    applyVolumes();
  } catch { ctx = null; }
  return ctx;
}

function applyVolumes() {
  if (!ctx) return;
  const on = settings.enabled ? 1 : 0, t = ctx.currentTime;
  master.gain.setTargetAtTime(on * settings.master * 0.55, t, 0.05);
  sfxBus.gain.setTargetAtTime(settings.sfx, t, 0.05);
  musicBus.gain.setTargetAtTime(settings.music * 0.55, t, 0.05);
}

export function configure(next) {
  settings = { ...settings, ...next };
  if (settings.enabled) { ensure(); resume(); startAmbience(); } else stopAmbience();
  applyVolumes();
}
function resume() { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); }
export function unlock() { if (settings.enabled) { ensure(); resume(); startAmbience(); } }
export const audioSupported = () => typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);

function tone({ f = 440, t = 0.12, type = 'sine', v = 0.18, slide = 0, delay = 0, bus = 'sfx' }) {
  if (!settings.enabled || !ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t0 + t);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  o.connect(g); g.connect(bus === 'music' ? musicBus : sfxBus);
  o.start(t0); o.stop(t0 + t + 0.05);
}
function noise({ t = 0.3, v = 0.1, freq = 1200, delay = 0 }) {
  if (!settings.enabled || !ctx) return;
  const t0 = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t0); s.stop(t0 + t + 0.05);
}

export const sfx = {
  click: () => { tone({ f: 660, t: 0.07, type: 'square', v: 0.07, slide: 220 }); },
  hover: () => { const n = performance.now(); if (n - lastHover < 90) return; lastHover = n; tone({ f: 880, t: 0.04, type: 'sine', v: 0.03 }); },
  select: () => { tone({ f: 440, t: 0.1, type: 'triangle', v: 0.14 }); tone({ f: 660, t: 0.12, type: 'triangle', v: 0.14, delay: 0.09 }); tone({ f: 880, t: 0.18, type: 'triangle', v: 0.14, delay: 0.18 }); },
  build: () => { noise({ t: 0.18, v: 0.08, freq: 500 }); tone({ f: 180, t: 0.14, type: 'square', v: 0.09, delay: 0.02 }); tone({ f: 260, t: 0.14, type: 'square', v: 0.09, delay: 0.16 }); tone({ f: 520, t: 0.22, type: 'triangle', v: 0.12, delay: 0.3 }); },
  warn: () => { tone({ f: 520, t: 0.14, type: 'square', v: 0.1 }); tone({ f: 520, t: 0.14, type: 'square', v: 0.1, delay: 0.2 }); },
  critical: () => { for (let i = 0; i < 3; i++) { tone({ f: 740, t: 0.12, type: 'sawtooth', v: 0.11, delay: i * 0.18 }); tone({ f: 520, t: 0.12, type: 'sawtooth', v: 0.11, delay: i * 0.18 + 0.09 }); } },
  event: () => { tone({ f: 330, t: 0.3, type: 'sine', v: 0.14, slide: -120 }); noise({ t: 0.35, v: 0.05, freq: 300 }); },
  science: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ f, t: 0.16, type: 'triangle', v: 0.13, delay: i * 0.08 })); },
  success: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone({ f, t: 0.28, type: 'triangle', v: 0.15, delay: i * 0.13 })); },
  fail: () => { tone({ f: 196, t: 0.7, type: 'sine', v: 0.18, slide: -90 }); tone({ f: 147, t: 0.9, type: 'sine', v: 0.16, slide: -60, delay: 0.25 }); },
  gain: () => tone({ f: 700, t: 0.1, type: 'sine', v: 0.08, slide: 300 }),
  loss: () => tone({ f: 420, t: 0.12, type: 'sine', v: 0.08, slide: -200 }),
  talk: () => tone({ f: 380 + Math.random() * 160, t: 0.04, type: 'square', v: 0.025 }),
};

function stopAmbience() {
  amb.forEach((n) => { try { n.stop ? n.stop() : n.disconnect(); } catch { /* ignore */ } });
  amb = [];
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

function startAmbience() {
  if (!ctx || !settings.enabled) return;
  stopAmbience();
  const sc = SCENES[scene] || SCENES.menu;
  const t = ctx.currentTime;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
  const dg = ctx.createGain(); dg.gain.value = 0.0001; dg.gain.exponentialRampToValueAtTime(0.12, t + 2);
  lp.connect(dg); dg.connect(musicBus);
  sc.drone.forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = i ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = i ? 6 : -6;
    o.connect(lp); o.start(); amb.push(o);
  });
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 120;
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); amb.push(lfo);
  if (sc.wind) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.05 * sc.wind;
    const l2 = ctx.createOscillator(), lg2 = ctx.createGain(); l2.frequency.value = 0.13; lg2.gain.value = 260;
    l2.connect(lg2); lg2.connect(f.frequency); l2.start();
    s.connect(f); f.connect(g); g.connect(musicBus); s.start(); amb.push(s, l2);
  }
  const loop = () => {
    if (!settings.enabled || !ctx) return;
    const f = sc.notes[Math.floor(Math.random() * sc.notes.length)];
    tone({ f, t: 1.6, type: 'sine', v: 0.06, bus: 'music' });
    if (Math.random() < 0.4) tone({ f: f * 1.5, t: 1.2, type: 'sine', v: 0.03, delay: 0.25, bus: 'music' });
    if (sc.static && Math.random() < 0.25) noise({ t: 0.25, v: 0.025, freq: 2500 });
    musicTimer = setTimeout(loop, sc.tempo * (0.8 + Math.random() * 0.5));
  };
  musicTimer = setTimeout(loop, 900);
}

export function setScene(name) {
  if (scene === name) return;
  scene = name;
  if (ctx && settings.enabled) startAmbience();
}
export const getSettings = () => settings;
