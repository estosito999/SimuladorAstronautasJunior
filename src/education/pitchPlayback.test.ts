import { describe, expect, it } from 'vitest';
import { PITCH_SCRIPT, PITCH_SECTIONS } from './pitchContent';
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
    const starts = [0, 34, 59, 82, 107, 146, 167];
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
    expect(playbackReducer(initialPlayback, { type: 'seek', slide: 4 })).toEqual({ elapsed: 107, playing: false });
    const playing = { elapsed: 5, playing: true };
    expect(playbackReducer(playing, { type: 'seek', slide: 6 })).toEqual({ elapsed: 167, playing: true });
    expect(playbackReducer(playing, { type: 'restart' })).toEqual(initialPlayback);
    expect(initialPlayback).toEqual({ elapsed: 0, playing: false });
  });

  it('limita navegación y descarta duraciones inválidas', () => {
    expect(getPitchSlideAt(-1)).toBe(0);
    expect(getPitchSlideAt(Number.NaN)).toBe(0);
    expect(getPitchSlideStart(-20)).toBe(0);
    expect(getPitchSlideStart(99)).toBe(167);
    expect(getPitchSlideStart(Number.NaN)).toBe(0);
    const playing = { elapsed: 20, playing: true };
    for (const seconds of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(playbackReducer(playing, { type: 'tick', seconds })).toBe(playing);
    }
  });

  it('usa un solo reloj para la narración y las transiciones sin sumar tiempo', () => {
    let state = playbackReducer(initialPlayback, { type: 'toggle' });
    const visited: number[] = [getPitchSlideAt(state.elapsed)];
    for (let second = 0; second < PITCH_DURATION; second++) {
      state = playbackReducer(state, { type: 'tick', seconds: 1 });
      const slide = getPitchSlideAt(state.elapsed);
      if (visited.at(-1) !== slide) visited.push(slide);
    }
    expect(visited).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(state).toEqual({ elapsed: 180, playing: false });
  });

  it('conserva el guion de origen y su recorrido en siete secciones', () => {
    expect(PITCH_SECTIONS.map(section => section.id)).toEqual([
      'universe', 'curiosity', 'moon', 'disciplines', 'question', 'project', 'explorer',
    ]);
    expect(PITCH_SECTIONS).toHaveLength(PITCH_DURATIONS.length);
    expect(PITCH_SECTIONS.map(section => section.visual)).toEqual([
      'stars', 'voyage', 'moon', 'disciplines', 'question', 'station', 'horizon',
    ]);
    expect(PITCH_SCRIPT).toContain('experimentamos una sensación difícil de describir');
    expect(PITCH_SCRIPT).toContain('matemáticos, físicos, ingenieros, informáticos y científicos');
    expect(PITCH_SCRIPT).toContain('¿por qué esperar a que un niño llegue a la universidad');
    expect(PITCH_SCRIPT).toContain('Con esa visión nace nuestro proyecto: Simulador para Astronautas Junior.');
    expect(PITCH_SCRIPT.endsWith('Porque creemos que antes de formar a un astronauta, debemos despertar la mente de un explorador.')).toBe(true);
  });
});
