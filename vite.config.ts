import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.GITHUB_PAGES === 'true' ? '/sistemaMotorista/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons/favicon-48.png',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'brand/braulio-logo.png',
      ],
      manifest: {
        id: base,
        name: 'Transportadora Braulio',
        short_name: 'Braulio',
        description: 'Sistema do motorista: saídas, paradas, checklist e ocorrências.',
        lang: 'pt-BR',
        start_url: `${base}?origem=pwa`,
        scope: base,
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait-primary',
        background_color: '#0b0d10',
        theme_color: '#0b0d10',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          {
            src: `${base}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-maskable-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Hoje',
            short_name: 'Hoje',
            description: 'Ver as saídas de hoje',
            url: `${base}?origem=pwa`,
            icons: [
              {
                src: `${base}icons/icon-192.png`,
                sizes: '192x192',
                type: 'image/png',
              },
            ],
          },
          {
            name: 'Checklist',
            short_name: 'Checklist',
            description: 'Conferir o veículo',
            url: `${base}?origem=pwa&tela=checklist`,
            icons: [
              {
                src: `${base}icons/icon-192.png`,
                sizes: '192x192',
                type: 'image/png',
              },
            ],
          },
        ],
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
})
