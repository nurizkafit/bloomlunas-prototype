// Plan (Prototype Iteration, 2 Nov 2026): top bar, 3-hour slots, category deck, click-a-slot picker, side panel details.
const { chromium } = require('playwright');
(async () => {
  const SP = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:5173/?new'); await p.waitForTimeout(900);
  const out = {};
  out.topBar = await p.evaluate(() => ['#rGold', '#rDebt', '#rPay', '#rLive', '#rEnd', '#rEnN'].map((s) => document.querySelector(s)?.textContent.trim()));
  out.tiles = await p.locator('.deck .cat').count();
  out.slotLabels = await p.locator('.col[data-d="0"]').evaluate((c) => c.parentElement.parentElement.querySelector('.hours').textContent);
  await p.screenshot({ path: `${SP}/m2-deck-cats.png` });
  // Drag: the deck card is held at its middle (1.5 h), so drop at the slot centre.
  const drag = async (sel, d, hour) => {
    const src = await p.locator(sel).first().boundingBox();
    const col = await p.locator(`.col[data-d="${d}"]`).boundingBox();
    const hpx = col.height / 21;
    await p.mouse.move(src.x + 20, src.y + 10); await p.mouse.down();
    await p.mouse.move(src.x + 40, src.y + 40, { steps: 3 });
    await p.mouse.move(col.x + col.width / 2, col.y + (hour - 6 + 1.5) * hpx, { steps: 8 }); await p.mouse.up();
    await p.waitForTimeout(150);
  };
  const cat = async (id) => { while (await p.locator('.deck [data-back]').count()) { await p.click('.deck [data-back]'); await p.waitForTimeout(60); } await p.click(`[data-cat="${id}"]`); await p.waitForTimeout(80); };
  await cat('trade');
  await drag('.dc[data-type="open_shop"]', 0, 9);
  await drag('.dc[data-type="open_shop"]', 6, 9); // Sunday: the shop is closed, refused
  out.sundayToast = await p.locator('.toast').textContent().catch(() => '-');
  await cat('explore');
  await drag('.dc[data-type="explore"]', 1, 6);
  // Click a free slot, then pick a card: Wed 12:00 craft.
  await p.click('[data-slot="2:720"]'); await p.waitForTimeout(80);
  out.target = await p.locator('.deck .tgt b').textContent();
  await cat('production');
  await p.click('.dc[data-type="craft"]'); await p.waitForTimeout(150);
  out.afterPick = await p.locator('.deck .kind').textContent();
  // Sleep: only night slots.
  await cat('rest');
  await drag('.dc[data-type="rest"]', 3, 15); // 15:00: refused
  out.sleepEarly = await p.locator('.toast').textContent().catch(() => '-');
  await drag('.dc[data-type="rest"]', 3, 21);
  await p.screenshot({ path: `${SP}/m2-week.png` });
  out.cards = await p.evaluate(() => window.__gm.state.plan.cards.map((c) => `${c.activityId}@${c.day}:${c.startMin / 60}`));
  // Click a planned card: details show in the side panel (no popup).
  await p.locator('.bc').first().click(); await p.waitForTimeout(150);
  out.detail = await p.locator('.deck .kind').textContent();
  out.popups = await p.locator('.pop').count();
  await p.screenshot({ path: `${SP}/m2-detail.png` });
  for (const t of ['ledger', 'market', 'town', 'journal']) { await p.click(`.tab[data-tab="${t}"]`); await p.waitForTimeout(150); await p.screenshot({ path: `${SP}/m2-${t}.png` }); }
  await p.click('#confirmBtn'); await p.waitForTimeout(150);
  await p.screenshot({ path: `${SP}/m2-review.png` });
  await p.click('#startBtn'); await p.waitForTimeout(200);
  out.phase = await p.textContent('#dev-phase');
  out.locked = await p.evaluate(() => window.__gm.state.plan.locked);
  console.log('plan', JSON.stringify(out));
  console.log('errors', JSON.stringify(errs)); await b.close();
  const want = ['open_shop@0:9', 'explore@1:6', 'craft@2:12', 'rest@3:21'];
  const ok = out.topBar.every(Boolean) && out.tiles === 5 && /06:00.*03:00/.test(out.slotLabels) && /closed/i.test(out.sundayToast)
    && /Wed 12:00/.test(out.target) && out.afterPick === 'Planned card' && /18:00/.test(out.sleepEarly)
    && want.every((w) => out.cards.includes(w)) && out.cards.length === 4 && out.detail === 'Planned card' && out.popups === 0 && out.phase === 'Do' && out.locked;
  if (errs.length || !ok) process.exit(1);
})();
