# SimuladorParaAstronautasJunior — Estación Selene

Simulador educativo 3D en español para niñas y niños de 7 a 12 años. **LUNA** acompaña la exploración de equipos que comparten energía y datos, sin supervivencia ni puntuaciones.

Esta aplicación **depende de los cuatro repositorios vecinos**. Sus paquetes `integration/` exportan código real que también utilizan los proyectos originales. Se modificaron esos repositorios para compartir funciones y modelos; esta carpeta ya no es un proyecto autónomo.

## Ejecutar

Instala y ejecuta desde la raíz del workspace, conservando las cinco carpetas:

```powershell
cd D:\SimuladorParaAustronautasJunior
npm install
npm run dev
```

Necesitas Node.js **22.12 o posterior**, npm y WebGL 2 para la escena. `npm test` ejecuta las pruebas de las integraciones y del motor; `npm run build` comprueba TypeScript y genera `SimuladorParaAstronautasJunior/dist/`; `npm run preview` sirve esa compilación localmente.

## Simulador Espacial Unity 3D

El Centro de Misiones incluye un visor del proyecto Unity vecino `simulador espacial`. `npm run unity:check` comprueba los requisitos locales, `npm run unity:build` exporta con Unity 6000.6.7f1 y `npm run unity:import -- "ruta de exportación"` permite importar una compilación Web existente. La guía contiene los requisitos, la publicación y el estado de verificación. [Integración Unity Web](docs/UNITY_WEB.md)

## Qué aporta cada repositorio

| Dependencia | Uso real |
| --- | --- |
| `@selene/lunar-e` | Rover original, movimiento y límites de cámara |
| `@selene/zero-g` | Terreno original y ecuaciones compartidas de generación y batería |
| `@selene/dust-shield` | Eficiencia solar exponencial y limpieza basada en su modelo compartido |
| `@selene/openmct` | `TelemetryMetadataManager` original, diez canales, solicitudes históricas y suscripciones |

Las dependencias `file:../…/integration` enlazan las fuentes vecinas. Vite resuelve una sola instalación compartida de React y Three.js. La interfaz principal es React; el proveedor de telemetría también ofrece un plugin para una instancia completa de Open MCT, sin montar esa interfaz completa en este prototipo.

## Experimenta con una red de equipos

- **Energía:** cambia luz e inclinación, añade polvo y limpia. La producción modifica la batería que alimenta los demás equipos.
- **Rover:** explora una zona de 120 × 120 metros y recoge las 12 rocas señaladas. El brazo tiene giro, hombro, codo y pinza: alinea la pinza con una roca, recógela y guárdala en el depósito. Las muestras son distintas de las observaciones de telemetría. Moverse cerca de los paneles puede añadir polvo; recargar aumenta el consumo de la estación.
- **Comunicaciones:** conecta la antena, orienta la señal y transmite un informe local con datos de los equipos y observaciones recibidas.
- **Conexiones:** abre o cierra los enlaces paneles–base, base–plataforma, base–antena y radio del rover. Los enlaces eléctricos y de datos tienen consecuencias diferentes.
- **Supervisión:** consulta métricas, histórico y operaciones; descarga las muestras de telemetría como CSV.

Con la radio interrumpida, el rover conserva observaciones pendientes. Al restablecerla puede compartirlas con la estación. Un informe transmitido guarda una instantánea del estado: los cambios posteriores no reescriben lo ya enviado.

Selecciona equipos desde la interfaz o la escena. Arrastra para girar la cámara y usa la rueda para acercarte; hay botones equivalentes y seguimiento del rover. Mantén los botones de dirección o usa WASD/flechas cuando la escena tenga el foco. Tab recorre los controles.

El panel del rover tiene pestañas **Conducir**, **Brazo** y **Muestras**. Detén el vehículo antes de usar el brazo. Para practicar, la primera roca está unos metros delante de la plataforma: avanza aproximadamente un metro y baja el hombro hacia 0°. La guía de la pinza se vuelve verde cuando puedes recogerla. El botón **Guardar muestra** la coloca en el depósito; no puede recogerse dos veces. El brazo se repliega al conducir y conserva cualquier roca agarrada. El retorno automático reserva energía según la distancia a la base.

Con el visor enfocado, Q/E gira el brazo, R/F sube o baja el hombro y T/G ajusta el codo. Espacio recoge, B guarda, C abre/cierra la pinza vacía y X repliega. También hay controles equivalentes en pantalla. Las muestras se conservan durante la sesión y se borran al reiniciar o recargar la página.

## Pitch del proyecto

La pestaña **Pitch & Presentación** sigue el guion del equipo en siete escenas: universo, curiosidad, Luna, disciplinas, pregunta educativa, proyecto y propósito. **Presentar 3 min** reproduce el recorrido durante 180 segundos activos y se detiene en el cierre. Las transiciones de naves forman parte de ese tiempo. El modo ensayo permite avanzar y volver manualmente, pausando la reproducción automática.

El botón **Guion** muestra el texto íntegro de cada escena, sus tiempos y la descarga del guion completo. Flechas izquierda/derecha cambian de escena, Espacio pausa o continúa, F activa pantalla completa, N abre el guion e Inicio reinicia. La presentación se pausa al ocultar la pestaña. Las preferencias de movimiento reducido desactivan los vuelos y se pueden cambiar desde su botón de animaciones. Los planetas, estrellas y naves se generan localmente con Three.js/React Three Fiber; GSAP anima los vuelos.

## Alcance didáctico y datos

La escena combina el rover original de Lunar-E, el terreno de ZERO-G y componentes de la estación. Las fórmulas se adaptan a un ejercicio: estación de 100 Wh, rover de 60 Wh y tiempo energético acelerado ×60. El ángulo ideal de 45° es un objetivo de la actividad; el coeficiente de polvo de Dust-Shield es un parámetro de su demo, sin calibración científica verificada.

LUNA utiliza mensajes programados. La antena y su informe son simulaciones locales: no se comunican con equipos reales, NASA ni servicios de IA. No hay cuentas ni guardado entre recargas. El CSV se crea en el navegador con el histórico disponible.

## Documentación

- [Análisis de fuentes y matriz de integración](docs/ANALISIS_REPOSITORIOS.md)
- [Arquitectura y conexiones](docs/ARQUITECTURA.md)
- [Licencias, procedencia y modificaciones](THIRD_PARTY_NOTICES.md)
- [Resultados y límites de verificación](docs/VERIFICACION.md)

La versión integrada requiere comprobar instalación, pruebas, compilación y renderizado con sus dependencias locales; los resultados se mantienen en `VERIFICACION.md`. El prototipo anterior y esta integración tienen alcances de verificación diferentes.
