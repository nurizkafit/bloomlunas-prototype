#!/usr/bin/env node
/**
 * Browser test loop (Playwright, needs Chromium). Starts the Vite dev server, runs each tests/browser/*.cjs,
 * writes screenshots to out/browser/, stops the server. Usage: npm run test:browser
 * An optional name runs only the matching test file: node tests/browser/run.mjs sheet (npm run sheet).
 */
import { spawn, execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync } from 'node:fs';

const out = 'out/browser';
const only = process.argv[2];
mkdirSync(out, { recursive: true });
const vite = spawn('npx', ['vite', '--port', '5173', '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-vite.pid); } catch {} };
let failed = 0;
try {
  for (let i = 0; i < 40; i++) {
    try { await fetch('http://localhost:5173'); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  for (const f of readdirSync('tests/browser').filter((x) => x.endsWith('.cjs') && (!only || x.startsWith(only))).sort()) {
    process.stdout.write(`\n== ${f}\n`);
    try { execFileSync('node', [`tests/browser/${f}`, out], { stdio: 'inherit' }); } catch { failed += 1; console.error(`FAIL ${f}`); }
  }
} finally {
  stop();
}
console.log(failed ? `\n${failed} browser test(s) failed` : '\nbrowser tests ok');
process.exit(failed ? 1 : 0);
