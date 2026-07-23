import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vanda Tech ERP',
        short_name: 'VandaERP',
        description: 'Sistem Tata Kelola Operasional & HRIS',
        theme_color: '#0a195c',
        background_color: '#F4F7FB',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Ini yang bikin aplikasi kebal blank saat offline!
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        
        // 👇 TAMBAHKAN BARIS INI (Menaikkan batas maksimal file ke 5 MB) 👇
        maximumFileSizeToCacheInBytes: 5000000, 
        
        runtimeCaching: [
          {
            // Simpan cache API/Font dari luar jika ada
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 3000, 
  }
})