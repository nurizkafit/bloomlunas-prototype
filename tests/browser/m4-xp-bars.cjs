// Check screen: skill XP bars per path show level, gain this week and sub-skill gains.
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.setDefaultTimeout(8000);
  await p.goto('http://localhost:5173/?new'); await p.waitForTimeout(1000);
  const phase = () => p.textContent('#dev-phase');
  for (let i = 0; i < 5 && (await phase()) !== 'Do'; i++) { await p.click('#dev-next'); await p.waitForTimeout(150); }
  // Test only: give XP during Do (25 moon/alchemy = level up from 1 to 2, 8 earth/foraging).
  await p.evaluate(() => { const s = window.__gm.state.skills; s.addXp('moon', 'alchemy', 25); s.addXp('earth', 'foraging', 8); });
  for (let i = 0; i < 5 && (await phase()) !== 'Check'; i++) { await p.click('#dev-next'); await p.waitForTimeout(150); }
  const rows = await p.$$eval('.xprow', (r) => r.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  console.log('xp rows', JSON.stringify(rows));
  await p.screenshot({ path: `${SP}/m4-xp-bars.png` });
  const ok = rows.length === 3 && /Moon Lv 2/.test(rows[1]) && /\+25 level up/.test(rows[1]) && /alchemy \+25/.test(rows[1]) && /\+8/.test(rows[2]);
  console.log('errors', JSON.stringify(errs));
  await b.close();
  process.exit(ok && !errs.length ? 0 : 1);
})();
