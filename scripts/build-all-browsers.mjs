#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const distDir = join(root, 'dist')
const outRoot = join(root, 'builds')

function fail(message) {
  console.error(message)
  process.exit(1)
}

function copyDir(from, to) {
  if (existsSync(to)) rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  cpSync(from, to, { recursive: true })
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

if (!existsSync(join(distDir, 'manifest.json'))) {
  fail(`Missing build output at ${distDir}. Run "npm run build" first.`)
}

if (existsSync(outRoot)) rmSync(outRoot, { recursive: true, force: true })
mkdirSync(outRoot, { recursive: true })

const chromeDir = join(outRoot, 'chrome')
const firefoxDir = join(outRoot, 'firefox')
const operaDir = join(outRoot, 'opera')

copyDir(distDir, chromeDir)
copyDir(distDir, firefoxDir)
copyDir(distDir, operaDir)

// Firefox: AMO requires background.scripts alongside background.service_worker
// (Firefox uses scripts; Chrome/Opera use service_worker — see MDN "background").
const firefoxManifestPath = join(firefoxDir, 'manifest.json')
const firefoxManifest = readJson(firefoxManifestPath)
firefoxManifest.browser_specific_settings = {
  gecko: {
    id: 'barcode-studio@zfhassaan',
    strict_min_version: '121.0',
    // AMO (Nov 2025+): required for new submissions — see MDN browser_specific_settings
    data_collection_permissions: {
      required: ['none'],
    },
  },
}
const bg = firefoxManifest.background
const sw = bg && typeof bg.service_worker === 'string' ? bg.service_worker : ''
if (sw) {
  firefoxManifest.background = {
    ...bg,
    scripts: Array.isArray(bg.scripts) && bg.scripts.length ? bg.scripts : [sw],
  }
}
writeJson(firefoxManifestPath, firefoxManifest)

const chromeManifest = readJson(join(chromeDir, 'manifest.json'))
const operaManifestPath = join(operaDir, 'manifest.json')
const operaManifest = readJson(operaManifestPath)
operaManifest.name = chromeManifest.name
operaManifest.version = chromeManifest.version
writeJson(operaManifestPath, operaManifest)

console.log('Built browser extension packages:')
console.log(`- Chrome:  ${resolve(chromeDir)}`)
console.log(`- Firefox: ${resolve(firefoxDir)}`)
console.log(`- Opera:   ${resolve(operaDir)}`)
