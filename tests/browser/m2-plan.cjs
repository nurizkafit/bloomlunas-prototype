const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto('http://localhost:5173'); await p.waitForTimeout(800);
  // drag Open shop deck card to Monday 09:00
  const drag = async (sel, d, hour) => {
    const src = await p.locator(sel).first().boundingBox();
    const col = await p.locator(`.col[data-d="${d}"]`).boundingBox();
    await p.mouse.move(src.x + 20, src.y + 10); await p.mouse.down();
    await p.mouse.move(src.x + 40, src.y + 40, { steps: 3 });
    const y = col.y + (hour - 7) * 36 + 9; await p.mouse.move(col.x + 20, y, { steps: 8 }); await p.mouse.up();
    await p.waitForTimeout(150);
  };
  await drag('.dc[data-type="open_shop"]', 0, 9);
  await drag('.dc[data-type="explore"]', 1, 7);
  await drag('.dc[data-type="open_shop"]', 6, 9); // Sunday: closed
  await drag('.dc[data-type="craft"]', 2, 13);
  console.log('cards', await p.locator('.bc').count(), 'toast', await p.locator('.toast').textContent().catch(()=>'-'));
  await p.screenshot({ path: process.argv[2] + '/m2-week.png' });
  await p.locator('.bc').first().click(); await p.waitForTimeout(150);
  console.log('pop', (await p.locator('.pop h3').textContent()));
  await p.screenshot({ path: process.argv[2] + '/m2-pop.png' });
  await p.keyboard.press('Escape');
  for (const t of ['ledger','market','town','journal']) { await p.click(`.tab[data-tab="${t}"]`); await p.waitForTimeout(150); await p.screenshot({ path: process.argv[2] + `/m2-${t}.png` }); }
  await p.click('#confirmBtn'); await p.waitForTimeout(150);
  await p.screenshot({ path: process.argv[2] + '/m2-review.png' });
  await p.click('#startBtn'); await p.waitForTimeout(200);
  console.log('phase', await p.textContent('#dev-phase'), 'planner hidden', await p.locator('#pbFit').isHidden(), 'locked', await p.evaluate(() => window.__gm.state.plan.locked), 'cards', await p.evaluate(() => window.__gm.state.plan.cards.length));
  console.log('errors', errs); await b.close();
  if (errs.length) process.exit(1);
})();
