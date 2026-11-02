const { chromium } = require('playwright');
const fs = require('node:fs');
const model = 'assets/models/loc_market.glb';
fs.copyFileSync('tests/fixtures/test_model.glb', model);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173'); await p.waitForTimeout(1000);
  await p.evaluate(() => window.__gm.bus.emit('intent.nextPhase')); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const t = window.__ui.town; return { market: !!t.slots.get('loc_market').model, shop: !!t.slots.get('loc_home_shop').model, greyboxHidden: !t.slots.get('loc_market').greybox.visible }; });
  console.log('glb', JSON.stringify(r), 'check btn hidden on Mon:', await p.locator('#hCheck').isHidden());
  await p.screenshot({ path: process.argv[2] + '/m3-glb.png' });
  console.log('errors', errs); await b.close();
  fs.rmSync(model);
  if (!r.market || !r.greyboxHidden || errs.length) process.exit(1);
})();
