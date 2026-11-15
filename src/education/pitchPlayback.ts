export const PITCH_DURATIONS = [24, 27, 23, 19, 34, 32, 21] as const;
export const PITCH_DURATION = 180;

export interface PitchPlaybackState {
  elapsed: number;
  playing: boolean;
}

export type PitchPlaybackAction =
  | { type: 'toggle' }
  | { type: 'restart' }
  | { type: 'seek'; slide: number }
  | { type: 'tick'; seconds: number }
  | { type: 'pause' };

export const initialPlayback: PitchPlaybackState = { elapsed: 0, playing: false };

function boundedElapsed(elapsed: number): number {
  return Number.isFinite(elapsed) ? Math.min(PITCH_DURATION, Math.max(0, elapsed)) : 0;
}

function boundedSlide(slide: number): number {
  return Number.isFinite(slide)
    ? Math.min(PITCH_DURATIONS.length - 1, Math.max(0, Math.floor(slide)))
    : 0;
}

export function getPitchSlideStart(slide: number): number {
  return PITCH_DURATIONS.slice(0, boundedSlide(slide)).reduce<number>((total, duration) => total + duration, 0);
}

export function getPitchSlideAt(elapsed: number): number {
  const time = boundedElapsed(elapsed);
  let end = 0;
  for (let index = 0; index < PITCH_DURATIONS.length; index++) {
    end += PITCH_DURATIONS[index];
    if (time < end) return index;
  }
  return PITCH_DURATIONS.length - 1;
}

/** The final frame remains visible until the presenter explicitly restarts. */
export function playbackReducer(state: PitchPlaybackState, action: PitchPlaybackAction): PitchPlaybackState {
  switch (action.type) {
    case 'toggle':
      return state.elapsed >= PITCH_DURATION
        ? { elapsed: 0, playing: true }
        : { ...state, playing: !state.playing };
    case 'restart':
      return { ...initialPlayback };
    case 'seek':
      return { ...state, elapsed: getPitchSlideStart(action.slide) };
    case 'pause':
      return state.playing ? { ...state, playing: false } : state;
    case 'tick': {
      if (!state.playing || !Number.isFinite(action.seconds) || action.seconds <= 0) return state;
      const elapsed = boundedElapsed(state.elapsed + action.seconds);
      return { elapsed, playing: elapsed < PITCH_DURATION };
    }
  }
}
