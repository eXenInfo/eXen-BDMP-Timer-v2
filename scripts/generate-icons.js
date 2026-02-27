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

// Maskable icon: use full-size original so the logo fills the entire
// circular/squircle crop — no padding that would create a "square in circle" look.
await sharp(srcPath)
  .resize(512, 512)
  .png()
  .toFile(path.join(outDir, 'icon-512-maskable.png'))
console.log('✓ icon-512-maskable.png (512×512, maskable)')

console.log('\nAll icons generated.')
