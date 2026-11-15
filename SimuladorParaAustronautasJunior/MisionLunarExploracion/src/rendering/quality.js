export function setRenderQuality(renderer, sunLight, stars, quality) {
  let pixelRatio = 0.5;
  let shadowSize = 512;
  let starOpacity = 0.35;

  if (quality === 'medium') {
    pixelRatio = 1;
    shadowSize = 1024;
    starOpacity = 0.7;
  } else if (quality === 'high') {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    shadowSize = 2048;
    starOpacity = 1;
  }

  renderer.currentQuality = quality;
  renderer.shadowMap.enabled = quality !== 'low';
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  sunLight.castShadow = quality !== 'low';
  if (sunLight.shadow.mapSize.width !== shadowSize) {
    sunLight.shadow.mapSize.set(shadowSize, shadowSize);
    sunLight.shadow.map?.dispose();
    sunLight.shadow.map = null;
  }

  stars.material.opacity = starOpacity;
}
//TODO selezione automatica prestazioni (?) verificare come