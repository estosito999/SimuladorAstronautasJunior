# Análisis y selección de los repositorios locales

La auditoría inicial se realizó sobre las copias locales disponibles el 14 de noviembre de 2026, antes de modificarlas. Posteriormente el usuario pidió explícitamente fusionar las funcionalidades, modificar los originales y hacer que el simulador dependiera de los cuatro repositorios. La arquitectura actual aplica esa decisión. Las versiones de la auditoría describen las fuentes inspeccionadas, no necesariamente sus últimas versiones públicas.

## Integración actual: código compartido y dependencias

La raíz es un workspace npm con la aplicación y cuatro paquetes locales `integration/`. Cada dependencia `file:` importa fuentes de su repositorio original; eliminar uno de esos árboles rompe esa parte de la aplicación.

| Origen / paquete | Código utilizado realmente | Modificaciones en el original |
| --- | --- | --- |
| Lunar-E / `@selene/lunar-e` | Modelo original del rover, comandos/movimiento y límite de cámara | Modelo adaptable a la aplicación y funciones de movimiento/cámara compartidas con su demo |
| ZERO-G / `@selene/zero-g` | Generador `makeTerrain`, generación eléctrica y almacenamiento | Ecuaciones extraídas a `src/game/powerModel.js`; `resourceSystem.js` las importa también |
| Dust-Shield / `@selene/dust-shield` | Atenuación exponencial, potencia, velocidad y limpieza | Módulo `src/shared/dustModel.js` compartido con `main.js`; carga ES module en `index.html` |
| Open MCT / `@selene/openmct` | `TelemetryMetadataManager` original y proveedor de diez canales | Ordenación de metadatos sin Lodash, conservando su API; integración de histórico, suscripción y plugin |

El motor conecta producción, batería de estación, carga del rover, consumo de limpieza y antena. La radio del rover entrega observaciones a la base; la antena transmite una instantánea. Los enlaces `solarBus`, `roverDock`, `antennaBus` y `roverRadio` se pueden interrumpir. La aplicación principal continúa siendo React; la UI completa Vue de Open MCT no se monta.

La autorización para modificar estas copias locales no añade licencias a Lunar-E o Dust-Shield. Se mantienen los avisos existentes y se documentan el uso de ZERO-G bajo MIT y el de Open MCT bajo Apache-2.0 en [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Los assets pesados y las texturas planetarias no se incorporan a la aplicación.

## Auditoría inicial y matriz de selección

| Origen | Conservar como concepto | Adaptar al prototipo | Descartar |
| --- | --- | --- | --- |
| `final-project-Lunar-E` | Rover geométrico, movimiento 3D, ruedas animadas, cámaras orbital y de seguimiento | Conducción sencilla sobre la zona de la estación y selección de equipos | Sistema solar completo, tiempo orbital, música, controles complejos de brazo y texturas 8K |
| `ZERO-G-Junior-Astronaut-Trainer` | Escenario lunar procedural, instalaciones seleccionables y relación entre recursos | Estado compartido de energía, indicadores claros y guía educativa | Supervivencia, salud/oxígeno/comida, daño por radiación, presupuestos, dificultades, peligros aleatorios, derrotas y puntuaciones |
| `Dust-Shield` | Polvo → menor producción; limpieza → recuperación; mantenimiento visible | Limpieza gradual con consumo eléctrico y apagado al finalizar | Cinemática orbital, alto voltaje/frecuencia/fases, UART, firmware y fabricación de placas |
| `openmct` | Valores con tiempo/unidades, histórico, tendencias y registro de operaciones | Telemetría React con gráficas SVG y descarga CSV | Plataforma Vue completa, Webpack, CouchDB, planificadores y herramientas profesionales de edición |

Esta matriz orientó el primer prototipo, que utilizaba implementaciones propias. La integración actual sustituye las partes indicadas arriba por código compartido con los repositorios originales. Las funciones de supervivencia y puntuación permanecen fuera de la experiencia junior.

## Lunar-E

**Estructura y tecnología.** Aplicación estática con módulos JavaScript, sin React ni `package.json`: `index.html`, `src/main.js`, `src/models/`, `src/scene/`, `src/controls/`, `src/rendering/` y `src/solarSystem/`. Three.js 0.160.0 y OrbitControls están incluidos en `vendor/three/`.

**Referencias útiles.** `src/models/rover.js` construye el rover con primitivos; `roverMotion.js` contiene movimiento geométrico sobre una esfera; `robotArm.js` organiza articulaciones. `src/scene/camera.js` y `cameraMovement.js` contienen las cámaras; `src/controls/interaction.js` conecta teclado e interacción. El movimiento esférico completo se sustituye por coordenadas locales X/Z: resulta más comprensible para inspeccionar una estación.

**Licencia.** No se encontró licencia general para el código original. `vendor/three/LICENSE` cubre la biblioteca Three.js bajo MIT, no el rover ni el resto de la aplicación. Su README atribuye texturas a Solar System Scope bajo CC BY 4.0; esa atribución no autoriza automáticamente los demás recursos. El primer prototipo evitó copiarlo; la integración local actual modifica y consume su código por instrucción del usuario, sin añadir una licencia general ni incorporar música o texturas.

## ZERO-G

**Estructura y tecnología.** React 18.3.1, Vite 5.4.10, Three.js 0.169.0, React Three Fiber 8.17.10, drei 9.114.0, Framer Motion 11.11.0, Recharts 2.13.0 y Tailwind CSS 3.4.14. Escena en `src/scenes/`, reglas en `src/game/` e interfaz en `src/components/`.

**Referencias útiles.** `src/scenes/terrain.js` y `parts.jsx` generan terreno, rocas y Tierra; `MoonScene.jsx`, `MoonBase.jsx` y `Modules.jsx` componen la estación; `Rover.jsx` muestra un vehículo seleccionable. `src/game/resourceSystem.js` relaciona generación, polvo, demanda y baterías, aunque mezcla estas reglas con supervivencia. `ResourceGauge.jsx`, `ResourcePanel.jsx` y `Astronaut.jsx` sirven como referencia de comunicación visual.

**Licencia.** `LICENSE` contiene MIT, copyright © 2026 Md. Khairul Anam Shopnil. La integración actual utiliza y adapta su terreno y sus ecuaciones; conserva la licencia íntegra. Framer Motion, Recharts, Tailwind, audio y fuentes remotas de la demo no son necesarios en el paquete compartido. El sistema de supervivencia del original no se importa a la experiencia junior.

## Dust-Shield

**Estructura y tecnología.** Web estática sin `package.json`: `index.html`, `index.css`, `CSS_TOKENS.css` y `main.js`. Carga Three.js r128, OrbitControls, GLTFLoader y MeshSurfaceSampler por CDN. También contiene `assets/nasa/`, firmware Arduino y recursos de hardware.

**Referencias útiles.** `main.js` reúne estado, DOM, renderizado y física. `updateDustSimulation` implementa partículas y limpieza; otros bloques calculan cobertura, eficiencia, producción y apagado automático. El prototipo separa estas responsabilidades y usa una relación didáctica explícita entre polvo y producción, sin afirmar precisión física.

**Licencia y recursos.** No se encontró `LICENSE`, `LICENCE`, `COPYING` ni autorización general en los archivos inspeccionados. La carpeta denominada `nasa` no demuestra la licencia individual de sus recursos. Los modelos examinados incluyen terreno de unos 52.7 MB y rover de unos 11.9 MB; no se incorporan al simulador. La integración actual comparte las ecuaciones extraídas de `main.js` para el uso local solicitado, sin asignar una licencia nueva. Su coeficiente de polvo se presenta como parámetro de la demo; no se repite su afirmación de calibración científica sin fuente verificable.

## Open MCT

**Estructura y tecnología.** `package.json` declara Open MCT 4.3.1 y Node ≥24.14.1. JavaScript, Vue 3.4.24, Webpack 5 y SCSS; utiliza, entre otras herramientas, D3, Plotly, Moment, Lodash y MathJS. Su arquitectura organiza funcionalidades mediante plugins.

**Referencias útiles.** `API.md` describe proveedores, solicitudes históricas y suscripciones. `src/api/telemetry/TelemetryAPI.js` gestiona metadatos, unidades y datos; `example/generator/GeneratorProvider.js` demuestra histórico y suscripción; `src/plugins/plot/README.md` y `src/plugins/telemetryTable/plugin.js` muestran visualización temporal y límites de filas.

**Licencia.** `LICENSE.md` declara Apache-2.0. La integración actual consume y modifica `TelemetryMetadataManager.js`, conservando cabeceras y aviso de cambios, y añade el proveedor/plugin junior. Los avisos de NASA y los términos de Apache-2.0 se conservan en la documentación de la aplicación. La interfaz y los demás plugins profesionales no se incorporan.

## Fases y dependencias del proyecto propio

1. **Energía:** paneles, orientación, luz, producción, demanda y batería compartida.
2. **Rover:** movimiento, consumo, regreso y recarga desde la estación.
3. **Comunicaciones:** alimentación, orientación, señal y transmisión ficticia.
4. **Mantenimiento:** depósito experimental de polvo y limpieza con consumo.
5. **Supervisión:** histórico acotado, gráficas, registro y CSV.

Cada módulo modifica el mismo estado del motor. El manifiesto actual incluye React/React DOM, React Three Fiber, Three.js, Lucide y las cuatro dependencias locales `@selene/*`. Los paquetes de integración seleccionan fuentes concretas, sin instalar en bloque las dependencias antiguas. `npm test` desde la raíz ejecuta las pruebas de los cuatro paquetes y del motor integrado; los resultados concretos corresponden a [VERIFICACION.md](VERIFICACION.md).
