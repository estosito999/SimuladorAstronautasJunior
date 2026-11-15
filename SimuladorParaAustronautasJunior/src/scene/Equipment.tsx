/**
 * Facade de compatibilidad y ensamblado de los GameObjects de la Base Lunar y el Rover.
 * Delega a los módulos independientes en `src/gameObjects/base/` y `src/gameObjects/rover/`.
 */
import type { ModuleId, State } from '../simulation/types';
import { BaseComplex } from '../gameObjects/base/BaseComplex';
import { RoverVehicle } from '../gameObjects/rover/RoverVehicle';

type Selection = { selected: ModuleId; onSelect: (id: ModuleId) => void };

export function Equipment({ state, selected, onSelect }: { state: State } & Selection) {
  return (
    <>
      <BaseComplex state={state} selected={selected} onSelect={onSelect} />
      <RoverVehicle state={state} selected={selected} onSelect={onSelect} />
    </>
  );
}

export * from '../gameObjects/base';
export * from '../gameObjects/rover';
