const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.setDefaultTimeout(8000);
  await p.goto('http://localhost:5173/?new'); await p.waitForTimeout(1000);
  const phase = () => p.textContent('#dev-phase');
  const answer = async () => { while (await p.locator('.evscrim').isVisible()) { await p.locator('.evopt:not([disabled])').last().click(); await p.waitForTimeout(60); } };
  // Sleep at the bed (Prototype Iteration: sleep from 18:00). Test only: move the clock to 18:00 if it is earlier.
  const sleepNow = async () => { if (await p.locator('.evscrim').isVisible()) return; await p.evaluate(() => { const g = window.__gm, m = g.content.num('SLEEP_EARLIEST_HOUR') * 60; if (g.state.calendar.minute < m) g.state.calendar.minute = m; });
    await p.evaluate(() => window.__ui.menu.open('loc_home')); await p.click('[data-act="rest"]'); await p.waitForTimeout(60);
    if (await p.locator('.evscrim').isVisible()) return; await p.locator('[data-run="sleep"]').first().click(); await p.waitForTimeout(80); };
  const playWeek = async () => {
    for (let i = 0; i < 40; i++) {
      await answer();
      if (await p.locator('#hCheck').isVisible()) { await p.click('#hCheck'); return; }
      await sleepNow();
    }
  };
  const checks = {};
  // Week 1: Plan, then reload in Do (continue from the last phase end)
  await p.click('#confirmBtn'); await p.click('#startBtn'); await p.waitForTimeout(300);
  await sleepNow();
  await p.reload(); await p.waitForTimeout(1200);
  checks.reloadInDo = (await phase()) === 'Do' && (await p.evaluate(() => window.__gm.state.calendar.day)) === 0;
  for (let w = 1; w <= 4; w++) {
    if ((await phase()) === 'Plan') { await p.click('#confirmBtn'); await p.click('#startBtn'); await p.waitForTimeout(250); }
    await playWeek(); await p.waitForTimeout(150);
    if (w === 2) { await p.reload(); await p.waitForTimeout(1200); checks.reloadInCheck = (await phase()) === 'Check'; }
    await p.click('#rcNext'); await p.waitForTimeout(200);
  }
  checks.act = (await phase()) === 'Act';
  await p.click('#payUtil'); await p.waitForTimeout(100);
  await p.selectOption('[name="wk"]', '1'); await p.selectOption('[name="dy"]', '1'); await p.selectOption('[name="hr"]', '9');
  await p.click('#bookAppt'); await p.waitForTimeout(100);
  checks.booked = await p.locator('text=Booked:').count() > 0;
  await p.screenshot({ path: `${SP}/m5-month-end.png` });
  await p.click('#closeMonth'); await p.waitForTimeout(400);
  checks.month2Plan = (await phase()) === 'Plan' && (await p.evaluate(() => window.__gm.state.calendar.month)) === 2;
  checks.apptChip = await p.locator('.chip:text("Appointment")').count() > 0;
  await p.screenshot({ path: `${SP}/m5-month2-plan.png` });
  // Bad ending: jump to Act with a debt past the limit
  await p.evaluate(() => { const g = window.__gm; while (g.machine.current.name !== 'Act') { g.state.pendingEvent = null; g.bus.emit('intent.nextPhase'); } g.state.debt.balance = g.content.num('DEBT_LIMIT') + 500; });
  await p.waitForTimeout(200);
  await p.click('#closeMonth'); await p.waitForTimeout(300);
  checks.badEnding = (await phase()) === 'Ending' && (await p.locator('.ending h1').textContent()) === 'Bad Ending';
  await p.screenshot({ path: `${SP}/m5-ending.png` });
  await p.reload(); await p.waitForTimeout(1200);
  checks.endingAfterReload = (await phase()) === 'Ending';
  console.log(JSON.stringify(checks));
  console.log('errors', errs); await b.close();
  if (errs.length || Object.values(checks).some((v) => !v)) process.exit(1);
})();
