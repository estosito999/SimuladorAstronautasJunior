# Dust-Shield: mantenimiento y potencia compartidos

El proyecto junior depende de `file:../Dust-Shield/integration`. Este paquete importa `src/shared/dustModel.js`; la demo original `main.js` importa ese mismo archivo, incluyendo su modelo de atenuación, potencia recuperada, velocidad por voltaje/fases y acumulación de energía. La demo se sigue sirviendo por HTTP con `index.html`; `main.js` es ahora un módulo ES.

`calculateDustEfficiency(coverage)` comparte la fórmula original `exp(-0.03 * cobertura)`. El coeficiente es un parámetro del proyecto de referencia, no una calibración científica verificada. `advanceDust` convierte la velocidad de limpieza del original a porcentaje de cobertura para el ejercicio junior; requiere que el motor de la estación le conceda alimentación. No enseña ni controla hardware de alto voltaje.

Pruebas: `node --test integration/junior.test.js`. No se añade una licencia general al código original ni se concede autorización de redistribución. Esta conexión es para el trabajo local solicitado; los modelos y texturas de la demo no se empaquetan en la aplicación junior.
