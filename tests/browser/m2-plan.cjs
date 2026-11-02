// Plan (Prototype Iteration, 2 Nov 2026): top bar, 3-hour slots, category deck, click-a-slot picker, popup beside the card,
// one Processing card (popup picks the process), budget coin, opening-hours blocks.
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
  out.tileNames = await p.locator('.deck .cat b').allTextContents();
  await cat('shop');
  await drag('.dc[data-type="open_shop"]', 0, 9);
  out.popAfterDrop = await p.locator('#cardPop').count();
  await p.screenshot({ path: `${SP}/m2-pop-drop.png` });
  await p.click('#cardPop [data-popx]'); await p.waitForTimeout(80);
  await drag('.dc[data-type="open_shop"]', 6, 9); // Sunday: the shop is closed, refused
  out.sundayToast = await p.locator('.toast').textContent().catch(() => '-');
  await cat('fieldwork');
  await drag('.dc[data-type="explore"]', 1, 6);
  await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  // Click a free slot, then pick a card: Wed 12:00 craft.
  await p.click('[data-slot="2:720"]'); await p.waitForTimeout(80);
  out.target = await p.locator('.deck .tgt b').textContent();
  await cat('production');
  await p.click('.dc[data-type="craft"]'); await p.waitForTimeout(150);
  out.afterPick = await p.locator('#cardPop h3').textContent();
  await p.click('#cardPop [data-popx]'); await p.waitForTimeout(80);
  // Night slot 18-21 is fine for work (sleep is not a card).
  out.sleepCard = await p.locator('.dc[data-type="rest"]').count();
  out.procCards = await p.locator('.dc[data-type="processing"]').count();
  out.oldProc = await p.locator('.dc[data-type="grinding"], .dc[data-type="sun_drying"]').count();
  await drag('.dc[data-type="processing"]', 3, 18);
  // The popup picks the process: Grinding.
  await p.click('#cardPop [data-set="activityId"][data-val="grinding"]'); await p.waitForTimeout(300);
  out.procPop = await p.locator('#cardPop h3').textContent();
  await p.screenshot({ path: `${SP}/m2-pop-process.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  await cat('organization');
  out.orgCards = await p.locator('.deck .dc').evaluateAll((l) => l.map((x) => x.dataset.type));
  await p.screenshot({ path: `${SP}/m2-week.png` });
  out.cards = await p.evaluate(() => window.__gm.state.plan.cards.map((c) => `${c.activityId}@${c.day}:${c.startMin / 60}`));
  // Click a planned card: the popup opens beside it.
  await p.locator('.bc').first().click(); await p.waitForTimeout(150);
  out.popups = await p.locator('#cardPop').count();
  out.beside = await p.evaluate(() => { const a = document.querySelector('.bc.sel').getBoundingClientRect(), b = document.querySelector('#cardPop').getBoundingClientRect(); return Math.abs(b.left - a.right) < 40 || Math.abs(a.left - b.right) < 40; });
  out.deckStill = await p.locator('#deck .cats, #deck .list').count();
  await p.screenshot({ path: `${SP}/m2-detail.png` });
  for (const t of ['ledger', 'market', 'town', 'journal']) { await p.click(`.tab[data-tab="${t}"]`); await p.waitForTimeout(150); await p.screenshot({ path: `${SP}/m2-${t}.png` }); if (t === 'ledger') out.coin = await p.locator('#ledR .big .coin').count(); if (t === 'town') out.shopBlock = await p.locator('.hrow').evaluateAll((rows) => rows.map((r) => r.children.length)); }
  await p.click('#confirmBtn'); await p.waitForTimeout(150);
  await p.screenshot({ path: `${SP}/m2-review.png` });
  await p.click('#startBtn'); await p.waitForTimeout(200);
  out.phase = await p.textContent('#dev-phase');
  out.locked = await p.evaluate(() => window.__gm.state.plan.locked);
  console.log('plan', JSON.stringify(out));
  console.log('errors', JSON.stringify(errs)); await b.close();
  const want = ['open_shop@0:9', 'explore@1:6', 'craft@2:12', 'grinding@3:18'];
  const ok = out.topBar.every(Boolean) && out.tiles === 4 && out.tileNames.join('|') === 'Production|Shop|Fieldwork|Guild / Organization'
    && /06:00.*03:00/.test(out.slotLabels) && /closed/i.test(out.sundayToast) && out.popAfterDrop === 1
    && /Wed 12:00/.test(out.target) && /Craft/.test(out.afterPick) && out.sleepCard === 0
    && out.procCards === 1 && out.oldProc === 0 && /Grinding/.test(out.procPop) && out.orgCards.join() === 'appointment,commission,visit'
    && want.every((w) => out.cards.includes(w)) && out.cards.length === 4 && out.popups === 1 && out.beside && out.deckStill === 1
    && out.coin === 1 && out.shopBlock.some((n) => n < 7) && out.phase === 'Do' && out.locked;
  if (errs.length || !ok) process.exit(1);
})();
