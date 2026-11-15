import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.gltf': 'model/gltf+json',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
}

function serveReposMiddleware(req: any, res: any, next: any) {
  const rawUrl = req.url || ''
  const url = rawUrl.split('?')[0]
  const cwd = process.cwd()
  const repos = ['Dust-Shield', 'final-project-Lunar-E', 'ZERO-G-Junior-Astronaut-Trainer', 'openmct']
  const matched = repos.find(r => url === `/${r}` || url.startsWith(`/${r}/`))
  
  if (matched) {
    if (url === `/${matched}`) {
      res.statusCode = 302
      res.setHeader('Location', `/${matched}/` + (rawUrl.includes('?') ? '?' + rawUrl.split('?')[1] : ''))
      return res.end()
    }

    let sub = url.slice(1)
    if (url === `/${matched}/`) {
      sub = `${matched}/index.html`
    }
    const folderAliases: Record<string, string[]> = {
      'Dust-Shield': ['Dust-Shield', 'EscudoMatricesSolares'],
      'final-project-Lunar-E': ['final-project-Lunar-E', 'MisionLunarExploracion'],
      'ZERO-G-Junior-Astronaut-Trainer': ['ZERO-G-Junior-Astronaut-Trainer', 'AsentamientosPlanetarios/dist', 'AsentamientosPlanetarios'],
      'openmct': ['openmct', 'EstacionDeControlInternacionalOdelaLuna/dist', 'EstacionDeControlInternacionalOdelaLuna']
    }
    const aliases = folderAliases[matched] || [matched]
    const subPathWithoutRepo = sub.slice(matched.length).replace(/^[/\\]+/, '') || 'index.html'

    const candidates: string[] = []
    for (const alias of aliases) {
      candidates.push(path.resolve(cwd, alias, subPathWithoutRepo))
      candidates.push(path.resolve(cwd, '..', alias, subPathWithoutRepo))
    }
    candidates.push(path.resolve(cwd, sub))
    candidates.push(path.resolve(cwd, '..', sub))

    for (const diskPath of candidates) {
      if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
        const ext = path.extname(diskPath).toLowerCase()
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return fs.createReadStream(diskPath).pipe(res)
      }
    }
  }

  // Fallback para assets con ruta raíz solicitados por bundles (p. ej. /assets/...)
  if (url.startsWith('/assets/')) {
    const assetSub = url.replace(/^\/assets\//, '')
    const assetCandidates = [
      path.resolve(cwd, 'AsentamientosPlanetarios/dist/assets', assetSub),
      path.resolve(cwd, 'AsentamientosPlanetarios/assets', assetSub),
      path.resolve(cwd, '..', 'ZERO-G-Junior-Astronaut-Trainer/dist/assets', assetSub),
      path.resolve(cwd, '..', 'ZERO-G-Junior-Astronaut-Trainer/assets', assetSub)
    ]
    for (const diskPath of assetCandidates) {
      if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
        const ext = path.extname(diskPath).toLowerCase()
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return fs.createReadStream(diskPath).pipe(res)
      }
    }
  }

  next()
}

function serveReposPlugin(): Plugin {
  return {
    name: 'serve-local-repos',
    configureServer(server) {
      server.middlewares.use(serveReposMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveReposMiddleware)
    },
  }
}

function unityWebPlugin(): Plugin {
  // Register before Vite's SPA fallback so missing binaries return an actual 404.
  function middleware(root: string, base: string) {
    const prefix = `${base.replace(/\/$/, '')}/unity/`
    return (req: any, res: any, next: any) => {
      let pathname: string
      try {
        pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname)
      } catch {
        res.statusCode = 400
        return res.end('Invalid URL')
      }
      if (!pathname.startsWith(prefix)) return next()
      const diskPath = path.resolve(root, pathname.slice(prefix.length))
      const relative = path.relative(root, diskPath)
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.statusCode = 403
        return res.end('Forbidden')
      }
      const fileStat = fs.existsSync(diskPath) ? fs.statSync(diskPath) : null
      if (!fileStat?.isFile()) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        return res.end('Unity Web artifact missing')
      }
      const compression = /\.(gz|br)$/.exec(diskPath)?.[1]
      const extension = path.extname(compression ? diskPath.slice(0, -compression.length - 1) : diskPath).toLowerCase()
      res.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream')
      res.setHeader('Content-Length', fileStat.size)
      res.setHeader('Cache-Control', 'no-cache')
      if (compression) res.setHeader('Content-Encoding', compression === 'gz' ? 'gzip' : 'br')
      if (req.method === 'HEAD') return res.end()
      const stream = fs.createReadStream(diskPath)
      stream.on('error', () => res.destroy())
      stream.pipe(res)
    }
  }
  return {
    name: 'unity-web-artifacts',
    configureServer(server) {
      server.middlewares.use(middleware(path.resolve(server.config.publicDir, 'unity'), server.config.base))
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(path.resolve(server.config.root, server.config.build.outDir, 'unity'), server.config.base))
    },
  }
}

export default defineConfig({
  plugins: [react(), unityWebPlugin(), serveReposPlugin()],
  resolve: { dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'] },
  optimizeDeps: { entries: ['index.html'] },
  server: {
    fs: { allow: ['.', '..'] },
    watch: { ignored: [/[/\\]unity[/\\](?:space-simulator|\.space-simulator-[^/\\]+)(?:[/\\]|$)/] },
  },
  build: { rollupOptions: { output: { manualChunks: (id) => /node_modules[/\\](three|@react-three)[/\\]/.test(id) ? 'scene' : undefined } } },
})
