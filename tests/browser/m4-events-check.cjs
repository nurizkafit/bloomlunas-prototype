const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:5173'); await p.waitForTimeout(1000);
  const seen = [];
  const playWeek = async (shot) => {
    for (let i = 0; i < 40; i++) {
      if (await p.locator('.evscrim').isVisible()) {
        seen.push(await p.locator('.evcard h2').textContent());
        if (shot && seen.length === 1) await p.screenshot({ path: `${SP}/m4-event.png` });
        await p.locator('.evopt:not([disabled])').last().click(); await p.waitForTimeout(80); continue;
      }
      if (await p.locator('#hCheck').isVisible()) { await p.click('#hCheck'); break; }
      await p.click('#hSleep'); await p.waitForTimeout(80);
    }
  };
  // Week 1
  await p.click('#confirmBtn'); await p.click('#startBtn'); await p.waitForTimeout(300);
  await playWeek(false);
  await p.fill('#rcNote', 'Keep 40 G for events.');
  await p.screenshot({ path: `${SP}/m4-recap-w1.png` });
  await p.click('#rcNext'); await p.waitForTimeout(300);
  await p.click('.tab[data-tab="journal"]'); await p.waitForTimeout(150);
  const note = await p.locator('.notecard p').first().textContent();
  console.log('journal note in next Plan:', note);
  const chip = await p.evaluate(() => document.querySelector('.tab[data-tab="week"]') && (window.__ui.planner.tab = 'week', true));
  await p.click('.tab[data-tab="week"]'); await p.waitForTimeout(100);
  console.log('festival chip in Plan:', await p.locator('.chip.fest').count());
  // Week 2: festival (scheduled) + random
  await p.click('#confirmBtn'); await p.click('#startBtn'); await p.waitForTimeout(300);
  await playWeek(true);
  await p.screenshot({ path: `${SP}/m4-recap-w2.png` });
  const r = await p.evaluate(() => { const g = window.__gm, w = g.state.weekReports.at(-1); const types = w.events.map((e) => g.content.get('events', g.content.all('events').find((x) => x.title === e.title).id).type); return { week: w.week, events: w.events.map((e) => e.title), types, recapShown: !document.querySelector('.screen').hidden }; });
  console.log('week 2 events:', JSON.stringify(r), 'cards seen:', seen.join(', '));
  const ok = r.types.includes('scheduled') && r.types.includes('random') && note.includes('40 G');
  console.log('errors', errs); await b.close();
  if (errs.length || !ok) process.exit(1);
})();
