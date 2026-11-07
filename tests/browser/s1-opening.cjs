// Scene & Flow stage 1: start menu, story premise, Journal in Check (read only).
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.setDefaultTimeout(8000);
  const out = {};
  await p.goto('http://localhost:5173/'); await p.waitForTimeout(900);
  out.menu = await p.locator('.opening .op-menu').isVisible();
  out.loadDisabled = await p.locator('#smLoad').isDisabled();
  await p.screenshot({ path: `${SP}/s1-start-menu.png` });
  await p.click('#smNew'); await p.waitForTimeout(1200);
  out.url = new URL(p.url()).search;
  out.story = await p.locator('.op-letter h2').textContent();
  await p.screenshot({ path: `${SP}/s1-story.png` });
  await p.click('#smBegin'); await p.waitForTimeout(150);
  out.plan = await p.locator('#pbFit').isVisible();
  // Check: open the Journal from the recap.
  const phase = () => p.textContent('#dev-phase');
  const answer = async () => { while (await p.locator('.evscrim').isVisible()) { await p.locator('.evopt:not([disabled])').last().click(); await p.waitForTimeout(60); } };
  for (let i = 0; i < 12 && (await phase()) !== 'Check'; i++) { await answer(); await p.click('#dev-next'); await p.waitForTimeout(150); }
  await answer();
  out.phase = await phase();
  await p.click('.screen [data-journal]'); await p.waitForTimeout(150);
  out.journal = await p.locator('#pbFit.read').isVisible();
  out.tab = await p.locator('.tab[aria-selected="true"] b').textContent();
  await p.screenshot({ path: `${SP}/s1-journal-check.png` });
  await p.click('#confirmBtn'); await p.waitForTimeout(100);
  out.closed = !(await p.locator('#pbFit').isVisible());
  // Reload with a save: the start menu offers Load.
  await p.goto('http://localhost:5173/'); await p.waitForTimeout(900);
  out.loadEnabled = !(await p.locator('#smLoad').isDisabled());
  await p.click('#smLoad'); await p.waitForTimeout(100);
  out.menuClosed = !(await p.locator('.opening').isVisible());
  console.log('opening', JSON.stringify(out));
  console.log('errors', JSON.stringify(errs));
  const ok = out.menu && out.loadDisabled && out.url === '?play' && /letter/i.test(out.story) && out.plan && out.phase === 'Check'
    && out.journal && out.tab === 'Skills' && out.closed && out.loadEnabled && out.menuClosed;
  await b.close();
  process.exit(ok && !errs.length ? 0 : 1);
})();
