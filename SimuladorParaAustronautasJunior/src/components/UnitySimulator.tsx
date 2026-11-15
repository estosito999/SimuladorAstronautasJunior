import { useEffect, useRef, useState } from 'react'
import { Rocket, RotateCcw } from 'lucide-react'
import './unitySimulator.css'

type PlayerStatus = 'checking' | 'loading' | 'ready' | 'missing' | 'error'

function isUnityManifest(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const manifest = value as Record<string, unknown>
  return manifest.schemaVersion === 1 &&
    ['loaderUrl', 'dataUrl', 'frameworkUrl', 'codeUrl'].every(key => typeof manifest[key] === 'string' && manifest[key] !== '')
}

export default function UnitySimulator() {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<PlayerStatus>('checking')
  const [progress, setProgress] = useState(0)
  const [slowLoading, setSlowLoading] = useState(false)
  const [error, setError] = useState('')
  const frameRef = useRef<HTMLIFrameElement>(null)
  const manifestUrl = `${import.meta.env.BASE_URL}unity/space-simulator/manifest.json`
  const playerUrl = `${import.meta.env.BASE_URL}unity/player.html`

  useEffect(() => {
    const controller = new AbortController()
    const timeoutSignal = AbortSignal.timeout(30_000)
    const requestSignal = AbortSignal.any([controller.signal, timeoutSignal])
    setStatus('checking')
    setProgress(0)
    setError('')

    async function checkBuild() {
      try {
        const response = await fetch(manifestUrl, { signal: requestSignal, cache: 'no-store' })
        if (response.status === 404) {
          if (!controller.signal.aborted) setStatus('missing')
          return
        }
        if (!response.ok) throw new Error('No se pudo comprobar la disponibilidad del simulador.')
        // Vite can return the application HTML for an absent public file.
        if (!response.headers.get('content-type')?.includes('application/json')) {
          if (!controller.signal.aborted) setStatus('missing')
          return
        }
        const manifest: unknown = await response.json()
        if (!isUnityManifest(manifest)) throw new Error('La compilación Web de Unity está incompleta. Vuelve a publicarla en SELENE.')
        if (!controller.signal.aborted) setStatus('loading')
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(timeoutSignal.aborted
          ? 'La comprobación del simulador superó los 30 segundos. Comprueba tu conexión y vuelve a intentarlo.'
          : cause instanceof Error ? cause.message : 'No se pudo cargar el simulador.')
        setStatus('error')
      }
    }

    void checkBuild()
    return () => controller.abort()
  }, [attempt, manifestUrl])

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return
      const message: unknown = event.data
      if (!message || typeof message !== 'object') return
      const data = message as Record<string, unknown>
      if (data.source !== 'selene-unity') return

      if (data.type === 'progress' && typeof data.progress === 'number' && Number.isFinite(data.progress)) {
        setProgress(Math.min(1, Math.max(0, data.progress)))
      } else if (data.type === 'ready') {
        setProgress(1)
        setStatus('ready')
        frameRef.current?.focus()
      } else if (data.type === 'error') {
        setError(typeof data.message === 'string' ? data.message : 'Unity no pudo iniciar el simulador.')
        setStatus('error')
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])

  useEffect(() => {
    setSlowLoading(false)
    if (status !== 'loading') return
    const timeout = window.setTimeout(() => {
      setSlowLoading(true)
    }, 120_000)
    return () => window.clearTimeout(timeout)
  }, [status, progress, attempt])

  const retry = () => {
    setStatus('checking')
    setSlowLoading(false)
    setAttempt(value => value + 1)
  }

  const loading = status === 'checking' || status === 'loading'
  const showFrame = status === 'loading' || status === 'ready'

  return (
    <section className="unity-simulator" aria-label="Simulador Espacial Unity 3D" aria-busy={loading}>
      {showFrame && (
        <iframe
          key={attempt}
          ref={frameRef}
          src={playerUrl}
          title="Simulador Espacial Unity 3D"
          className="mission-iframe unity-simulator-frame"
          allow="fullscreen; autoplay; gamepad"
          allowFullScreen
          onError={() => {
            setError('No se pudo abrir el visor de Unity. Vuelve a intentarlo.')
            setStatus('error')
          }}
        />
      )}
      {status === 'ready' ? (
        <span className="unity-simulator-status" role="status">Simulador listo</span>
      ) : (
        <div className="unity-simulator-overlay">
          <div className="unity-simulator-message" role={status === 'error' ? 'alert' : 'status'} aria-live="polite">
            <Rocket size={34} aria-hidden="true" />
            <h2>{status === 'missing' ? 'La compilación Web está pendiente' : status === 'error' ? 'No se pudo iniciar Unity' : 'Preparando el simulador'}</h2>
            {loading ? <>
              <p>{status === 'checking' ? 'Comprobando la disponibilidad del proyecto de Unity…' : `Cargando el simulador ${Math.round(progress * 100)} %`}</p>
              <progress max={1} value={progress} aria-label="Carga del simulador Unity" />
              {slowLoading && <p>La carga lleva dos minutos sin avanzar. Puedes seguir esperando o volver a intentarlo.</p>}
            </> : (
              <p>{status === 'missing' ? 'Este simulador necesita su compilación Web de Unity. El administrador de SELENE debe generar o importar esa compilación para habilitarlo.' : error}</p>
            )}
            {(!loading || slowLoading) && (
              <button type="button" className="back-button" onClick={retry}>
                <RotateCcw size={16} aria-hidden="true" />
                Volver a intentar
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
