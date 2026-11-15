import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createSceneContext() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050816);

  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#scene'),
    powerPreference: 'high-performance',
    logarithmicDepthBuffer: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(0.5);
  renderer.currentQuality = 'low';
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );
  camera.position.set(12, 9, 16);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.minDistance = 2.5;
  controls.maxDistance = 3500;
  controls.zoomSpeed = 0.25;
  controls.rotateSpeed = 0.58;
  controls.minPolarAngle = 0.01;
  controls.maxPolarAngle = Math.PI - 0.01;
  controls.enablePan = false;
  controls.screenSpacePanning = false;

  setupMouse(renderer.domElement, controls);
  controls.update();
  return { scene, renderer, camera, controls };
}

export function setupResizeHandler(camera, renderer) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function setupMouse(element, controls) {
  controls.roverOrbitPointerDelta = { x: 0, y: 0 };
  controls.roverZoom = 0;

  element.addEventListener('wheel', (event) => {
    if (controls.enabled) return;
    event.preventDefault();
    controls.roverZoom += Math.sign(event.deltaY) * 0.08;
  }, { passive: false });

  let pointer = null;

  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || controls.enableRotate || controls.followingRover) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    element.setPointerCapture?.(event.pointerId);
  });

  element.addEventListener('pointermove', (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;

    controls.roverOrbitPointerDelta.x += event.clientX - pointer.x;
    controls.roverOrbitPointerDelta.y += event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  function stopPointer(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (element.hasPointerCapture?.(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
    pointer = null;
  }

  element.addEventListener('pointerup', stopPointer);
  element.addEventListener('pointercancel', stopPointer);
}
