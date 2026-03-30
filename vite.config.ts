import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist')
        mkdirSync(distDir, { recursive: true })
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json'),
        )
        // Copy _locales for chrome.i18n support
        const localesDir = resolve(__dirname, '_locales')
        if (existsSync(localesDir)) {
          for (const lang of readdirSync(localesDir)) {
            const src = resolve(localesDir, lang, 'messages.json')
            const destDir = resolve(distDir, '_locales', lang)
            mkdirSync(destDir, { recursive: true })
            copyFileSync(src, resolve(destDir, 'messages.json'))
          }
        }
      },
    },
  ],
  resolve: {
    alias: { '@shared': resolve(__dirname, 'src/shared') },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  test: {
    environment: 'node',
  },
})
