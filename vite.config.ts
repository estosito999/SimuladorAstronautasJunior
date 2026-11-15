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

export default defineConfig({
  plugins: [react(), serveReposPlugin()],
  resolve: { dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'] },
  server: { fs: { allow: ['.', '..'] } },
  build: { rollupOptions: { output: { manualChunks: (id) => /node_modules[/\\](three|@react-three)[/\\]/.test(id) ? 'scene' : undefined } } },
})
