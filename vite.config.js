import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/eXen-BDMP-Timer-v2/',
  plugins: [
    vue(),
    VitePWA({
      // 'prompt' statt 'autoUpdate': Eine neue Version wartet, bis der Nutzer
      // im Hinweis „Aktualisieren“ tippt. Mit 'autoUpdate' lud die App sich
      // selbst neu, sobald eine neue Version da war, auch mitten in einem Lauf,
      // und der Hinweis erschien nie.
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'eXen-BDMP-Timer',
        short_name: 'eXenTimer',
        description: 'Ein anpassbarer Timer für dynamische Schießdisziplinen.',
        theme_color: '#0b0d10',
        background_color: '#0b0d10',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})
