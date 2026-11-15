# Lunar-E / Selene: integración local

Este subpaquete conecta el repositorio real con `SimuladorParaAstronautasJunior` mediante una dependencia `file:../final-project-Lunar-E/integration`.

- `index.js` exporta `advanceRover`, `resolveRoverCommand` y `clampCameraDistance` desde `motion.js`.
- `src/models/roverMotion.js` de la demostración original consume el mismo cálculo de giro, avance y ruedas. La demostración mantiene el movimiento sobre una Luna esférica; la aplicación integrada usa su adaptación a la superficie local X/Z.
- `src/scene/cameraMovement.js` comparte el límite de distancia de cámara.
- `@selene/lunar-e/model` exporta las funciones originales `createRover` y `updateRover` desde `src/models/rover.js`, junto con sus materiales y brazo articulado originales. `createRover` admite omitir texturas; el modelo sigue construido por sus geometrías reales.

La aplicación anfitriona debe resolver una sola instalación de Three.js. La demostración original conserva su import map y su Three.js vendorizado; el subpaquete no copia ni instala ese renderer.

## API

```js
import { advanceRover } from '@selene/lunar-e';
import { createRover, updateRover } from '@selene/lunar-e/model';

const next = advanceRover({ position: [0, 5], heading: 0, forward: 1, turn: 0 }, 0.1);
// heading 0 apunta a +Z. Las distancias se limitan por defecto a X ±12, Z 3..13.
const model = createRover(scene); // original Lunar-E: cuatro ruedas, brazo, paneles y faros
updateRover(model, { panelsOpen: true, gripperOpen: true, keys: {} }, 0.1);
```

El frente del modelo original apunta a +X. Para alinearlo con el eje +Z de la aplicación, coloca su grupo en un contenedor con rotación Y de `-Math.PI / 2`, y aplica la orientación del vehículo al contenedor exterior.

Pruebas puras: `node --test integration/motion.test.js` desde la raíz de Lunar-E. No necesitan Three.js ni navegador. `node --test integration/*.test.js` comprueba también el modelo original y el movimiento esférico; necesita la instalación compartida de Three.js del proyecto principal.

Este paquete es una conexión al árbol de fuentes local completo: no es un artefacto autónomo para publicar. No se ha agregado una licencia general al código original. La autorización para modificar esta copia local no establece permisos de redistribución pública del código ni de sus recursos; se mantienen los avisos existentes.
