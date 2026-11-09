import { fileURLToPath, URL } from 'node:url'
import { join } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const adaptadorIconosWeb = fileURLToPath(
  new URL('./src/lib/create-icon-web.ts', import.meta.url),
)
const raizReicon = fileURLToPath(
  new URL('./node_modules/reicon-react-native', import.meta.url),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'RIBANI — Seguimiento de adultos mayores',
        short_name: 'RIBANI',
        description: 'Seguimiento y cuidado de adultos mayores.',
        lang: 'es',
        start_url: '/panel',
        scope: '/',
        display: 'standalone',
        theme_color: '#02542d',
        background_color: '#f6f8f6',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        // Solo la interfaz local: HTTP, SSE, mapas y fuentes externas usan red.
        runtimeCaching: [],
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [
          /^\/(?:\?|$)/,
          /^\/(?:login|panel|admin)(?:\/|\?|$)/,
        ],
      },
    }),
    {
      /*
       * reicon-react-native construye sus íconos sobre react-native-svg
       * (componentes nativos de React Native, no disponibles en web).
       * Este plugin redirige el factory `createIcon` a un adaptador con
       * DOM estándar y resuelve los imports profundos de íconos (que el
       * exports map del paquete no declara) para permitir tree-shaking.
       */
      name: 'reicon-web',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === 'reicon-react-native/createIcon') {
          return adaptadorIconosWeb
        }

        const icono = /^reicon-react-native\/icons\/(.+\.js)$/.exec(source)
        if (icono) {
          return join(raizReicon, 'icons', icono[1])
        }

        if (
          source.endsWith('createIcon.js') &&
          importer?.includes('reicon-react-native')
        ) {
          return adaptadorIconosWeb
        }

        return null
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['reicon-react-native'],
  },
})
