import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { inspectUnityEnvironment, unityProject, webRoot } from './unity-environment.mjs'
import { importUnityBuild } from './import-unity-build.mjs'

async function main() {
  const arguments_ = process.argv.slice(2)
  const editorIndex = arguments_.indexOf('--editor')
  const allowed = new Set(['--check', '--editor', '--isolated'])
  for (let index = 0; index < arguments_.length; index++) {
    if (!allowed.has(arguments_[index])) throw new Error(`Argumento desconocido ${arguments_[index]}.`)
    if (arguments_[index] === '--editor' && !arguments_[++index]) throw new Error('Falta la ruta después de --editor.')
  }
  const environment = await inspectUnityEnvironment(editorIndex >= 0 ? arguments_[editorIndex + 1] : undefined)
  console.log(JSON.stringify(environment, null, 2))
  if (environment.issues.length) {
    throw new Error(environment.issues.join('\n'))
  }
  if (arguments_.includes('--check')) return
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'selene-unity-build-'))
  const exportDirectory = path.join(temporaryDirectory, 'SpaceSimulator')
  const logFile = path.join(webRoot, 'unity-web-build.log')
  let exportCompleted = false
  let published = false
  console.log(`Compilando Unity. Registro disponible en ${logFile}`)
  try {
    const projectIsOpen = await fs.access(path.join(unityProject, 'Temp/UnityLockfile')).then(() => true, () => false)
    let buildProject = unityProject
    if (projectIsOpen || arguments_.includes('--isolated')) {
      buildProject = path.join(temporaryDirectory, 'Project')
      console.log('Compilando una copia temporal de los archivos guardados del proyecto Unity.')
      for (const directory of ['Assets', 'Packages', 'ProjectSettings']) {
        await fs.cp(path.join(unityProject, directory), path.join(buildProject, directory), { recursive: true })
      }
    }
    await new Promise((resolve, reject) => {
      const child = spawn(environment.editor, [
        '-batchmode', '-quit', '-projectPath', buildProject,
        '-buildTarget', 'WebGL', '-executeMethod', 'SeleneWebBuild.Build',
        '-seleneOutputPath', exportDirectory, '-logFile', logFile,
      ], { stdio: 'inherit', windowsHide: true })
      child.once('error', reject)
      child.once('exit', (code, signal) => {
        if (code === 0) resolve()
        else reject(new Error(`Unity terminó con código ${code ?? signal}. Consulta ${logFile}.`))
      })
    })
    exportCompleted = true
    await importUnityBuild(exportDirectory, path.join(webRoot, 'public/unity/space-simulator'))
    published = true
    console.log('Exportación publicada en public/unity/space-simulator. Ejecuta npm run build para incluirla en dist.')
  } finally {
    if (exportCompleted && !published) {
      console.error(`La exportación se conserva en ${exportDirectory}. Reintenta con npm run unity:import -- "${exportDirectory}".`)
    } else {
      await fs.rm(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }).catch(error => {
        console.warn(`No se pudo limpiar el directorio temporal ${temporaryDirectory}. ${error.message}`)
      })
    }
  }
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
