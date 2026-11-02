import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: { port: 5173 },
  // assets/ is served as is: assets/models/<slot id>.glb -> ./models/<slot id>.glb (dev and build).
  publicDir: 'assets',
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1000 },
  test: { include: ['tests/**/*.test.js'] }
});
