import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@googlemaps/js-api-loader': require('path').resolve(__dirname, 'node_modules/@googlemaps/js-api-loader/dist/index.js'),
      'pdfjs-dist/legacy/build/pdf.mjs': require('path').resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs'),
    }
  },
  server: {
    port: 5176,
    strictPort: false, // allow automatic fallback if port already in use
  },
})
