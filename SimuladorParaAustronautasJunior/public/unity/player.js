/* Unity runs in its own document so its input handlers and runtime leave with the iframe. */
(() => {
  const canvas = document.getElementById('unity-canvas')
  const status = document.getElementById('status')
  let failed = false

  function send(type, details = {}) {
    if (window.parent !== window) {
      window.parent.postMessage({ source: 'selene-unity', type, ...details }, window.location.origin)
    }
  }

  function fail(reason) {
    if (failed) return
    failed = true
    const message = reason instanceof Error ? reason.message : String(reason)
    status.textContent = message
    status.hidden = false
    send('error', { message })
  }

  function assetUrl(value, manifestUrl) {
    if (typeof value !== 'string' || !value) throw new Error('El manifiesto de Unity contiene una ruta vacía.')
    const resolved = new URL(value, manifestUrl)
    if (resolved.origin !== window.location.origin || !resolved.pathname.startsWith(new URL('.', manifestUrl).pathname)) {
      throw new Error('Los archivos de Unity deben estar dentro de su directorio de exportación.')
    }
    return resolved.href
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = url
      script.onload = resolve
      script.onerror = () => reject(new Error('No se pudo descargar el cargador de Unity. Comprueba la exportación Web.'))
      document.body.appendChild(script)
    })
  }

  async function start() {
    if (typeof WebAssembly !== 'object') throw new Error('Este navegador necesita soporte de WebAssembly para ejecutar Unity.')
    // Probe on a separate canvas so Unity can create its own context with its required options.
    const probe = document.createElement('canvas').getContext('webgl2')
    if (!probe) throw new Error('No se pudo crear WebGL 2. Comprueba la aceleración gráfica del navegador.')
    probe.getExtension('WEBGL_lose_context')?.loseContext()

    const manifestUrl = new URL('./space-simulator/manifest.json', window.location.href)
    const response = await fetch(manifestUrl, { cache: 'no-store', signal: AbortSignal.timeout(30000) })
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Falta una exportación Web de Unity válida. Ejecuta npm run unity:build desde SELENE.')
    }
    const manifest = await response.json()
    if (manifest.schemaVersion !== 1) throw new Error('La versión del manifiesto de Unity es incompatible.')
    const config = {
      companyName: manifest.companyName,
      productName: manifest.productName,
      productVersion: manifest.productVersion,
      matchWebGLToCanvasSize: true,
      showBanner(message, type) {
        if (type === 'error') fail(message)
        else console.warn('[Unity]', message)
      },
    }
    for (const key of ['dataUrl', 'frameworkUrl', 'codeUrl']) {
      config[key] = assetUrl(manifest[key], manifestUrl)
    }
    for (const key of ['streamingAssetsUrl', 'memoryUrl', 'symbolsUrl']) {
      if (manifest[key]) config[key] = assetUrl(manifest[key], manifestUrl)
    }
    await loadScript(assetUrl(manifest.loaderUrl, manifestUrl))
    if (typeof window.createUnityInstance !== 'function') throw new Error('El archivo cargado carece del runtime Web de Unity.')
    const instance = await window.createUnityInstance(canvas, config, value => {
      const progress = Math.max(0, Math.min(1, Number(value) || 0))
      status.textContent = `Cargando Unity… ${Math.round(progress * 100)} %`
      send('progress', { progress })
    })
    if (failed) {
      await instance.Quit()
      return
    }
    status.hidden = true
    canvas.focus()
    send('ready')
  }

  canvas.addEventListener('pointerdown', () => canvas.focus())
  window.addEventListener('error', event => fail(event.message || 'Ocurrió un error durante la ejecución de Unity.'))
  window.addEventListener('unhandledrejection', event => fail(event.reason || 'Falló la ejecución de Unity.'))
  start().catch(fail)
})()
