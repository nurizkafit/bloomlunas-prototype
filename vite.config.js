import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

/**
 * Hand-drawn UI art (user, 14 Nov 2026): lists the PNGs in assets/art/ui/ and the Unity sprite manifest
 * as the module virtual:art-pack (read by src/views/ui/ArtPack.js). Add or remove a PNG: the dev server reloads.
 */
function artPack() {
  const id = 'virtual:art-pack', rid = '\0' + id;
  const dir = path.resolve('assets/art/ui');
  const manifest = path.resolve('assets/unity-export/manifest.json');
  return {
    name: 'art-pack',
    resolveId: (s) => (s === id ? rid : null),
    load(s) {
      if (s !== rid) return null;
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort() : [];
      const m = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      const parts = m.parts.map((p) => ({ code: p.code, variant: p.variant, file: path.basename(p.png), mode: p.mode,
        w: Number(p.width), h: Number(p.height), nine: p.nineSlice, ninePx: p.nineSlicePx }));
      return `export default ${JSON.stringify({ files, parts })};`;
    },
    configureServer(server) {
      server.watcher.add(dir);
      const touch = (f) => {
        if (!path.resolve(f).startsWith(dir)) return;
        const mod = server.moduleGraph.getModuleById(rid);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', touch);
      server.watcher.on('unlink', touch);
    }
  };
}

export default defineConfig({
  plugins: [artPack()],
  server: { port: 5173 },
  // assets/ is served as is: assets/models/<slot id>.glb -> ./models/<slot id>.glb (dev and build).
  publicDir: 'assets',
  base: './',
  // sheet.html: the interface sheet (all UI components, for the art audit). unity.html: the Unity sprites (9-slice skins, icons).
  build: { outDir: 'dist', chunkSizeWarningLimit: 1000, rollupOptions: { input: { main: 'index.html', sheet: 'sheet.html', unity: 'unity.html' } } },
  test: { include: ['tests/**/*.test.js'] }
});
