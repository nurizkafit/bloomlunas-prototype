const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:5173'); await p.waitForTimeout(1200);
  // Plan: a few cards via the bus, then Review > Start the week (UI)
  await p.evaluate(() => { const g = window.__gm, M = 'intent.placeCard';
    g.bus.emit(M, { activityId: 'visit', day: 0, startMin: 420, locationId: 'loc_market' });
    g.bus.emit(M, { activityId: 'craft', day: 0, startMin: 600, recipeId: 'kunyit_asam' });
    g.bus.emit(M, { activityId: 'open_shop', day: 0, startMin: 840 }); });
  await p.click('#confirmBtn'); await p.click('#startBtn'); await p.waitForTimeout(500);
  const ev = (f) => p.evaluate(f);
  const used = new Set();
  p.setDefaultTimeout(8000);
  // Events (M4) can interrupt: answer with the last option the player can pick.
  const answer = async () => { while (await p.locator('.evscrim').isVisible()) { await p.locator('.evopt:not([disabled])').last().click(); await p.waitForTimeout(80); } };
  // Sleep at the bed (Prototype Iteration: sleep from 18:00). Test only: move the clock to 18:00 if it is earlier.
  const sleepNow = async () => { await answer(); await p.evaluate(() => { const g = window.__gm, m = g.content.num('SLEEP_EARLIEST_HOUR') * 60; if (g.state.calendar.minute < m) g.state.calendar.minute = m; });
    await p.evaluate(() => window.__ui.menu.open('loc_home')); await p.click('[data-act="rest"]'); await p.waitForTimeout(60); await answer(); await p.locator('[data-run="sleep"]').first().click(); await p.waitForTimeout(80); await answer(); };
  const act = async (loc, activity) => { await answer(); await ev(`window.__ui.menu.open('${loc}')`); await p.click(`[data-act="${activity}"]`); used.add(activity); await p.waitForTimeout(80); };
  const run = async (action, sel = {}) => { await answer(); for (const [n, v] of Object.entries(sel)) await p.locator(`.aform:has([data-run="${action}"]) [name="${n}"]`).first().selectOption?.(v).catch(async () => p.locator(`.aform:has([data-run="${action}"]) [name="${n}"]`).first().fill(String(v)));
    await p.locator(`[data-run="${action}"]`).first().click(); await p.waitForTimeout(80); await answer(); };
  const log = async () => (await p.locator('#hLog p').first().textContent());
  // Do starts inside the home and shop: go out to the town first.
  if (await p.locator('#intExit').isVisible()) { await p.click('#intExit'); await p.waitForTimeout(100); }
  // canvas pick: click on the market building
  const xy = await ev(() => { const t = window.__ui.town, THREE_V = t.slots.get('loc_market').root.position.clone(); THREE_V.y = 1; THREE_V.project(t.camera); const r = t.renderer.domElement.getBoundingClientRect(); return [r.left + (THREE_V.x + 1) / 2 * r.width, r.top + (1 - THREE_V.y) / 2 * r.height]; });
  await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(150);
  console.log('canvas pick opens:', await p.locator('.amenu h3').textContent());
  await answer(); await p.click('[data-act="visit"]'); used.add('visit'); await p.waitForTimeout(100);
  await run('buy-item', { item: 'tamarind' }); console.log('Mon', await log());
  await run('buy-item', { item: 'palm_sugar' }); console.log('Mon', await log());
  await p.screenshot({ path: SP + '/m3-buy.png' });
  await act('loc_home_atelier', 'craft'); await answer(); await p.click('[data-craft="brew"]'); await p.waitForTimeout(100);
  await p.screenshot({ path: SP + '/m3-craft.png' });
  await p.click('[data-make]'); console.log('Mon', await log());
  await act('loc_home_shop', 'open_shop'); await run('serve-customer'); await run('serve-customer'); console.log('Mon', await log());
  await act('loc_home_drying_yard', 'sun_drying'); await run('start-batch', { qty: 2 }); console.log('Mon', await log());
  await p.screenshot({ path: SP + '/m3-town.png' });
  await sleepNow();
  // Tue
  await act('loc_gather_area', 'explore'); await run('gather-harvest'); console.log('Tue', await log());
  await ev(() => { const g = window.__gm; g.state.appointments.push({ entityId: 'apothecary_guild', serviceId: 'appraisal', absDay: g.state.calendar.absDay(), minute: 13 * 60, done: false }); });
  await act('loc_apothecary_guild', 'commission'); await run('take-quest'); console.log('Tue', await log());
  await act('loc_apothecary_guild', 'visit'); await run('sell-item'); console.log('Tue', await log());
  await act('loc_apothecary_guild', 'appointment'); await run('service'); console.log('Tue', await log());
  await sleepNow();
  // Wed: collect, grind
  await act('loc_home_drying_yard', 'sun_drying'); await run('collect-batch'); console.log('Wed', await log());
  await act('loc_home_atelier', 'grinding'); await run('grind', { qty: 2 }); console.log('Wed', await log());
  await act('loc_home', 'rest'); used.add('rest'); await run('sleep');
  // Change plan in Do: open book, check started day is locked
  await answer(); await p.click('#hPlan'); await p.waitForTimeout(200);
  await p.screenshot({ path: SP + '/m3-plan-in-do.png' });
  await p.click('#confirmBtn');
  for (let i = 0; i < 8 && !(await p.locator('#hCheck').isVisible()); i++) { await sleepNow(); }
  const done = await p.locator('#hCheck').isVisible();
  await answer();
  console.log('week over button:', done, 'activities used:', [...used].join(','));
  await p.click('#hCheck'); await p.waitForTimeout(150);
  console.log('phase after:', await p.textContent('#dev-phase'));
  console.log('errors', errs); await b.close();
  if (errs.length || used.size < 9) process.exit(1); // visit = buy + sell (one activity)
})();
