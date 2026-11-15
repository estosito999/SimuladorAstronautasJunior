/**
 * Facade de compatibilidad hacia atrás para el entorno planetario.
 * Re-exporta desde la estructura modularizada en `src/gameObjects/environment/`.
 */
import { Environment as EnvironmentRoot, groundHeight } from '../gameObjects/environment';

export { groundHeight };

export function Environment({ low = false }: { low: boolean }) {
  return <EnvironmentRoot low={low} />;
}
