import { describe, expect, it } from 'vitest';
import {
  getPitchSlideAt,
  getPitchSlideStart,
  initialPlayback,
  PITCH_DURATION,
  PITCH_DURATIONS,
  playbackReducer,
} from './pitchPlayback';

describe('presentación de tres minutos', () => {
  it('cambia de sección en sus límites y conserva la última al finalizar', () => {
    expect(PITCH_DURATIONS.reduce<number>((total, duration) => total + duration, 0)).toBe(PITCH_DURATION);
    const starts = [0, 24, 51, 74, 93, 127, 159];
    starts.forEach((start, index) => {
      expect(getPitchSlideStart(index)).toBe(start);
      expect(getPitchSlideAt(start)).toBe(index);
      if (index > 0) expect(getPitchSlideAt(start - 0.01)).toBe(index - 1);
    });
    expect(getPitchSlideAt(180)).toBe(6);
    expect(getPitchSlideAt(900)).toBe(6);
  });

  it('termina a los 180 segundos y requiere una acción explícita para repetir', () => {
    let state = playbackReducer(initialPlayback, { type: 'toggle' });
    state = playbackReducer(state, { type: 'tick', seconds: 179.75 });
    expect(state).toEqual({ elapsed: 179.75, playing: true });
    state = playbackReducer(state, { type: 'tick', seconds: 2 });
    expect(state).toEqual({ elapsed: 180, playing: false });
    expect(playbackReducer(state, { type: 'tick', seconds: 20 })).toBe(state);
    expect(playbackReducer(state, { type: 'toggle' })).toEqual({ elapsed: 0, playing: true });
  });

  it('pausa y continúa sin perder tiempo fraccional', () => {
    let state = playbackReducer(initialPlayback, { type: 'toggle' });
    state = playbackReducer(state, { type: 'tick', seconds: 10.125 });
    state = playbackReducer(state, { type: 'pause' });
    expect(playbackReducer(state, { type: 'tick', seconds: 60 })).toBe(state);
    state = playbackReducer(state, { type: 'toggle' });
    expect(playbackReducer(state, { type: 'tick', seconds: 0.125 }).elapsed).toBe(10.25);
  });

  it('navega al inicio de cada sección conservando la elección de reproducción', () => {
    expect(playbackReducer(initialPlayback, { type: 'seek', slide: 4 })).toEqual({ elapsed: 93, playing: false });
    const playing = { elapsed: 5, playing: true };
    expect(playbackReducer(playing, { type: 'seek', slide: 6 })).toEqual({ elapsed: 159, playing: true });
    expect(playbackReducer(playing, { type: 'restart' })).toEqual(initialPlayback);
    expect(initialPlayback).toEqual({ elapsed: 0, playing: false });
  });

  it('limita navegación y descarta duraciones inválidas', () => {
    expect(getPitchSlideAt(-1)).toBe(0);
    expect(getPitchSlideAt(Number.NaN)).toBe(0);
    expect(getPitchSlideStart(-20)).toBe(0);
    expect(getPitchSlideStart(99)).toBe(159);
    expect(getPitchSlideStart(Number.NaN)).toBe(0);
    const playing = { elapsed: 20, playing: true };
    for (const seconds of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(playbackReducer(playing, { type: 'tick', seconds })).toBe(playing);
    }
  });
});
