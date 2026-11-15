# Modelos 3D

El prototipo construye los equipos con geometrías de Three.js en `src/scene/equipment/`. No necesita descargar modelos para funcionar.

Esta carpeta queda preparada para futuros archivos `.glb` o `.gltf` propios o con una licencia compatible. Para incorporar uno:

1. Exporta desde Blender con el eje vertical Y, escala aplicada y materiales sencillos.
2. Optimiza la cantidad de polígonos y el tamaño de las texturas. Un solo `.glb` facilita la distribución.
3. Guarda el archivo aquí y cárgalo con `useGLTF('/assets/models/nombre.glb')`, de React Three Drei.
4. Sustituye la geometría dentro del componente del equipo conservando su posición, selección, resaltado y respuesta al estado de la simulación.
5. Comprueba el modelo con la cámara orbital, la vista de inspección y una computadora escolar.

Conserva los créditos y licencias de cualquier recurso de terceros. No se incluyen modelos de videojuegos ni recursos de la NASA en esta versión.
