# Verificación de la integración 0.2

Comprobaciones del **14 de noviembre de 2026**, en Windows, Node.js **24.19.0** y npm **11.17.0**. Los comandos se ejecutaron desde `D:\SimuladorParaAustronautasJunior`, raíz del workspace integrado.

| Comprobación | Resultado |
| --- | --- |
| `npm install --no-audit --no-fund` | Correcto; cuatro paquetes locales enlazados con la aplicación y lockfile raíz actualizado |
| `npm ls --depth=0` | Confirma enlaces de `@selene/lunar-e`, `@selene/zero-g`, `@selene/dust-shield` y `@selene/openmct` a sus repositorios originales |
| `npm test` | **40 pruebas aprobadas**: 17 en los paquetes originales/integraciones y 23 del motor/aplicación |
| `npm run build` | TypeScript estricto y Vite correctos; salida en `SimuladorParaAstronautasJunior/dist/` |
| `npm run dev` | Servidor iniciado desde raíz; eligió `http://127.0.0.1:5175/` porque 5173 y 5174 estaban ocupados |
| HTTP de aplicación y módulos originales | **200** para la página, App, red, proveedor, escena, motor y fuentes de los cuatro repositorios |

## Qué se verificó

- **Lunar-E, 6 pruebas:** modelo original, brazo y equipos; movimiento compartido; regresión de la conducción esférica y zoom de la demo original.
- **ZERO-G, 4 pruebas:** ecuaciones compartidas de generación, demanda y batería; terreno original; compatibilidad del motor de recursos previo.
- **Dust-Shield, 3 pruebas:** atenuación exponencial, limpieza dependiente de alimentación e integral energética.
- **Open MCT, 4 pruebas:** reutilización de su gestor original de metadatos, orden de prioridades, histórico, suscripciones y registro de un plugin mediante sus contratos públicos.
- **Aplicación, 23 pruebas:** energía, limpieza, movimiento, regreso, recarga, señal, límites y pausa; cortes de los enlaces; observaciones almacenadas a bordo y reenvío; última telemetría recibida; instantáneas de informes; polvo depositado por el rover; recorrido educativo completo.

El servidor sirvió directamente, entre otras fuentes:

```text
final-project-Lunar-E/src/models/rover.js
ZERO-G-Junior-Astronaut-Trainer/src/scenes/terrain.js
Dust-Shield/src/shared/dustModel.js
openmct/src/api/telemetry/TelemetryMetadataManager.js
```

Esto verifica la dependencia de los árboles originales en desarrollo. No son copias aisladas dentro de la aplicación. Los adaptadores importan las fuentes compartidas y la compilación integra sus resultados.

La simulación original de ZERO-G también se ejecutó mediante `scripts/simulate.mjs` con salida correcta. Se verificó sintaxis de los archivos originales modificados de ZERO-G y Dust-Shield. No se ejecutó la suite completa de la plataforma Open MCT ni una revisión visual de sus cuatro demos.

## Ajustes de instalación

R3F y el modelo importado necesitan la misma identidad de tipos React/Three. Los tipos se centralizaron en el manifiesto raíz y se fijó `@types/react@19.2.0` mediante `overrides`; `npm ls` confirma deduplicación. No se ocultaron los errores JSX mediante tipos permisivos.

Los toolchains completos antiguos quedan fuera del workspace: cada repositorio aporta su paquete ligero `integration/`. No se instalaron Vue, Webpack, Recharts, Framer Motion o Tailwind para la aplicación integrada.

## Límites conocidos

- No se completó una revisión visual WebGL2 de la integración. Las respuestas HTTP, compilación y pruebas del motor no sustituyen la validación de la interfaz en los dispositivos del aula. La revisión visual del prototipo anterior había sido interrumpida con Escape.
- Vite avisa de un paquete 3D de unos **929 kB minificados / 248 kB gzip**. La escena se carga de forma diferida; el aviso no impide compilar.
- Node muestra un aviso de detección automática de ESM al importar la fuente original de Open MCT, cuyo manifiesto no declara `type: module`. Sus pruebas terminan correctamente; se preservó la configuración global de esa plataforma.
- Una instalación inicial emitió un aviso de limpieza de un binario Tailwind de la versión previa bloqueado por Windows. La instalación terminó correctamente y ese paquete no forma parte del workspace activo.
- La unidad D: dejó de estar disponible brevemente durante el trabajo y luego se recuperó; las comprobaciones finales se realizaron después de recuperarse.

## Repetir

```powershell
cd D:\SimuladorParaAustronautasJunior
npm install
npm test
npm run build
npm run dev
```

Mantén los cuatro repositorios junto a la aplicación. Para experimentar con las conexiones: desconecta los paneles y observa la batería; interrumpe el cable de la plataforma durante una recarga; conduce sin radio ni cable y comprueba los datos pendientes; reconecta la antena y la radio para recibirlos; transmite y compara la instantánea con el CSV de telemetría.