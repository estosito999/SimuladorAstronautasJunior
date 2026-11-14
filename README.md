# SimuladorParaAstronautasJunior — proyecto integrado

Este directorio es un **workspace npm que conecta los cuatro repositorios locales con una aplicación React + TypeScript + React Three Fiber + Three.js**. Los repositorios se modificaron para compartir código con el simulador; ya no son solamente referencias de diseño.

## Ejecutar desde esta carpeta

Requiere Node.js **22.12 o posterior**, npm y un navegador con WebGL 2.

```powershell
cd D:\SimuladorParaAustronautasJunior
npm install
npm run dev
```

```powershell
npm test
npm run build
npm run preview
```

`dev`, `build` y `preview` ejecutan la aplicación de `SimuladorParaAstronautasJunior/`. `test` ejecuta las pruebas de los cuatro paquetes de integración y las del motor. La compilación se genera en `SimuladorParaAstronautasJunior/dist/`. Abre la URL HTTP que muestre Vite.

## Repositorios conectados

| Paquete local | Código compartido que usa el simulador |
| --- | --- |
| `@selene/lunar-e` | Modelo original del rover, movimiento y utilidades de cámara de `final-project-Lunar-E` |
| `@selene/zero-g` | Terreno procedural, generación y balance de batería de `ZERO-G-Junior-Astronaut-Trainer` |
| `@selene/dust-shield` | Atenuación solar por polvo y limpieza de `Dust-Shield` |
| `@selene/openmct` | Gestor original de metadatos y proveedor de telemetría con histórico y suscripciones de `openmct` |

Cada repositorio contiene un paquete `integration/`. Los cinco workspaces —aplicación y cuatro integraciones— se enlazan localmente; sus fuentes deben permanecer juntas. La instalación se coordina con el `package-lock.json` de esta raíz. Los paquetes ligeros comparten las funciones seleccionadas sin iniciar cuatro aplicaciones ni instalar todos sus toolchains antiguos.

## Dispositivos interconectados

Los paneles alimentan la batería y los equipos de la estación. La plataforma recarga al rover; su radio comparte observaciones con la base; la antena transmite una instantánea de esas observaciones y del estado de los equipos. Los enlaces eléctricos y de datos se pueden interrumpir para observar sus consecuencias. El polvo y la limpieza cambian la potencia disponible para toda la red.

La experiencia está dirigida a niños de 7 a 12 años. LUNA explica los experimentos con mensajes programados, sin supervivencia ni puntuaciones. Todos los datos y mensajes son simulados localmente.

Consulta [la guía de la aplicación](SimuladorParaAstronautasJunior/README.md), [la arquitectura](SimuladorParaAstronautasJunior/docs/ARQUITECTURA.md), [el análisis y los cambios en los repositorios](SimuladorParaAstronautasJunior/docs/ANALISIS_REPOSITORIOS.md), [los avisos de licencia](SimuladorParaAstronautasJunior/THIRD_PARTY_NOTICES.md) y [los resultados de verificación](SimuladorParaAstronautasJunior/docs/VERIFICACION.md).

Los archivos previos `src/`, `public/` y `dist/` de esta raíz se conservan como versión anterior; los scripts actuales utilizan la aplicación integrada de la subcarpeta. La integración local no añade una licencia general a Lunar-E o Dust-Shield ni determina permisos de publicación de sus recursos.
