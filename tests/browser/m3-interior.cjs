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
  // Scene & Flow: a station click opens its 2D station screen.
  const scr = async (id) => { await station(id); const n = await p.locator('.station .st-side h2').textContent(); await p.screenshot({ path: `${SP}/st-${id}.png` }); await p.click('.station [data-close]'); await p.waitForTimeout(80); return n; };
  out.cauldronMenu = await scr('st_cauldron');
  out.counterMenu = await scr('st_counter');
  out.bedMenu = await scr('st_bed');
  out.grinder = await scr('st_grinder');
  out.rack = await scr('st_drying_rack');
  // One Crafting menu: recipe, lot, batches, packing; one Craft button.
  await p.evaluate(() => { const g = window.__gm, r = g.content.get('recipes', 'kunyit_asam'); for (const l of Object.values(r.slots)) for (const e of l) g.state.inventory.add(e.item, e.variant, e.qty * 2, { born: 0 }); g.state.calendar.minute = Math.max(g.state.calendar.minute, 7 * 60); });
  await p.evaluate(() => window.__ui.station.open('loc_home_atelier')); await p.waitForTimeout(80);
  await p.click('[data-recipe="kunyit_asam"]'); await p.click('[data-cb="1"]'); await p.click('[data-container="jar"]');
  await p.locator('select[name="lot"]').first().selectOption({ index: 1 }); await p.waitForTimeout(80);
  await p.screenshot({ path: `${SP}/st-crafting.png` });
  await p.click('[data-craftgo]'); await p.waitForTimeout(150);
  out.packedJar = await p.evaluate(() => window.__gm.state.inventory.find((l) => l.pack === 'jar').reduce((n, l) => n + l.qty, 0));
  out.craftLog = await p.evaluate(() => window.__gm.state.activityLog.slice(-2).map((l) => l.actionId).join());
  await p.click('.station [data-close]');
  await station('st_shelf'); out.shelf = (await p.locator('.station .fn.on').textContent()).includes('Shelf stock') && (await p.locator('.shelf3 .sl').count()) === 9;
  await p.screenshot({ path: `${SP}/m3-interior-shelf.png` });
  // Walk between stations costs 0 min.
  await p.click('.station [data-close]');
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
  out.bSecs = await p.locator('.amenu:not(.stock) .sec').allTextContents();
  out.bTags = await p.locator('.amenu .stag').allTextContents();
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
  await p.evaluate(() => window.__ui.station.open('loc_home_shop', 'shelf')); await p.waitForTimeout(100);
  await p.click('.shelf3 [data-slot="0"]'); await p.click('[data-stock]'); await p.waitForTimeout(100);
  await p.click('.shelf3 [data-slot="4"]'); await p.waitForTimeout(60);
  if (await p.locator('[data-stock]:not([disabled])').count()) { await p.click('[data-stock]'); await p.waitForTimeout(100); }
  out.shelfQty = await p.evaluate(() => window.__gm.ctx.sys.economy.shelfQty());
  await p.screenshot({ path: `${SP}/st-shelf-grid.png` });
  await p.click('.station [data-fn="store"]'); await p.waitForTimeout(80);
  await p.screenshot({ path: `${SP}/st-shop-management.png` });
  const e0 = await p.evaluate(() => window.__gm.state.player.energy);
  await p.evaluate(() => { window.__seenCustomer = false; window.__visits = 0; const iv = window.__ui.town.inside; const o = iv.customerVisit.bind(iv); iv.customerVisit = () => { window.__visits++; o(); window.__vis = [iv.customer.root.visible, iv.customerPath.length]; setTimeout(() => { window.__vis2 = [iv.customer.root.visible, iv.customerPath.length, iv.customer.root.position.toArray()]; }, 30); }; const t = setInterval(() => { if (window.__ui.town.inside?.customer.root.visible) { window.__seenCustomer = true; clearInterval(t); } }, 50); });
  await p.click('[data-openshop]'); await p.waitForTimeout(1000);
  out.live = await p.locator('.st-live').isVisible();
  out.insideAtShop = await p.evaluate(() => [window.__ui.town.inside?.data.id ?? null, window.__gm.state.store?.hours, window.__gm.state.store?.open]);
  await p.screenshot({ path: `${SP}/st-shop-live.png` });
  await p.waitForSelector('.result2', { timeout: 20000 });
  out.customer = await p.evaluate(() => window.__visits >= 1 && window.__vis?.[0] === true);
  out.visits = await p.evaluate(() => [window.__visits, window.__vis2?.[0]]);
  out.energyUsed = e0 - (await p.evaluate(() => window.__gm.state.player.energy));
  out.report = await p.evaluate(() => { const s = window.__gm.state.store; return { hours: s.hours, sold: s.sold, open: s.open }; });
  out.stopReason = await p.evaluate(() => window.__gm.ctx.sys.economy.storeStop());
  out.storeResult = await p.locator('.report .rp').count();
  await p.screenshot({ path: `${SP}/st-store-result.png` });
  await p.click('[data-resultok]'); await p.click('.station [data-close]');
  out.customerLog = await p.locator('#hLog p').first().textContent();
  await p.screenshot({ path: `${SP}/m3-interior-customer.png` });
  console.log('interior', JSON.stringify(out));
  console.log('errors', JSON.stringify(errs));
  const ok = out.bMenu === 'Home and shop' && out.bEnter === 1 && out.bActs.join() === 'craft,processing,open_shop,rest' && out.bSecs.join() === 'Production,Shop,Personal'
    && /Cauldron/.test(out.bTags[0]) && /Grinding table.*\+.*Drying rack/.test(out.bTags[1]) && /Shop counter/.test(out.bTags[2]) && /Bed/.test(out.bTags[3]) && out.entered === 'int_home_shop'
    && out.startInside === 'int_home_shop' && out.exitBar && out.cauldronMenu === 'Crafting' && out.counterMenu === 'Store' && out.bedMenu === 'Rest' && out.shelfQty >= 3 && out.storeResult >= 4 && out.live && out.energyUsed === 10 && !out.report.open && out.report.hours >= 1 && out.stopReason !== null && out.grinder === 'Grinding table' && out.rack === 'Drying rack' && out.packedJar === 12 && out.craftLog === 'prepare,brew'
    && out.shelf && out.walkInsideMin === 0 && out.stillInside && out.afterExit === null && out.walkedIn === 'int_home_shop' && out.customer
    && /Eat breakfast/.test(out.eatLabel) && /Ate breakfast: \+20 energy/.test(out.eatLog) && out.eatAgain && /Small rest: \+25 energy/.test(out.napLog) && out.endDayBtn === 0;
  await b.close();
  process.exit(ok && !errs.length ? 0 : 1);
})();
