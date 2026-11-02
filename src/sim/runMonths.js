#!/usr/bin/env node
/**
 * Headless run with no view: a Bot plays N months, then the ledger prints.
 * Usage: npm run sim -- --months 1 --runs 1 [--quiet]
 * --months sets JAM_MONTHS for this run. One run prints the week-by-week ledger; more runs print one line each.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadDataNode } from './loadDataNode.js';
import { ContentDB } from '../core/ContentDB.js';
import { GameManager } from '../core/GameManager.js';
import { Bot } from './Bot.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const quiet = args.includes('--quiet');
const runs = Number(opt('runs', 1));
const months = opt('months');

const content = new ContentDB(loadDataNode(root));
if (months) content.balance.JAM_MONTHS = { value: Number(months) };
const g = (n) => n.toFixed(2).padStart(9);

const results = [];
for (let r = 1; r <= runs; r++) {
  const gm = new GameManager(content, { seed: content.num('SEED') + r - 1 });
  const bot = new Bot(gm);
  bot.playToEnd();
  if (gm.machine.current?.name !== 'Ending') { console.error(`run ${r}: did not reach Ending`); process.exit(1); }
  const s = gm.state;
  results.push(s);
  if (quiet) continue;
  if (runs === 1) {
    console.log('week      income  expenses       net       gold       debt  sold  waste  made');
    for (const w of s.weekReports) {
      const made = Object.entries(w.made).map(([t, n]) => `${t} ${n}`).join(', ') || '-';
      console.log(`M${w.month} W${w.week} ${g(w.income)} ${g(w.expenses)} ${g(w.net)} ${g(w.gold)} ${g(w.debt)} ${String(w.sold).padStart(5)} ${String(w.waste).padStart(6)}  ${made}`);
      for (const e of w.events) console.log(`        event: ${e.title} -> ${e.response}${e.lost.length ? ` (lost: ${e.lost.join(', ')})` : ''}`);
    }
    for (const m of s.monthReports) {
      console.log(`Act M${m.month}: paid ${m.paid.toFixed(2)} · interest ${m.interest.toFixed(2)} · fees ${m.fees} · unpaid utilities ${m.unpaidUtilities} · debt ${m.balance.toFixed(2)}${m.bankrupt ? ' · BANKRUPT' : ''}`);
    }
    const skills = Object.entries(s.skills.subXp).map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`XP: ${skills} · relations: ${JSON.stringify(s.relations.points)} · quests done: ${s.questsDone.length} · refused actions: ${bot.refusals.length}`);
  }
  console.log(`run ${r}: end gold ${s.wallet.gold.toFixed(2)} · end debt ${s.debt.balance.toFixed(2)}${s.debt.bankrupt ? ' · bankrupt' : ''}`);
}
if (quiet) {
  const bad = results.filter((s) => !Number.isFinite(s.wallet.gold) || !Number.isFinite(s.debt.balance));
  if (bad.length) { console.error('NaN in results'); process.exit(1); }
  console.log(`sim ok: ${runs} run(s)`);
}
