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
  // First-week guide: screenshot the dialogue, then close it with a button of the box.
  const tip = async (name, btn = /^\s*Skip\s*$/) => { await page.waitForSelector('.tutor'); await shot(name); await page.locator('.tutor button', { hasText: btn }).click(); await page.waitForTimeout(120); };
  const clearEvent = async () => { await ev(() => { const { gm } = window.__bl; if (gm.state.pendingEvent) gm.action('respondEvent', { index: 0 }); }); await draw(); };

  await page.goto(URL);
  await page.waitForSelector('.logo');
  await page.waitForTimeout(2500); // let the town models load
  await shot('01-start');
  await page.goto(URL + '?new&seed=5');
  await page.waitForSelector('.letter');
  await shot('02-story');
  await clickText('Fold the letter');
  await page.waitForSelector('.book');
  await page.waitForSelector('.tutor');
  await page.locator('.tutor button', { hasText: 'Next' }).click();
  await tip('03a-tutor-plan');
  await shot('03-plan');
  await page.locator('.deck .gcard').nth(0).dragTo(page.locator('.drow').nth(0));
  await page.locator('.deck .gcard').nth(1).click(); await page.locator('.drow').nth(1).click();
  await page.locator('.tab[data-label="Store plan"]').click(); await shot('03b-store-plan');
  await page.locator('.ribbon').click();
  await page.waitForSelector('.veil');
  await shot('04-review');
  await clickText('Begin the week');
  await clearEvent();
  await page.waitForSelector('.side');
  await tip('05a-tutor-home');
  await shot('05-home');
  // Crafting
  await page.locator('.smenu .srow', { hasText: 'Crafting' }).click();
  await shot('06-craft');
  await page.locator('.smenu .srow', { hasText: 'Drying' }).click();
  await shot('07-drying');
  await page.locator('.smenu .srow', { hasText: 'Grinding' }).click();
  await shot('08-grind');
  await page.locator('.smenu .srow', { hasText: 'Rest' }).click();
  await tip('09a-tutor-rest');
  await shot('09-rest');
  // Map + market
  await page.keyboard.press('m');
  await page.waitForSelector('.pinfo');
  await shot('10-map');
  await page.locator('.smenu .srow', { hasText: 'Guild' }).click();
  await page.waitForTimeout(800);
  await shot('10b-map-zoom');
  await page.locator('.smenu .srow', { hasText: 'Market' }).click();
  await page.locator('.pinfo .btn', { hasText: 'Go' }).click();
  await page.waitForTimeout(500);
  await shot('10c-walk');
  await page.waitForFunction(() => !window.__bl.ui.local.walk, null, { timeout: 15000 });
  await clearEvent();
  await tip('10d-tutor-market', 'Skip all tips');
  await page.locator('.smenu .srow', { hasText: 'Market stall' }).click();
  await shot('11-stall');
  await page.locator('.mstep button').nth(1).click();
  await page.locator('.mstep button').nth(1).click();
  await shot('11b-basket');
  await page.locator('.tpanel .btn.gold', { hasText: 'Buy' }).click();
  await page.locator('.ib').first().click();
  await page.waitForSelector('.icard');
  await shot('11c-itemcard');
  await page.keyboard.press('Escape');
  // Guild
  await ev(() => { const { gm } = window.__bl; gm.action('travel', { place: 'guild' }); });
  await draw();
  await page.locator('.smenu .srow', { hasText: 'Guild desk' }).click();
  await shot('12-reception');
  await page.locator('.smenu .srow', { hasText: 'Quest board' }).click();
  await shot('13-quests');
  await clickText('You ask');
  await shot('13b-give');
  // Outskirt
  await ev(() => { const { gm, ui } = window.__bl; gm.action('travel', { place: 'outskirt' }); ui.local.station = null; });
  await draw();
  await page.locator('.smenu .srow', { hasText: 'Explore' }).click();
  await clickText('Keep walking');
  await page.waitForSelector('.card');
  await shot('14-spot');
  await clickText('Gather');
  await clickText('Head back');
  await page.waitForSelector('.recap');
  await shot('14b-recap');
  await clickText('Stay');
  // Journal in Do
  await page.keyboard.press('j');
  await shot('15-journal');
  await page.locator('.tab[data-label="Ledger and assets"]').click(); await shot('16-assets');
  await page.locator('.tab[data-label="Market"]').click(); await shot('17-market');
  await page.locator('.tab[data-label="Public schedule"]').click(); await shot('17b-hours');
  await page.locator('.tab[data-label="Notes"]').click(); await shot('17c-notes');
  await page.locator('.tab[data-label="Log"]').click(); await shot('17d-log');
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
  // Sleep transition (frozen at the night frame and the dawn frame for the screenshots).
  const freeze = (t) => ev((k) => { for (const a of document.querySelector('.nightfx')?.getAnimations({ subtree: true }) ?? []) { a.pause(); a.currentTime = k * a.effect.getTiming().duration; } }, t);
  await page.waitForSelector('.nightfx');
  await freeze(0.3); await shot('17e-sleep-night');
  await freeze(0.68); await shot('17f-sleep-dawn');
  await ev(() => document.querySelector('.nightfx')?.remove());
  await page.locator('.smenu .srow', { hasText: 'Shop' }).click();
  await shot('18-store');
  await ev(() => { window.__bl.ui.local.fast = true; });
  await clickText('Open the shop');
  await page.waitForTimeout(400);
  await shot('19-store-open');
  await page.waitForSelector('text=The shop day is over', { timeout: 15000 });
  await shot('20-store-result');
  // Finish the week -> Check
  await ev(() => { const { gm } = window.__bl; let g = 0; while (gm.state.phase === 'do' && g++ < 50) { if (gm.state.pendingEvent) gm.action('respondEvent', { index: 0 }); gm.action('sleep'); } });
  await draw();
  await page.waitForSelector('.book');
  await ev(() => { window.__bl.gm.state.tutorialOff = false; window.__bl.ui.drawNow(); });
  await tip('21a-tutor-check');
  await shot('21-check');
  await page.locator('.notepick button').first().click();
  // Jump to week 4 check -> Act
  await ev(() => { const { gm } = window.__bl; gm.state.cal.week = 4; gm.finishCheck({ ids: [] }); });
  await draw();
  await tip('22a-tutor-act');
  await shot('22-act');
  await ev(() => { const { gm } = window.__bl; gm.state.cal.month = 2; gm.finishAct(); });
  await draw();
  await page.waitForSelector('text=The clerk reads your books');
  await page.waitForSelector('.endscene');
  await shot('23a-end-scene');
  await page.locator('.endscene .btn', { hasText: 'Skip' }).click();
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
