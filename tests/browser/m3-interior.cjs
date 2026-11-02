// Do: interior of the home and shop. Start inside, stations open menus, shelf opens stock, Exit, walk back in, customers.
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.setDefaultTimeout(8000);
  await p.goto('http://localhost:5173/?new'); await p.waitForTimeout(1000);
  const phase = () => p.textContent('#dev-phase');
  for (let i = 0; i < 5 && (await phase()) !== 'Do'; i++) { await p.click('#dev-next'); await p.waitForTimeout(150); }
  const answer = async () => { while (await p.locator('.evscrim').isVisible()) { await p.locator('.evopt:not([disabled])').last().click(); await p.waitForTimeout(60); } };
  const inside = () => p.evaluate(() => window.__ui.town.inside?.data.id ?? null);
  const station = async (id) => {
    const xy = await p.evaluate((sid) => { const t = window.__ui.town, i = t.inside, v = i.stations.get(sid).root.position.clone(); v.y = 0.8; v.project(i.camera); const r = t.renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; }, id);
    await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(150);
  };
  const out = {};
  await answer();
  out.startInside = await inside();
  out.exitBar = await p.locator('#intExit').isVisible();
  // HUD: Eat (breakfast window at 06:00) and Small rest; no "End the day" button.
  await p.evaluate(() => { window.__gm.state.player.energy = 50; });
  out.eatLabel = await p.locator('#hEat').textContent();
  await p.click('#hEat'); await p.waitForTimeout(100);
  out.eatLog = await p.locator('#hLog p').first().textContent();
  out.eatAgain = await p.locator('#hEat').isDisabled();
  await p.click('#hNap'); await p.waitForTimeout(100);
  out.napLog = await p.locator('#hLog p').first().textContent();
  out.endDayBtn = await p.locator('#hSleep').count();
  await p.screenshot({ path: `${SP}/m3-interior.png` });
  await station('st_cauldron'); out.cauldronMenu = await p.locator('.amenu:not(.stock) h3').textContent();
  await station('st_counter'); out.counterMenu = await p.locator('.amenu:not(.stock) h3').textContent();
  await station('st_bed'); out.bedMenu = await p.locator('.amenu:not(.stock) h3').textContent();
  await station('st_shelf'); out.shelf = await p.locator('.stock h3').isVisible();
  await p.screenshot({ path: `${SP}/m3-interior-shelf.png` });
  // Walk between stations costs 0 min.
  await p.click('.stock [data-close]');
  const m0 = await p.evaluate(() => window.__gm.state.calendar.minute);
  await p.evaluate(() => window.__ui.menu.open('loc_home_atelier')); await p.click('[data-act="craft"]'); await p.waitForTimeout(100);
  out.walkInsideMin = (await p.evaluate(() => window.__gm.state.calendar.minute)) - m0;
  out.stillInside = await inside();
  // Exit to the town; then walk back in through the door.
  await p.click('#intExit'); await p.waitForTimeout(150);
  out.afterExit = await inside();
  await p.screenshot({ path: `${SP}/m3-interior-exit.png` });
  // Click the Home and shop building in the town: one menu with Enter and the activities of all stations.
  const bxy = await p.evaluate(() => { const t = window.__ui.town, v = t.slots.get('loc_home_shop').root.position.clone(); v.y = 1.5; v.project(t.camera); const r = t.renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; });
  await p.mouse.click(bxy[0], bxy[1]); await p.waitForTimeout(150);
  out.bMenu = await p.locator('.amenu:not(.stock) h3').textContent();
  out.bEnter = await p.locator('[data-enter]').count();
  out.bActs = await p.locator('.amenu [data-act]').evaluateAll((l) => l.map((x) => x.dataset.act));
  await p.screenshot({ path: `${SP}/m3-building-menu.png` });
  await p.click('[data-enter]'); await p.waitForTimeout(400);
  out.entered = await inside();
  await p.click('#intExit'); await p.waitForTimeout(150);
  await p.evaluate(() => window.__ui.menu.open('loc_market')); await p.click('[data-act="visit"]'); await p.waitForFunction(() => !window.__ui.town.avatar.walking, null, { timeout: 20000 }); await answer();
  await p.evaluate(() => window.__ui.menu.open('loc_home_shop')); await p.click('[data-act="open_shop"]'); await answer();
  await p.waitForFunction(() => window.__ui.town.inside, null, { timeout: 20000 }).catch(() => {});
  out.walkedIn = await inside();
  // Customer comes to the counter (needs stock; give some for the test).
  await p.evaluate(() => { const g = window.__gm; g.state.inventory.add('fresh_jamu', 'product', 3, { tier: 'Good', born: g.state.calendar.absDay() }); g.state.calendar.minute = Math.max(g.state.calendar.minute, 9 * 60); });
  await p.locator('[data-run="serve-customer"]').first().click(); await p.waitForTimeout(300);
  out.customerLog = await p.locator('#hLog p').first().textContent();
  out.customer = await p.evaluate(() => window.__ui.town.inside?.customer.root.visible ?? false);
  await p.screenshot({ path: `${SP}/m3-interior-customer.png` });
  console.log('interior', JSON.stringify(out));
  console.log('errors', JSON.stringify(errs));
  const ok = out.bMenu === 'Home and shop' && out.bEnter === 1 && ['open_shop', 'craft', 'grinding', 'rest'].every((x) => out.bActs.includes(x)) && out.entered === 'int_home_shop'
    && out.startInside === 'int_home_shop' && out.exitBar && /atelier/i.test(out.cauldronMenu) && /shop/i.test(out.counterMenu) && out.bedMenu === 'Home'
    && out.shelf && out.walkInsideMin === 0 && out.stillInside && out.afterExit === null && out.walkedIn === 'int_home_shop' && out.customer
    && /Eat breakfast/.test(out.eatLabel) && /Ate breakfast: \+20 energy/.test(out.eatLog) && out.eatAgain && /Small rest: \+25 energy/.test(out.napLog) && out.endDayBtn === 0;
  await b.close();
  process.exit(ok && !errs.length ? 0 : 1);
})();
