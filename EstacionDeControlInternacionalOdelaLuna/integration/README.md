# Open MCT conectado a Estación Selene

Este subpaquete local forma parte del repositorio `openmct`: **no es una copia independiente**. Importa directamente `src/api/telemetry/TelemetryMetadataManager.js`, la misma implementación que utiliza la API de telemetría de Open MCT. Si se elimina este repositorio, la aplicación integrada no puede resolver esa dependencia.

La modificación al módulo original sustituye la ordenación de pesos numéricos de metadatos mediante Lodash por una ordenación estable nativa. Mantiene sus firmas, selección de dominios/rangos y valores predeterminados. Así el módulo compartido no necesita cargar Vue, Webpack ni toda la plataforma.

`createJuniorTelemetry()` conserva un histórico acotado, proporciona `publish`, `request`, `subscribe`, `reset`, `getHistory`, `getSnapshot` y metadatos originales. Los datos proceden del motor compartido de Selene, no de un generador aleatorio. Cada muestra incluye potencia, demanda, baterías, señal, polvo, recorrido, observaciones, informes y balance. `time` son segundos de actividad; `utc` vincula ese tiempo a la época local de creación del proveedor para las vistas de Open MCT.

La aplicación React depende de `file:../openmct/integration` bajo el nombre `@selene/openmct`. La fuente debe permanecer en este árbol junto a `src/`; el subpaquete no está preparado para publicarse por separado.

```js
import { createJuniorTelemetry, createJuniorTelemetryPlugin } from '@selene/openmct';

const telemetry = createJuniorTelemetry({ capacity: 90 });
const unsubscribe = telemetry.subscribe('solar.production', datum => console.log(datum.value));
// El motor de la aplicación publica una muestra completa con telemetry.publish(...).
// Con una instancia completa de Open MCT se conecta exactamente la misma fuente:
openmct.install(createJuniorTelemetryPlugin(telemetry));
```

El plugin registra diez objetos de telemetría, su proveedor histórico/tiempo real y sus metadatos mediante las API públicas reales descritas en `../API.md`. El prototipo React consume el proveedor y metadatos; no monta la interfaz completa de Open MCT. La conexión al framework completo queda disponible mediante el plugin, sin iniciar una segunda simulación ni un servidor.

Verificación autónoma, sin instalar las herramientas de toda la plataforma:

```powershell
node --test integration/junior.test.js
```

Cambios asistidos por Codex. Se conserva Apache-2.0 y los avisos originales de `../LICENSE.md` y `TelemetryMetadataManager.js`.
