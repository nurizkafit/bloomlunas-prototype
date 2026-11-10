// Negative energy and notices (user request 10 Nov 2026): HUD energy below zero, the "Tomorrow" penalty,
// a ready-commission toast, the Journal badge and the Quests tab. Screenshots in out/browser/.
const { chromium } = require('playwright');
const out = process.argv[2] || 'out/browser';
const URL = 'http://localhost:5173/';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const shot = async (name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${name}.png` }); };
  await page.goto(URL + '?new&seed=5');
  await page.waitForSelector('.letter');
  await page.getByRole('button', { name: 'Fold the letter' }).click();
  await page.waitForSelector('.book');
  await ev(() => {
    const { gm, ui } = window.__bl;
    gm.state.tutorialOff = true;
    const goals = gm.content.all('goals');
    gm.state.plan.goals = gm.state.plan.goals.map(() => goals[0].id);
    gm.lockPlan();
    if (gm.state.pendingEvent) gm.action('respondEvent', { index: 0 });
    ui.drawNow();
  });
  await page.waitForSelector('.daydial');
  await page.addStyleTag({ content: '.toast { animation: none !important; }' });
  // Negative energy: walk with too little energy.
  await ev(() => { const { gm } = window.__bl; gm.state.cal.minute = 8 * 60; gm.state.energy = 3; gm.action('travel', { place: 'guild' }); window.__bl.ui.drawNow(); });
  const en = await ev(() => window.__bl.gm.state.energy);
  if (en >= 0) errors.push(`energy should be negative after travel, got ${en}`);
  await page.waitForSelector('.daydial .en .tm');
  await shot('notice-01-negative-energy');
  // Ready commission: take one, then get the products.
  await ev(() => {
    const { gm } = window.__bl;
    const id = gm.state.quests.board[0], q = gm.content.get('quests', id);
    gm.action('questTake', { id });
    const tier = Object.keys(gm.content.num('QUALITY_TIERS'))[0];
    gm.state.inv[`${q.item}|product|${tier}`] = (gm.state.inv[`${q.item}|product|${tier}`] ?? 0) + q.qty;
    gm.state.quests.requests = [{ item: 'turmeric', variant: 'dried', qty: 5, cost: 30, day: 1, readyDay: 3 }];
    // WebGL screenshots are slow here: keep the toasts on screen for the shot (no fade, no timer).
    const st = window.setTimeout;
    window.setTimeout = () => 0;
    gm.action('shortBreak');
    window.setTimeout = st;
    window.__bl.ui.drawNow();
  });
  await page.waitForSelector('.toast.news');
  await page.waitForSelector('.rb .dot');
  await page.screenshot({ path: `${out}/notice-02-toast-badge.png` });
  await ev(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
  await ev(() => window.__bl.ui.set({ journal: true, tab: 'quests', station: null }));
  await page.waitForSelector('.tab[data-label="Quests"]');
  await shot('notice-03-quests-tab');
  await page.waitForTimeout(300);
  const still = await ev(() => window.__bl.gm.sys.notices.unread('quests'));
  if (still) errors.push('Quests tab should be read after it opens');
  await browser.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('notices ok');
})();
