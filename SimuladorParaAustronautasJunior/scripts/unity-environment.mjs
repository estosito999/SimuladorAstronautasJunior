import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const unityProject = path.resolve(webRoot, '..', 'simulador espacial')

async function exists(filePath) {
  return fs.access(filePath).then(() => true, () => false)
}

export async function inspectUnityEnvironment(editorOverride) {
  const projectVersion = await fs.readFile(path.join(unityProject, 'ProjectSettings/ProjectVersion.txt'), 'utf8')
  const version = projectVersion.match(/^m_EditorVersion:\s*(\S+)/m)?.[1]
  if (!version) throw new Error('No se pudo leer la versión del proyecto Unity.')
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files'
  const hubRoots = [
    path.join(programFiles, 'Unity/Hub/Editor'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Unity/Hub/Editor'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', 'Unity/Hub/Editor'),
    '/Applications/Unity/Hub/Editor',
  ]
  const candidates = [editorOverride, process.env.UNITY_EDITOR_PATH]
  for (const root of hubRoots) {
    candidates.push(path.join(root, version, 'Editor/Unity.exe'))
    candidates.push(path.join(root, version, 'Editor/Unity'))
    candidates.push(path.join(root, version, 'Unity.app/Contents/MacOS/Unity'))
  }
  let editor = null
  for (const candidate of candidates.filter(Boolean)) {
    if (await exists(candidate)) {
      editor = path.resolve(candidate)
      break
    }
  }
  const editorDirectory = editor ? path.dirname(editor) : null
  const moduleCandidates = editorDirectory ? [
    path.join(editorDirectory, 'Data/PlaybackEngines/WebGLSupport'),
    path.resolve(editorDirectory, '../PlaybackEngines/WebGLSupport'),
  ] : []
  let webSupport = null
  for (const directory of moduleCandidates) {
    if (await exists(path.join(directory, 'UnityEditor.WebGL.Extensions.dll')) &&
        await exists(path.join(directory, 'BuildTools'))) {
      webSupport = directory
      break
    }
  }
  const manifestPath = path.join(webRoot, 'public/unity/space-simulator/manifest.json')
  const issues = []
  if (!editor) issues.push(`No se encontró Unity ${version}. Instala esa versión con Unity Hub o indica --editor "ruta/Editor/Unity.exe".`)
  if (editor && !webSupport) issues.push(`Falta Web Build Support en ${editorDirectory}. Añade el módulo para Unity ${version} desde Unity Hub.`)
  return {
    version,
    projectPath: unityProject,
    editor,
    webSupport,
    manifestExists: await exists(manifestPath),
    issues,
  }
}
