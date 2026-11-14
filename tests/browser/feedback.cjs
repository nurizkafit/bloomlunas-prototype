// Game feel (user 14 Nov 2026): HUD number pop, coins on a sale, burst when a product is made, level-up banner,
// day result card, sound button. Effects are paused for each screenshot. Screenshots in out/browser/fx-*.png.
const { chromium } = require('playwright');
const out = process.argv[2] || 'out/browser';
const URL = 'http://localhost:5173/';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const need = async (sel, what) => { if (!(await page.$(sel))) errors.push(`missing ${what} (${sel})`); };
  // Freeze running effects: pause animations and keep effect elements in the layer.
  // The swiftshader page is slow, so each effect is moved to 30% of its run (where it is in full view).
  const freeze = () => ev(() => {
    document.getAnimations().forEach((a) => { a.pause(); const t = a.effect?.getTiming?.(); if (t && typeof t.duration === 'number') a.currentTime = (t.delay || 0) + t.duration * 0.3; });
    window.__keep = true;
  });
  const thaw = () => ev(() => {
    window.__keep = false;
    document.getAnimations().forEach((a) => a.finish?.());
    document.querySelectorAll('.juice > *').forEach((e) => e.remove());
  });
  const shot = async (name) => { await page.screenshot({ path: `${out}/fx-${name}.png` }); };

  await page.addInitScript(() => {
    const orig = Element.prototype.remove;
    Element.prototype.remove = function () { if (window.__keep && this.parentElement?.classList?.contains('juice')) return; orig.call(this); };
  });
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
  await need('.mutebtn', 'sound button');

  // Sound button: toggles and keeps the choice.
  await page.click('.mutebtn');
  const muted = await ev(() => window.__bl.ui.views.fb.audio.muted);
  if (!muted) errors.push('sound button did not mute');
  await page.click('.mutebtn');

  // 1. Market sale: coins fly to the gold pill, gold pops up.
  const sold = await ev(() => {
    const { gm, ui } = window.__bl;
    const tiers = Object.keys(gm.content.num('QUALITY_TIERS'));
    const prod = gm.content.all('items').find((i) => i.variants?.includes('product') || i.kind === 'product') ?? gm.content.all('items')[0];
    gm.state.inv[`${prod.id}|product|${tiers[0]}`] = 10;
    gm.state.place = 'market'; gm.state.cal.minute = 10 * 60;
    ui.views.fb.ptr = { x: 640, y: 420 };
    const r = gm.action('marketSell', { lines: [{ item: prod.id, tier: tiers[0], qty: 5 }] });
    return r?.ok ? r.income : `refused: ${r?.reason}`;
  });
  if (typeof sold !== 'number') errors.push(`market sale failed: ${sold}`);
  await page.waitForTimeout(300);
  await freeze();
  await need('.juice .coinfly', 'flying coins');
  await need('.juice .numpop.up', 'gold +pop');
  await shot('01-sale-coins');
  await thaw();

  // 2. Product made: burst with +N and stars (fired the same way as a craft result).
  await ev(() => {
    const { gm } = window.__bl;
    const tier = Object.keys(gm.content.num('QUALITY_TIERS'))[1];
    window.__bl.ui.views.fb.ptr = { x: 640, y: 400 };
    gm.bus.emit('action.done', { ok: true, id: 'craft', out: 6, tier });
  });
  await page.waitForTimeout(250);
  await freeze();
  await need('.juice .burst .tier', 'craft burst with stars');
  await shot('02-craft-burst');
  await thaw();

  // 3. Skill level-up banner.
  await ev(() => {
    const { gm } = window.__bl;
    gm.sys.skills.add('moon', gm.content.num('XP_LEVELS')[1]);
    gm.bus.emit('state.changed', {});
  });
  await page.waitForTimeout(350);
  await freeze();
  await need('.juice .fbanner', 'level-up banner');
  await shot('03-level-banner');
  await thaw();

  // 4. Sleep: day result card after the night fade.
  await ev(() => { const { gm } = window.__bl; gm.action('sleep'); });
  await page.waitForTimeout(await ev(() => window.__bl.gm.content.num('SLEEP_FADE_MS') + 500));
  await freeze();
  await need('.juice .daycard', 'day result card');
  await shot('04-day-card');
  await thaw();

  // 5. Spending: debt or gold pops down.
  await ev(() => {
    const { gm } = window.__bl;
    gm.state.place = 'market'; gm.state.cal.minute = 10 * 60;
    if (gm.state.pendingEvent) gm.action('respondEvent', { index: 0 });
    gm.action('buyFood', { qty: 2 });
  });
  await page.waitForTimeout(200);
  await freeze();
  await need('.juice .numpop.down', 'gold -pop');
  await shot('05-spend-pop');
  await thaw();

  await browser.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('feedback ok');
})();
