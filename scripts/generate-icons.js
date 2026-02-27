/**
 * Generates PNG icons from icon.svg in all required sizes.
 * Run with: npm run icons
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.join(__dirname, '../public/icons/icon.svg')
const outDir  = path.join(__dirname, '../public/icons')

const svgBuffer = fs.readFileSync(svgPath)

const icons = [
  { name: 'icon-32.png',  size: 32  },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

for (const { name, size } of icons) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, name))
  console.log(`✓ ${name} (${size}×${size})`)
}

// Maskable icon: SVG already fills canvas edge-to-edge with dark bg,
// design content is within 80 % safe zone — just use full 512 render.
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(path.join(outDir, 'icon-512-maskable.png'))
console.log('✓ icon-512-maskable.png (512×512, maskable)')

console.log('\nAll icons generated.')
