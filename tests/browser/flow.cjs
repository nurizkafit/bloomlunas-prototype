// Jam flow test: Start menu -> story -> Plan -> Do (map, stations, explore, store) -> Check -> Act -> Retro.
// Screenshots at 1280x720 and 1920x1080 in out/browser/. Fails on page errors or a missing screen.
const { chromium } = require('playwright');
const out = process.argv[2] || 'out/browser';
const URL = 'http://localhost:5173/';

async function run(w, hgt) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const shot = async (name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${name}-${w}.png` }); };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const clickText = async (t) => { await page.getByRole('button', { name: t, exact: false }).first().click(); await page.waitForTimeout(120); };
  const draw = () => ev(() => window.__bl.ui.drawNow());
  const clearEvent = async () => { await ev(() => { const { gm } = window.__bl; if (gm.state.pendingEvent) gm.action('respondEvent', { index: 0 }); }); await draw(); };

  await page.goto(URL);
  await page.waitForSelector('.logo');
  await page.waitForTimeout(2500); // let the town models load
  await shot('01-start');
  await page.goto(URL + '?new&seed=5');
  await page.waitForSelector('.letter');
  await shot('02-story');
  await clickText('Open the Journal');
  await page.waitForSelector('.book');
  await shot('03-plan');
  await page.locator('.goalpick button').nth(0).click();
  await page.locator('.ribbon').click();
  await page.waitForSelector('.veil');
  await shot('04-review');
  await clickText('Start week');
  await clearEvent();
  await page.waitForSelector('.side');
  await shot('05-home');
  // Crafting
  await page.locator('.stcard', { hasText: 'Crafting' }).click();
  await shot('06-craft');
  await page.locator('.stcard', { hasText: 'Drying' }).click();
  await shot('07-drying');
  await page.locator('.stcard', { hasText: 'Grinding' }).click();
  await shot('08-grind');
  await page.locator('.stcard', { hasText: 'Rest' }).click();
  await shot('09-rest');
  // Map + market
  await page.keyboard.press('m');
  await page.waitForSelector('.mapwin');
  await shot('10-map');
  await page.locator('.node', { hasText: 'Market' }).click();
  await clickText('Go');
  await page.waitForTimeout(150);
  await clearEvent();
  await page.locator('.stcard', { hasText: 'Market stall' }).click();
  await shot('11-stall');
  await clickText('Buy');
  // Guild
  await ev(() => { const { gm } = window.__bl; gm.action('travel', { place: 'guild' }); });
  await draw();
  await page.locator('.stcard', { hasText: 'receptionist' }).click();
  await shot('12-reception');
  await page.locator('.stcard', { hasText: 'Quest board' }).click();
  await shot('13-quests');
  // Outskirt
  await ev(() => { const { gm, ui } = window.__bl; gm.action('travel', { place: 'outskirt' }); ui.local.station = null; });
  await draw();
  await clickText('Walk on');
  await page.waitForSelector('.card');
  await shot('14-spot');
  await clickText('Gather');
  // Journal in Do
  await page.keyboard.press('j');
  await shot('15-journal-stock');
  await page.locator('.tab[data-label="Stock"]').click(); await shot('16-stock');
  await page.locator('.tab[data-label="Market"]').click(); await shot('17-market');
  await page.keyboard.press('j');
  // Store day: back home, craft, stock, open
  await ev(() => {
    const { gm } = window.__bl;
    gm.action('sleep');
    if (gm.state.pendingEvent) gm.action('respondEvent', { index: 0 });
    for (const r of gm.content.all('recipes')) { const b = gm.sys.production.maxBatches(r); if (b) gm.action('craft', { recipe: r.id, batches: b }); }
    let slot = 0;
    for (const [k, q] of Object.entries(gm.state.inv)) { const [item, v, tier] = k.split('|'); if (v === 'product' && q > 0 && slot < 9) gm.action('stockShelf', { slot: slot++, item, tier, qty: q, level: slot % 3 === 0 ? 'high' : 'fair' }); }
    while (gm.state.cal.minute < 9 * 60) gm.action('shortBreak');
  });
  await draw();
  await page.locator('.stcard', { hasText: 'Store' }).click();
  await shot('18-store');
  await ev(() => { window.__bl.ui.local.fast = true; });
  await clickText('Open store');
  await page.waitForTimeout(400);
  await shot('19-store-open');
  await page.waitForSelector('text=Shop result', { timeout: 15000 });
  await shot('20-store-result');
  // Finish the week -> Check
  await ev(() => { const { gm } = window.__bl; let g = 0; while (gm.state.phase === 'do' && g++ < 50) { if (gm.state.pendingEvent) gm.action('respondEvent', { index: 0 }); gm.action('sleep'); } });
  await draw();
  await page.waitForSelector('.book');
  await shot('21-check');
  await page.locator('.notepick button').first().click();
  // Jump to week 4 check -> Act
  await ev(() => { const { gm } = window.__bl; gm.state.cal.week = 4; gm.finishCheck({ ids: [] }); });
  await draw();
  await shot('22-act');
  await ev(() => { const { gm } = window.__bl; gm.state.cal.month = 2; gm.finishAct(); });
  await draw();
  await page.waitForSelector('text=Retrospective');
  await shot('23-retro');
  // Event card
  await ev(() => { const { gm } = window.__bl; gm.state.phase = 'do'; gm.state.pendingEvent = gm.content.all('events')[0].id; window.__bl.ui.local.station = null; });
  await draw();
  await shot('24-event');
  await browser.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log(`ok ${w}x${hgt}`);
}

(async () => { await run(1280, 720); await run(1920, 1080); })().catch((e) => { console.error(e); process.exit(1); });
