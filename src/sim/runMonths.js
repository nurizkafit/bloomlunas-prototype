#!/usr/bin/env node
/**
 * Headless run with no view. M0: steps through the phases with a "next phase" bot.
 * Usage: npm run sim -- --months 1 --runs 1 [--quiet]
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadDataNode } from './loadDataNode.js';
import { ContentDB } from '../core/ContentDB.js';
import { GameManager } from '../core/GameManager.js';
import { MSG } from '../core/EventBus.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const quiet = args.includes('--quiet');
const runs = Number(opt('runs', 1));

const content = new ContentDB(loadDataNode(root));
for (let r = 1; r <= runs; r++) {
  const gm = new GameManager(content, { log: quiet ? () => {} : (l) => console.log(`[run ${r}] ${l}`) });
  const seen = [];
  gm.bus.on(MSG.PHASE_ENTERED, (e) => seen.push(e.phase));
  gm.start();
  let guard = 0;
  while (gm.machine.current && gm.machine.current.name !== 'Ending' && guard++ < 1000) gm.bus.emit(MSG.INTENT_NEXT_PHASE);
  if (gm.machine.current?.name !== 'Ending') { console.error('Run did not reach Ending'); process.exit(1); }
  console.log(`run ${r}: ${seen.length} phases · ${seen.join(' > ')}`);
}
