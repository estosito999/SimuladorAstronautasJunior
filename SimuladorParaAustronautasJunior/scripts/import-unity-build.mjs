import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { access, cp, lstat, mkdir, mkdtemp, open, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const repositoryDirectory = fileURLToPath(new URL('../', import.meta.url))
const defaultDestination = path.join(repositoryDirectory, 'public', 'unity', 'space-simulator')
const requiredUnityVersion = '6000.6.7f1'

const artifactPatterns = {
  loaderUrl: /\.loader\.js$/i,
  dataUrl: /\.data(?:\.(?:gz|br|unityweb))?$/i,
  frameworkUrl: /\.framework\.js(?:\.(?:gz|br|unityweb))?$/i,
  codeUrl: /\.wasm(?:\.(?:gz|br|unityweb))?$/i,
  memoryUrl: /\.mem(?:\.(?:gz|br|unityweb))?$/i,
  symbolsUrl: /\.symbols\.json(?:\.(?:gz|br|unityweb))?$/i,
}

function isWithin(parentDirectory, targetPath) {
  const relativePath = path.relative(parentDirectory, targetPath)
  return relativePath === '' || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath))
}

async function renameWithRetry(source, destination) {
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(source, destination)
      return
    } catch (error) {
      const transientWindowsError = process.platform === 'win32' && ['EPERM', 'EBUSY', 'EACCES'].includes(error.code)
      if (!transientWindowsError || attempt === 4) throw error
      await delay(150 * (attempt + 1))
    }
  }
}

function readLiteral(html, property) {
  const expression = new RegExp(`\\b${property}["']?\\s*[:=]\\s*(?:buildUrl\\s*\\+\\s*)?("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`)
  const literal = html.match(expression)?.[1]
  if (!literal) return undefined
  if (literal.startsWith('"')) return JSON.parse(literal)
  return literal.slice(1, -1).replace(/\\(u[0-9a-f]{4}|x[0-9a-f]{2}|[\\'"nrtbfv/])/gi, (_, escaped) => {
    if (escaped.startsWith('u') || escaped.startsWith('x')) return String.fromCharCode(Number.parseInt(escaped.slice(1), 16))
    return { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' }[escaped] ?? escaped
  })
}

function selectArtifact(files, property, html, required) {
  const matches = files.filter(file => artifactPatterns[property].test(file))
  if (matches.length === 0) {
    if (required) throw new Error(`Falta el artefacto Unity ${property} en la carpeta Build.`)
    return undefined
  }
  if (matches.length === 1) return matches[0]
  const reference = readLiteral(html, property)
  const referencedName = reference && path.posix.basename(reference.split(/[?#]/)[0])
  if (matches.includes(referencedName)) return referencedName
  throw new Error(`Hay varios artefactos para ${property}. Exporta a una carpeta limpia o conserva index.html con su referencia inequívoca.`)
}

async function validateArtifact(filePath, property) {
  const fileStat = await stat(filePath)
  if (!fileStat.isFile() || fileStat.size === 0) throw new Error(`El artefacto está vacío o no es un archivo: ${filePath}`)
  const file = await open(filePath, 'r')
  let header
  try {
    const buffer = Buffer.alloc(512)
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0)
    header = buffer.subarray(0, bytesRead)
  } finally {
    await file.close()
  }
  if (/^\s*(?:<!doctype\s+html|<html\b|<head\b|<body\b)/i.test(header.toString('utf8').replace(/^\uFEFF/, ''))) {
    throw new Error(`El artefacto contiene HTML en lugar de una compilación Unity: ${filePath}`)
  }
  if (filePath.endsWith('.gz') && (header[0] !== 0x1f || header[1] !== 0x8b)) {
    throw new Error(`El archivo .gz no contiene datos gzip: ${filePath}`)
  }
  if (property === 'codeUrl' && filePath.endsWith('.wasm') && !header.subarray(0, 4).equals(Buffer.from([0, 97, 115, 109]))) {
    throw new Error(`El archivo WebAssembly no tiene una cabecera válida: ${filePath}`)
  }
}

/** Copies an existing Unity Web export and publishes its manifest as one directory. */
export async function importUnityBuild(sourceDirectory, destinationDirectory = defaultDestination) {
  const source = await realpath(path.resolve(sourceDirectory))
  const requestedDestination = path.resolve(destinationDirectory)
  if (path.dirname(requestedDestination) === requestedDestination) throw new Error('El destino debe ser una carpeta de compilación, no la raíz del disco.')
  if (isWithin(source, requestedDestination) || isWithin(requestedDestination, source)) {
    throw new Error('La exportación de origen y el destino deben ser carpetas independientes.')
  }
  await mkdir(path.dirname(requestedDestination), { recursive: true })
  const parentDirectory = await realpath(path.dirname(requestedDestination))
  const destination = path.join(parentDirectory, path.basename(requestedDestination))
  if (isWithin(source, destination) || isWithin(destination, source)) {
    throw new Error('La exportación de origen y el destino resuelven a carpetas superpuestas.')
  }
  let destinationExists = false
  try {
    const destinationStat = await lstat(destination)
    if (destinationStat.isSymbolicLink() || !destinationStat.isDirectory()) throw new Error('El destino existente debe ser una carpeta de compilación.')
    destinationExists = true
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  const buildDirectory = path.join(source, 'Build')
  await access(buildDirectory, constants.R_OK)
  const files = (await readdir(buildDirectory, { withFileTypes: true })).filter(entry => entry.isFile()).map(entry => entry.name)
  let html = ''
  try {
    html = await readFile(path.join(source, 'index.html'), 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const selectedFiles = {}
  for (const property of Object.keys(artifactPatterns)) {
    const required = ['loaderUrl', 'dataUrl', 'frameworkUrl', 'codeUrl'].includes(property)
    const fileName = selectArtifact(files, property, html, required)
    if (fileName) selectedFiles[property] = fileName
  }

  let buildMetadata = {}
  try {
    buildMetadata = JSON.parse(await readFile(path.join(source, 'selene-build.json'), 'utf8'))
    if (!buildMetadata || typeof buildMetadata !== 'object' || Array.isArray(buildMetadata)) {
      throw new Error('selene-build.json debe contener un objeto con los metadatos de compilación.')
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const loaderSource = await readFile(path.join(buildDirectory, selectedFiles.loaderUrl), 'utf8')
  const detectedVersions = [buildMetadata.unityVersion, readLiteral(html, 'unityVersion'), readLiteral(loaderSource, 'unityVersion')]
    .filter(version => version !== undefined && version !== null)
  for (const version of detectedVersions) {
    if (version !== requiredUnityVersion) {
      throw new Error(`La exportación indica Unity ${String(version)}. Este proyecto requiere Unity ${requiredUnityVersion}.`)
    }
  }

  const manifest = {
    schemaVersion: 1,
    unityVersion: detectedVersions[0] ?? null,
    requiredUnityVersion,
    productName: readLiteral(html, 'productName') || 'simulador espacial',
    companyName: readLiteral(html, 'companyName') || 'DefaultCompany',
    productVersion: readLiteral(html, 'productVersion') || '1.0',
  }
  if (typeof buildMetadata.entryScene === 'string') manifest.entryScene = buildMetadata.entryScene
  for (const [property, fileName] of Object.entries(selectedFiles)) manifest[property] = `Build/${encodeURIComponent(fileName)}`

  const stagingDirectory = await mkdtemp(path.join(parentDirectory, `.${path.basename(destination)}-staging-`))
  const backupDirectory = path.join(parentDirectory, `.${path.basename(destination)}-backup-${randomUUID()}`)
  let backedUp = false
  let published = false
  try {
    await cp(buildDirectory, path.join(stagingDirectory, 'Build'), { recursive: true, dereference: true, errorOnExist: true, force: false })
    const streamingAssets = path.join(source, 'StreamingAssets')
    try {
      const streamingStat = await stat(streamingAssets)
      if (!streamingStat.isDirectory()) throw new Error('StreamingAssets debe ser una carpeta.')
      await cp(streamingAssets, path.join(stagingDirectory, 'StreamingAssets'), { recursive: true, dereference: true, errorOnExist: true, force: false })
      manifest.streamingAssetsUrl = 'StreamingAssets'
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    for (const [property, fileName] of Object.entries(selectedFiles)) {
      await validateArtifact(path.join(stagingDirectory, 'Build', fileName), property)
    }
    await writeFile(path.join(stagingDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    if (destinationExists) {
      await renameWithRetry(destination, backupDirectory)
      backedUp = true
    }
    try {
      await renameWithRetry(stagingDirectory, destination)
      published = true
    } catch (publishError) {
      if (backedUp) {
        try {
          await renameWithRetry(backupDirectory, destination)
          backedUp = false
        } catch (restoreError) {
          throw new AggregateError([publishError, restoreError], `No se pudo publicar ni restaurar el destino. La compilación anterior se conserva en ${backupDirectory}`)
        }
      }
      throw publishError
    }
    if (backedUp) await rm(backupDirectory, { recursive: true, force: true })
    return manifest
  } finally {
    if (!published) await rm(stagingDirectory, { recursive: true, force: true })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = process.argv[2]
  if (!sourceDirectory || sourceDirectory === '--help') {
    console.log('Uso: node scripts/import-unity-build.mjs <carpeta de exportación Web de Unity>')
    process.exitCode = sourceDirectory === '--help' ? 0 : 1
  } else {
    try {
      const manifest = await importUnityBuild(sourceDirectory)
      console.log(`Unity Web importado en ${defaultDestination}`)
      console.log(`${manifest.productName} · Unity ${manifest.unityVersion ?? 'con versión sin verificar'}`)
    } catch (error) {
      console.error(`No se pudo importar Unity Web. ${error.message}`)
      process.exitCode = 1
    }
  }
}
