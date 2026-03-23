#!/usr/bin/env node
/**
 * Chrome Web Store "Verified CRX Uploads" workflow (Google docs):
 * https://developer.chrome.com/docs/webstore/update#protect-package-updates
 *
 * 1. generate — create keys/cws-private.pem (2048-bit RSA, PKCS#8 PEM)
 * 2. pubkey  — print the public key PEM to paste into Developer Dashboard → Package → Verified CRX Uploads
 * 3. pack    — run Chrome --pack-extension on ./dist with your private key (run `npm run build` first)
 */

import { spawnSync } from 'node:child_process'
import { createPublicKey, generateKeyPairSync } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const keysDir = join(root, 'keys')
const defaultPrivateKey = join(keysDir, 'cws-private.pem')
const distDir = join(root, 'dist')

function printHelp() {
  console.log(`
Chrome Web Store — verified CRX uploads

  node scripts/cws-verified-upload.mjs generate
      Create ${relative(root, defaultPrivateKey)} (do not commit; back it up offline).

  node scripts/cws-verified-upload.mjs pubkey
      Print the public key for the dashboard (after Opt In → paste PEM).

  node scripts/cws-verified-upload.mjs pack [path/to/cws-private.pem]
      Pack ${relative(root, distDir)} into a signed .crx using Chrome (set CHROME_PATH if needed).

  Or via npm: generate:cws-key | pubkey:cws | pack:cws | release:cws
`)
}

function relative(from, to) {
  const f = from.replace(/\\/g, '/')
  const t = to.replace(/\\/g, '/')
  if (t.startsWith(f)) return t.slice(f.length + 1)
  return t
}

function ensureKeysDir() {
  if (!existsSync(keysDir)) mkdirSync(keysDir, { recursive: true })
}

function cmdGenerate() {
  ensureKeysDir()
  if (existsSync(defaultPrivateKey)) {
    console.error(`Refusing to overwrite existing key: ${defaultPrivateKey}`)
    process.exit(1)
  }
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  // PKCS#8 PEM (same as openssl genpkey -algorithm RSA); Chrome --pack-extension-key accepts this
  const privPem =
    typeof privateKey === 'string' ? privateKey : privateKey.toString()
  writeFileSync(defaultPrivateKey, privPem, { mode: 0o600 })
  console.log(`Wrote private key: ${defaultPrivateKey}`)
  console.log(
    'Next: run npm run pubkey:cws and paste the output into Verified CRX Uploads.',
  )
}

function cmdPubkey(keyPath = defaultPrivateKey) {
  const resolved = resolve(keyPath)
  if (!existsSync(resolved)) {
    console.error(`Missing private key: ${resolved}`)
    process.exit(1)
  }
  const pem = readFileSync(resolved, 'utf8')
  const pub = createPublicKey(pem).export({ type: 'spki', format: 'pem' })
  process.stdout.write(typeof pub === 'string' ? pub : pub.toString())
}

function findChromeExecutable() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH
  }
  const { platform, env } = process
  const candidates = []
  if (platform === 'win32') {
    const pf = env['PROGRAMFILES'] || 'C:\\Program Files'
    const pf86 = env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'
    const local = env.LOCALAPPDATA || ''
    candidates.push(
      join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    )
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    )
  } else {
    candidates.push('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser')
  }
  for (const c of candidates) {
    if (c.includes('/') || c.includes('\\')) {
      if (existsSync(c)) return c
    } else {
      const r = spawnSync('which', [c], { encoding: 'utf8' })
      if (r.status === 0 && r.stdout.trim()) return r.stdout.trim()
    }
  }
  return null
}

function cmdPack(keyPath = defaultPrivateKey) {
  const resolvedKey = resolve(keyPath)
  if (!existsSync(resolvedKey)) {
    console.error(`Missing private key: ${resolvedKey}`)
    process.exit(1)
  }
  if (!existsSync(join(distDir, 'manifest.json'))) {
    console.error(
      `No built extension at ${distDir}. Run "npm run build" first.`,
    )
    process.exit(1)
  }
  const chrome = findChromeExecutable()
  if (!chrome) {
    console.error(
      'Could not find Chrome. Set CHROME_PATH to the full path of chrome.exe (or Google Chrome on macOS).',
    )
    process.exit(1)
  }
  const extRoot = resolve(distDir)
  const args = [
    `--pack-extension=${extRoot}`,
    `--pack-extension-key=${resolvedKey}`,
  ]
  const parent = dirname(extRoot)
  const folderName = extRoot.split(/[/\\]/).pop()
  const expectedCrx = join(parent, `${folderName}.crx`)

  const result = spawnSync(chrome, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.status !== 0) {
    console.error(`Chrome exited with code ${result.status ?? 'unknown'}`)
    process.exit(result.status ?? 1)
  }

  if (existsSync(expectedCrx)) {
    const out = join(root, 'barcode-studio.crx')
    if (existsSync(out)) unlinkSync(out)
    renameSync(expectedCrx, out)
    console.log(`Signed CRX: ${out}`)
    return
  }
  // Fallback: find newest *.crx in parent
  try {
    const crx = readdirSync(parent)
      .filter((f) => f.endsWith('.crx'))
      .map((f) => join(parent, f))
      .filter((p) => existsSync(p))
    let newest = null
    let newestM = 0
    for (const p of crx) {
      const m = statSync(p).mtimeMs
      if (m > newestM) {
        newestM = m
        newest = p
      }
    }
    if (newest) {
      const out = join(root, 'barcode-studio.crx')
      if (existsSync(out)) unlinkSync(out)
      renameSync(newest, out)
      console.log(`Signed CRX: ${out}`)
      return
    }
  } catch {
    /* ignore */
  }
  console.error(
    'Pack finished but could not find the output .crx next to the extension folder. Check the parent of dist/.',
  )
  process.exit(1)
}

const cmd = process.argv[2]
const keyArg = process.argv[3]

if (cmd === 'generate') {
  cmdGenerate()
} else if (cmd === 'pubkey') {
  cmdPubkey(keyArg)
} else if (cmd === 'pack') {
  cmdPack(keyArg)
} else {
  printHelp()
  process.exit(cmd ? 1 : 0)
}
