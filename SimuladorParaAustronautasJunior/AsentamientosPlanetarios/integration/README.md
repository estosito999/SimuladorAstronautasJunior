# ZERO-G: módulo compartido de energía

El simulador depende de esta carpeta mediante `file:../ZERO-G-Junior-Astronaut-Trainer/integration`.
`junior.js` importa las ecuaciones de `src/game/powerModel.js`; el motor original `resourceSystem.js` usa esas mismas ecuaciones. No se duplica el motor completo ni se instalan las dependencias gráficas de ZERO-G en el proyecto junior.

- `calculateStationPower`: adapta la generación original a un panel didáctico de 240 W y acepta la eficiencia calculada por Dust-Shield.
- `calculatePowerDemand`: presupuesto de carga común a ambos motores.
- `advancePowerStore` / `integrateBatteryPct`: balance de almacenamiento compartido; el adaptador junior convierte segundos a Wh.
- `makeTerrain`: exporta directamente el generador procedural de `src/scenes/terrain.js`, también utilizado por la escena original, con sus cráteres deterministas y función de altura.
- `dustEfficiencyAtCoverage`: conserva la relación lineal original de ZERO-G para su demo; la aplicación integrada puede usar el modelo exponencial de Dust-Shield.

Pruebas: `node --test integration/junior.test.js` desde el repositorio. La licencia MIT original se conserva en `../LICENSE`.
