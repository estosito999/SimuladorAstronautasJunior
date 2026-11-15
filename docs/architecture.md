# Arquitectura Técnica del Simulador Educativo Lunar 3D

## 1. Visión General
**SimuladorParaAstronautasJunior** es una aplicación educativa web 3D interactiva para niños de 7 a 12 años, construida con React 19, TypeScript, Three.js y React Three Fiber 9. Consolida en una sola escena y un único motor de simulación los modelos físicos, cinemáticos y de telemetría provenientes de 4 proyectos espaciales de referencia.

## 2. Estructura Unificada de Módulos
```
src/
├── gameObjects/         # Objetos 3D y subsistemas desacoplados por funcionalidad
│   ├── base/            # Estructuras de superficie lunar
│   │   ├── BaseComplex.tsx           # Ensamblado del complejo lunar
│   │   ├── FlightControlStation.tsx  # Estación de Control de Vuelo DSN (ciudadela de mando)
│   │   ├── Habitat.tsx               # Módulo de residencia / soporte vital
│   │   ├── SolarPanels.tsx           # Matriz fotovoltaica con EDS y polvo
│   │   ├── CommunicationsDish.tsx    # Antena parabólica orientable de espacio profundo
│   │   ├── ChargingDock.tsx          # Estación inductiva de recarga para el rover
│   │   └── PowerCables.tsx           # Cableado de potencia y bus de datos
│   ├── rover/           # Vehículo de exploración lunar (Lunar-E)
│   │   ├── RoverVehicle.tsx          # Componente R3F interactivo y sincronización de telemetría
│   │   └── roverModel.ts             # Factoría geométrica, suspensión y cinemática de brazo
│   ├── orbital/         # Objetos y satélites en órbita
│   │   ├── InternationalSpaceStation.tsx # Estación Espacial Internacional (ISS)
│   │   └── OrbitTrajectory.ts        # Dinámica orbital LEO y cálculo de posiciones
│   ├── environment/     # Entorno físico lunar y cielo celeste
│   │   ├── CelestialSky.tsx          # Bóveda estelar, Sol y modelo de la Tierra
│   │   ├── LunarTerrain.tsx          # Malla de regolito y dispersión de rocas
│   │   ├── LunarSamples.tsx          # Muestras geológicas recolectables
│   │   ├── terrainHeight.ts          # Generador determinista de elevación lunar
│   │   └── Environment.tsx           # Ensamblado global del entorno planetario
│   ├── camera/          # Sistema multicámara y rigs de observación
│   │   ├── CameraRig.tsx             # Control orbital, seguimiento del rover y enfoque
│   │   └── cameraModes.ts            # Modos de cámara (overview, follow, control, iss)
│   └── unity/           # Protocolo de comunicación bidireccional con Unity
│       ├── UnityBridge.ts            # Puente singleton (SendMessage y eventos de ventana)
│       └── unityContracts.ts         # Contratos tipados de mensajes, telemetría y comandos
├── scene/               # Fachadas de compatibilidad y Canvas 3D principal (Scene.tsx)
├── simulation/          # Motor físico unificado
│   ├── engine.ts        # Reducer y ciclo físico en tiempo real (10 Hz)
│   ├── solarModel.ts    # Modelo fotovoltaico, irradiancia y balance de carga
│   ├── dustModel.ts     # Modelo electrodinámico EDS y atenuación por regolito
│   ├── roverModel.ts    # Cinemática de dirección, velocidad y límites de área
│   └── types.ts         # Definiciones de estado, acciones e interfaces
├── telemetry/           # Telemetría en tiempo real
│   └── telemetryEngine.ts # Proveedor Open MCT de 10 canales, buffer circular y CSV
├── components/          # Paneles de control e interfaz de usuario
│   ├── ModulePanel.tsx  # Paneles contextuales (Solar, Rover, Control de Vuelo DSN, ISS)
│   ├── NetworkPanel.tsx # Matriz de enlaces interactivos (energía e información)
│   ├── Telemetry.tsx    # Gráficos SVG y visor de eventos en vivo
│   ├── PitchDeck.tsx    # Modo presentación interactivo de la misión
│   └── ui/              # Componentes base (modales, controles, botones)
├── education/           # Contenidos pedagógicos
│   ├── lessons.ts       # Descubrimientos guiados
│   └── practices.ts     # Protocolos operativos
└── store/               # Estado compartido y persistencia
```

## 3. Integración y Comunicación con Unity (UnityBridge)
Para habilitar una interoperabilidad robusta con Unity (vía WebGL / Canvas embebido / postMessage):
- **Contratos tipados (`unityContracts.ts`)**: Especifican esquemas rígidos de mensajes (`UNITY_ROVER_TELEMETRY`, `UNITY_BASE_STATE`, `UNITY_FLIGHT_CONTROL`, `UNITY_ISS_STATE`, `UNITY_CAMERA_COMMAND`).
- **Puente Bidireccional (`UnityBridge.ts`)**: 
  - Expone `window.UnityBridge` y la función global `window.dispatchUnityMessage(json)`.
  - Envía comandos a Unity mediante `unityInstance.SendMessage(target, method, json)`.
  - Distribuye eventos en tiempo real entre los GameObjects de Three.js / React y Unity sin colisiones globales ni acoplamiento rígido.

## 4. Integración de Subsistemas Físicos
- **Generación Fotovoltaica y Batería**: Ecuación de Lambert-Beer para atenuación por polvo de regolito (\(P = P_0 \cdot \exp(-k \cdot \text{polvo})\)) y cálculo de ángulo de incidencia solar.
- **Limpieza EDS**: Ondas viajeras electrodinámicas de alta frecuencia que repelen partículas de polvo consumiendo potencia de la estación.
- **Cinemática del Rover**: Tracción de 4 ruedas con giro diferencial, acumulación de muestras geológicas a bordo y recarga por cable al retornar a la base.
- **Comunicaciones DSN**: Atenuación angular respecto al vector de enlace Tierra-Luna (~45° óptimo) con un umbral nominal del 65% para la transmisión de paquetes científicos.
- **Telemetría Open MCT**: 10 canales muestreados y almacenados en buffers circulares para análisis temporal y exportación de bitácoras de vuelo en formato CSV.
