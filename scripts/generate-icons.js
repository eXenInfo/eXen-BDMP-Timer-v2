/**
 * Generates PNG icons from the original source icon.
 * Source: public/icons/original-icon-512.png (from eXen-BDMP-Timer v1)
 * Run with: npm run icons
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcPath = path.join(__dirname, '../public/icons/original-icon-512.png')
const outDir  = path.join(__dirname, '../public/icons')

const icons = [
  { name: 'icon-32.png',  size: 32  },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

for (const { name, size } of icons) {
  await sharp(srcPath)
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, name))
  console.log(`✓ ${name} (${size}×${size})`)
}

// Maskable icon: design content must sit within the 80% safe zone.
// We shrink the logo to 80% and place it on a dark #111827 background.
const maskableSize = 512
const innerSize = Math.round(maskableSize * 0.8) // 410px
const pad = Math.floor((maskableSize - innerSize) / 2) // 51px each side

await sharp(srcPath)
  .resize(innerSize, innerSize)
  .extend({
    top: pad, bottom: maskableSize - innerSize - pad,
    left: pad, right: maskableSize - innerSize - pad,
    background: { r: 17, g: 24, b: 39, alpha: 1 }, // #111827
  })
  .png()
  .toFile(path.join(outDir, 'icon-512-maskable.png'))
console.log('✓ icon-512-maskable.png (512×512, maskable)')

console.log('\nAll icons generated.')
