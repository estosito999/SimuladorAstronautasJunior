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

function serveReposPlugin(): Plugin {
  return {
    name: 'serve-local-repos',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || ''
        const url = rawUrl.split('?')[0]
        const repos = ['Dust-Shield', 'final-project-Lunar-E', 'ZERO-G-Junior-Astronaut-Trainer', 'openmct']
        const matched = repos.find(r => url === `/${r}` || url.startsWith(`/${r}/`))
        if (matched) {
          let sub = url.slice(1)
          if (url === `/${matched}` || url === `/${matched}/`) {
            sub = `${matched}/index.html`
          }
          const cwd = process.cwd()
          const candidates = [
            path.resolve(cwd, '..', sub),
            path.resolve(cwd, sub)
          ]
          for (const diskPath of candidates) {
            if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
              const ext = path.extname(diskPath).toLowerCase()
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
              res.setHeader('Access-Control-Allow-Origin', '*')
              return fs.createReadStream(diskPath).pipe(res)
            }
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveReposPlugin()],
  resolve: { dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'] },
  server: { fs: { allow: ['.', '..'] } },
  build: { rollupOptions: { output: { manualChunks: (id) => /node_modules[/\\](three|@react-three)[/\\]/.test(id) ? 'scene' : undefined } } },
})
