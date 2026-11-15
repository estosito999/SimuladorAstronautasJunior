# Simulador Espacial Unity 3D en SELENE

La tarjeta **Simulador Espacial Unity 3D** del Centro de Misiones abre el proyecto Unity en un visor integrado. El visor muestra disponibilidad, progreso de descarga, errores y reintento. La barra de SELENE permite volver al centro, abrir otra pestaña y usar pantalla completa.

## Estado comprobado el 15 de noviembre de 2026

El proyecto vecino `simulador espacial` declara Unity **6000.6.7f1**, revisión `b22767f04f04`. Unity Editor y Web Build Support están instalados en `C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\`. El Editor resolvió los paquetes y compiló el script C# de exportación.

Unity completó la exportación Web sobre una copia temporal de los archivos guardados del proyecto. Los cuatro artefactos están publicados en `public/unity/space-simulator/` e incluidos en `dist/unity/space-simulator/`. `unity:check` devuelve `manifestExists: true` e `issues: []`. Se comprobaron sus respuestas HTTP y la compilación del WebAssembly mediante V8. En Chrome se verificaron la apertura desde el catálogo, el estado **Simulador listo**, el menú original y el inicio de la partida con su introducción.

## Requisitos y compilación

1. Comprueba que Unity **6000.6.7f1** tenga **Web Build Support**, denominado WebGL Build Support en algunas versiones del Hub. Ambos están instalados en este equipo. Para preparar otro equipo, añade el módulo mediante Unity Hub o el navegador de plataformas de Build Profiles y reinicia el Editor. [Plataformas de Unity 6000.6](https://docs.unity.com/en-us/engine/6000.6/manual/building-and-publishing/build-settings/platform-browser-reference)
2. Activa la licencia correspondiente en el Editor y deja que el proyecto resuelva sus paquetes. Guarda los cambios que quieras incluir en la exportación. Cuando existe `Temp/UnityLockfile`, el comando copia `Assets`, `Packages` y `ProjectSettings` a un proyecto temporal y ejecuta allí la compilación. La copia usa el contenido guardado en disco.
3. Ejecuta los comandos siguientes desde SELENE.

```powershell
cd 'D:\hackathon\SimuladorParaAustronautasJunior'
npm run unity:check
npm run unity:build
npm run dev
```

Para solicitar una copia temporal también cuando el proyecto esté cerrado, usa `--isolated`.

```powershell
npm run unity:build -- --isolated
```

Si el Editor está instalado en otra ubicación, indica su ejecutable.

```powershell
npm run unity:check -- --editor 'D:\Unity\6000.6.7f1\Editor\Unity.exe'
npm run unity:build -- --editor 'D:\Unity\6000.6.7f1\Editor\Unity.exe'
```

El comando usa `Assets/Editor/SeleneWebBuild.cs`, genera los archivos Web en un directorio temporal e importa la exportación completa en `public/unity/space-simulator/`. El registro queda en `unity-web-build.log`. Si la compilación termina y falla la importación, el mensaje indica la ubicación conservada para reintentarla.

Las carpetas generadas y provisionales de Unity están excluidas del observador de Vite para evitar bloqueos al publicar en Windows. El importador reintenta brevemente los movimientos afectados por bloqueos transitorios y mantiene la restauración de la exportación anterior ante fallos.

`EstacionSelene.unity` contiene `LunarGameManager` y es la escena inicial de esta exportación. La versión actual tiene habilitada únicamente esa escena y mantiene `SampleScene.unity` desactivada. El exportador usa las escenas habilitadas mediante `BuildPlayerOptions.scenes`. Las opciones temporales de compresión se restauran al terminar.

## Importar una exportación existente

La carpeta debe contener `Build/` con el loader JavaScript, framework, datos y WebAssembly. Puede incluir `index.html`, `StreamingAssets/` y `selene-build.json`.

```powershell
npm run unity:import -- 'D:\Exportaciones\SpaceSimulator'
```

El importador reconoce nombres convencionales o hashes y archivos `.gz`, `.br`, `.unityweb` y sin compresión. Valida archivos obligatorios, contenido vacío, respuestas HTML y selecciones ambiguas antes de publicar. La sustitución usa una carpeta provisional y restaura la exportación anterior si falla la publicación.

La versión se obtiene de `selene-build.json`, el HTML o el loader cuando está disponible. Una versión conocida diferente de **6000.6.7f1** produce un error. Una versión desconocida queda registrada como `unityVersion: null` y requiere comprobar su procedencia. El exportador incluido escribe los metadatos de la versión y la escena inicial.

## Publicación web

```powershell
npm run build
npm run preview
```

Vite copia `public/unity/` a `dist/unity/`, por lo que la exportación debe importarse antes de construir la plataforma. Publica el contenido completo de `dist/`. La exportación Web de `public/unity/space-simulator/` está incluida en Git para que la versión publicada del juego esté disponible al clonar el repositorio. Después de actualizar el juego, regenera o importa esa exportación y añade sus archivos al siguiente commit.

El exportador incluido produce artefactos sin compresión para facilitar el uso de alojamiento estático. Vite sirve además exportaciones gzip y Brotli con `Content-Encoding` y los MIME correspondientes en desarrollo y preview. Para usar esas exportaciones comprimidas en otro servidor, configura las mismas cabeceras. Los archivos `.unityweb` utilizan el fallback de descompresión del loader de Unity. [Publicación Web de Unity 6000.6](https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/building-distribution/deploying)

Sirve el proyecto mediante HTTP o HTTPS. El navegador debe admitir WebGL 2 y WebAssembly. El proyecto actual tiene desactivados los hilos WebGL. Las exportaciones multihilo requieren configurar aislamiento entre orígenes en el alojamiento. [Compatibilidad de navegadores](https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/intro/browsercompatibility)

## Integración y controles

`UnitySimulator.tsx` comprueba el manifiesto, abre `unity/player.html` y recibe los eventos de progreso, inicio y error. El reproductor llama a `createUnityInstance` con los archivos publicados. Los mensajes se validan por origen y ventana emisora. Al salir se desmonta el documento del reproductor y se libera su runtime.

La versión actual de Unity guarda la campaña en `Application.persistentDataPath`. El reproductor activa `autoSyncPersistentDataPath` para sincronizar esos archivos con IndexedDB y recuperarlos al volver a abrir el juego desde el mismo origen del navegador.

El teclado y ratón se entregan al canvas de Unity. La simulación web de SELENE suspende sus controles y su avance mientras se abre una misión externa. El puente de telemetría existente tiene contratos para otros objetos y conserva su uso actual.

Queda pendiente validar los mandos PS4 en la exportación real. El script original `LunarControls.cs` filtra layouts que comienzan por `DualShock4`, mientras que Input System registra mandos de navegador como `WebGLGamepad`. El botón **Volver al Centro de Misiones** permite salir del visor. El botón **Salir** del juego usa `Application.Quit`, cuyo comportamiento depende de la plataforma Web.

## Verificación realizada

- `npm test` pasó con **55 pruebas** en seis archivos.
- `npm run build` pasó con TypeScript y producción Vite. Vite mantiene un aviso sobre el tamaño de un chunk de Three.js.
- **104 aserciones HTTP** pasaron entre desarrollo y preview, con las bases `/` y `/selene/`. Se comprobaron HTML, JavaScript, WebAssembly, gzip, Brotli, `.unityweb`, HEAD y respuestas 404.
- **37 aserciones del reproductor** pasaron con un runtime aislado de prueba. Cubren progreso, inicio, rutas relativas, archivos ausentes, falta de WebGL o WebAssembly, carga fallida y errores del runtime.
- El importador pasó comprobaciones con exportaciones temporales de prueba para variantes de compresión, nombres hash, metadatos, archivos incompletos, versiones incompatibles y conservación del destino ante fallos.
- `unity:check` detectó Unity **6000.6.7f1** y su módulo Web Build Support instalados.
- El Editor compiló `Assembly-CSharp-Editor.dll`, incluido `SeleneWebBuild.cs`, y completó la generación del build Web original desde una copia temporal.
- Los cuatro artefactos reales responden HTTP 200 con `Content-Length` correcto y el WASM recibe `application/wasm`. V8 compiló correctamente el módulo de 41.912.350 bytes.
- Se reimportó la exportación real con Vite activo para comprobar la corrección del bloqueo de carpetas en Windows.
- Los hashes SHA-256 de los **185 archivos originales de Assets** coinciden con la instantánea inicial. Las escenas, recursos y scripts jugables conservan sus contenidos.

La comprobación visual adicional se interrumpió cuando el usuario pulsó Escape para detener el control del equipo. Quedan pendientes las pruebas exhaustivas de mecánicas, mando PS4, pantalla completa y salida con nueva entrada. El menú original y la introducción de EstacionSelene se ejecutaron dentro de SELENE.
