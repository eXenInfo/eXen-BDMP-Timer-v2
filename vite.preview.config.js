import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: 'preview',
  base: './',
  plugins: [vue(), viteSingleFile()],
  resolve: {
    alias: { 'virtual:pwa-register/vue': fileURLToPath(new URL('./preview/pwa-stub.js', import.meta.url)) },
  },
  build: { outDir: '../dist-preview', emptyOutDir: true, assetsInlineLimit: 100000000 },
})
