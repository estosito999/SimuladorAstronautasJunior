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
- **Rover:** conduce, recoge observaciones, regresa y recarga. Moverse cerca de los paneles puede añadir polvo; recargar aumenta el consumo de la estación.
- **Comunicaciones:** conecta la antena, orienta la señal y transmite un informe local con datos de los equipos y observaciones recibidas.
- **Conexiones:** abre o cierra los enlaces paneles–base, base–plataforma, base–antena y radio del rover. Los enlaces eléctricos y de datos tienen consecuencias diferentes.
- **Supervisión:** consulta métricas, histórico y operaciones; descarga las muestras de telemetría como CSV.

Con la radio interrumpida, el rover conserva observaciones pendientes. Al restablecerla puede compartirlas con la estación. Un informe transmitido guarda una instantánea del estado: los cambios posteriores no reescriben lo ya enviado.

Selecciona equipos desde la interfaz o la escena. Arrastra para girar la cámara y usa la rueda para acercarte; hay botones equivalentes y seguimiento del rover. Mantén los botones de dirección o usa WASD/flechas cuando la escena tenga el foco. Tab recorre los controles.

## Alcance didáctico y datos

La escena combina el rover original de Lunar-E, el terreno de ZERO-G y componentes de la estación. Las fórmulas se adaptan a un ejercicio: estación de 100 Wh, rover de 30 Wh y tiempo energético acelerado ×60. El ángulo ideal de 45° es un objetivo de la actividad; el coeficiente de polvo de Dust-Shield es un parámetro de su demo, sin calibración científica verificada.

LUNA utiliza mensajes programados. La antena y su informe son simulaciones locales: no se comunican con equipos reales, NASA ni servicios de IA. No hay cuentas ni guardado entre recargas. El CSV se crea en el navegador con el histórico disponible.

## Documentación

- [Análisis de fuentes y matriz de integración](docs/ANALISIS_REPOSITORIOS.md)
- [Arquitectura y conexiones](docs/ARQUITECTURA.md)
- [Licencias, procedencia y modificaciones](THIRD_PARTY_NOTICES.md)
- [Resultados y límites de verificación](docs/VERIFICACION.md)

La versión integrada requiere comprobar instalación, pruebas, compilación y renderizado con sus dependencias locales; los resultados se mantienen en `VERIFICACION.md`. El prototipo anterior y esta integración tienen alcances de verificación diferentes.
