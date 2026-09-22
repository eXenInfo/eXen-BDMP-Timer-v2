import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  root: 'preview',
  base: './',
  plugins: [vue(), viteSingleFile()],
  build: { outDir: '../dist-preview', emptyOutDir: true, assetsInlineLimit: 100000000 },
})
