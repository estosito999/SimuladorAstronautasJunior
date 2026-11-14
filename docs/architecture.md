# Arquitectura Técnica del Simulador Educativo Lunar 3D

## 1. Visión General
**SimuladorParaAstronautasJunior** es una aplicación educativa web 3D interactiva para niños de 7 a 12 años, construida con React 19, TypeScript, Three.js y React Three Fiber 9. Consolida en una sola escena y un único motor de simulación los modelos físicos, cinemáticos y de telemetría provenientes de 4 proyectos espaciales de referencia.

## 2. Estructura Unificada de Módulos
```
src/
├── scene/               # Entorno lunar 3D y modelos Three.js / R3F
│   ├── Scene.tsx        # Canvas 3D principal y gestión de render
│   ├── Environment.tsx  # Terreno lunar, iluminación solar, estrellas y Tierra
│   ├── Equipment.tsx    # Células solares con capa de polvo, rover, antena y base
│   ├── CameraRig.tsx    # Control orbital y modo seguimiento del rover
│   ├── roverModel.ts    # Geometría y articulaciones del vehículo lunar
│   └── terrain.ts       # Generador procedural determinista de relieve lunar
├── simulation/          # Motor físico unificado
│   ├── engine.ts        # Reducer y ciclo físico en tiempo real (10 Hz)
│   ├── solarModel.ts    # Modelo fotovoltaico, irradiancia y balance de carga
│   ├── dustModel.ts     # Modelo electrodinámico EDS y atenuación por regolito
│   ├── roverModel.ts    # Cinemática de dirección, velocidad y límites de área
│   └── types.ts         # Definiciones de estado, acciones e interfaces
├── telemetry/           # Telemetría en tiempo real
│   └── telemetryEngine.ts # Proveedor Open MCT de 10 canales, buffer circular y CSV
├── components/          # Paneles de control e interfaz de usuario
│   ├── ModulePanel.tsx  # Paneles contextuales (Solar, Rover, Comunicaciones)
│   ├── NetworkPanel.tsx # Matriz de enlaces interactivos (energía e información)
│   ├── Telemetry.tsx    # Gráficos SVG y visor de eventos en vivo
│   ├── PitchDeck.tsx    # Modo presentación interactivo de la misión
│   └── ui/              # Componentes base (modales, controles, botones)
├── education/           # Contenidos pedagógicos
│   ├── lessons.ts       # Descubrimientos guiados
│   └── practices.ts     # Protocolos operativos
└── store/               # Estado compartido y persistencia
```

## 3. Integración de Subsistemas Físicos
- **Generación Fotovoltaica y Batería**: Ecuación de Lambert-Beer para atenuación por polvo de regolito (\(P = P_0 \cdot \exp(-k \cdot \text{polvo})\)) y cálculo de ángulo de incidencia solar.
- **Limpieza EDS**: Ondas viajeras electrodinámicas de alta frecuencia que repelen partículas de polvo consumiendo potencia de la estación.
- **Cinemática del Rover**: Tracción de 4 ruedas con giro diferencial, acumulación de muestras geológicas a bordo y recarga por cable al retornar a la base.
- **Comunicaciones DSN**: Atenuación angular respecto al vector de enlace Tierra-Luna (~45° óptimo) con un umbral nominal del 65% para la transmisión de paquetes científicos.
- **Telemetría Open MCT**: 10 canales muestreados y almacenados en buffers circulares para análisis temporal y exportación de bitácoras de vuelo en formato CSV.
