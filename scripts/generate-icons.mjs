/**
 * Rasterize public/icons/barcode.svg → PNGs for Chrome manifest (16/32/48/128).
 * Run: node scripts/generate-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'public', 'icons', 'barcode.svg')
const outDir = path.join(root, 'public', 'icons')

const sizes = [16, 32, 48, 128]

if (!fs.existsSync(svgPath)) {
  console.error('Missing:', svgPath)
  process.exit(1)
}

const svg = fs.readFileSync(svgPath)

for (const size of sizes) {
  const out = path.join(outDir, `barcode-${size}.png`)
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log('Wrote', path.relative(root, out))
}
