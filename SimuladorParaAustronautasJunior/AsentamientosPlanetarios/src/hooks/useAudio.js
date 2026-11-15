import { useEffect } from 'react';
import { setScene } from '../audio/audio.js';
export function useSceneAudio(name) { useEffect(() => { setScene(name); }, [name]); }
