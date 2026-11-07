#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ContentDB } from '../core/ContentDB.js';
import { GameManager } from '../core/GameManager.js';
import { Bot } from './Bot.js';
import { loadDataNode } from './loadDataNode.js';
import { toCsv } from './csv.js';

/** Headless balance runs: npm run sim -- --runs 50 [--weeks 8] [--quiet]. Writes out/sim.csv. */
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? Number(args[i + 1]) : d; };
const runs = opt('runs', 20), weeks = opt('weeks', 99), quiet = args.includes('--quiet');
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const content = new ContentDB(loadDataNode(root));
const rows = [];
for (let i = 0; i < runs; i++) {
  const gm = new GameManager(content, { seed: 1000 + i });
  gm.start();
  new Bot(gm).play(weeks);
  const s = gm.state;
  const retro = s.phase === 'retro' ? gm.phases.retro.summary() : null;
  rows.push({ run: i, weeks: s.weeks.length, phase: s.phase, gold: Math.round(s.gold), debt: Math.round(s.debt.balance), sold: s.weeks.reduce((a, w) => a + w.sold, 0), goalRate: retro ? Math.round(retro.goalRate * 100) : '', missedMonths: retro?.missedMonths ?? '', quests: s.quests.done.length, moon: s.skills.moon, sun: s.skills.sun, earth: s.skills.earth });
}
mkdirSync(join(root, 'out'), { recursive: true });
writeFileSync(join(root, 'out/sim.csv'), toCsv(rows));
const avg = (k) => Math.round(rows.reduce((a, r) => a + Number(r[k] || 0), 0) / rows.length);
const line = `runs ${runs} | weeks ${avg('weeks')} | gold ${avg('gold')} | debt ${avg('debt')} | sold ${avg('sold')} | goals ${avg('goalRate')}% | missed months ${avg('missedMonths')} | quests ${avg('quests')}`;
console.log(line);
if (!quiet) console.table(rows.slice(0, 10));
if (rows.some((r) => r.phase !== 'retro' && weeks >= 8)) { console.error('A run did not reach the retrospective.'); process.exit(1); }
