# SELENE — Simulador Astronautas Junior

Este repositorio reúne la plataforma web SELENE y el proyecto original de Unity. El estudiante puede abrir **Simulador Espacial Unity 3D** desde el Centro de Misiones de SELENE y ejecutar el juego en su navegador.

| Carpeta | Contenido |
| --- | --- |
| `SimuladorParaAustronautasJunior/` | Plataforma React, TypeScript y Vite, con la compilación Web del simulador integrada |
| `simulador espacial/` | Fuentes y escenas originales del proyecto Unity 6000.6.7f1 |

## Ejecutar SELENE

Con Node.js 22.12 o posterior y Git LFS instalados, ejecuta los comandos siguientes desde la raíz del repositorio.

```powershell
git lfs pull
cd SimuladorParaAustronautasJunior
npm ci
npm run dev
```

Abre la dirección que muestre Vite. En el Centro de Misiones, selecciona **Simulador Espacial Unity 3D** y pulsa **Conectar y Abrir**.

La compilación Web está incluida en `SimuladorParaAustronautasJunior/public/unity/space-simulator/`. Puedes ejecutar esa versión desde SELENE después de instalar las dependencias web.

## Trabajar en Unity

Abre la carpeta `simulador espacial` desde Unity Hub con **Unity 6000.6.7f1**. La escena jugable es `Assets/Scenes/EstacionSelene.unity`.

Para regenerar la versión de navegador, instala **Web Build Support** para esa versión del Editor y ejecuta los comandos siguientes desde la carpeta web.

```powershell
npm run unity:check
npm run unity:build
npm run build
```

`npm test` comprueba la plataforma web y `npm run preview` sirve su compilación de producción.

Las instrucciones de exportación y los resultados de verificación están en la [guía Unity Web](SimuladorParaAustronautasJunior/docs/UNITY_WEB.md). La [documentación de SELENE](SimuladorParaAustronautasJunior/README.md) describe sus otras misiones e integraciones.

## Git

La raíz Git contiene ambas carpetas. Unity regenera `Library`, `Temp`, `Logs` y los archivos del IDE. Las dependencias `node_modules` y las carpetas `dist` se generan localmente. Los modelos GLB ya gestionados mediante Git LFS conservan esa configuración.
