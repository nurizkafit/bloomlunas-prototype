import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: { port: 5173 },
  // assets/ is served as is: assets/models/<slot id>.glb -> ./models/<slot id>.glb (dev and build).
  publicDir: 'assets',
  base: './',
  // sheet.html: the interface sheet (all UI components, for the art audit).
  build: { outDir: 'dist', chunkSizeWarningLimit: 1000, rollupOptions: { input: { main: 'index.html', sheet: 'sheet.html' } } },
  test: { include: ['tests/**/*.test.js'] }
});
