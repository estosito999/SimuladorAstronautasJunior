import { LunarTerrain } from './LunarTerrain';
import { CelestialSky } from './CelestialSky';

export function Environment({ low = false }: { low?: boolean }) {
  return (
    <group name="Environment_WorldRoot">
      <LunarTerrain />
      <CelestialSky low={low} />
    </group>
  );
}
