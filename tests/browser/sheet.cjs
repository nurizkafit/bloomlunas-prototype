// Interface sheet: opens sheet.html, fails on page errors, writes the whole sheet as one PNG and one single-page PDF
// (out/browser/interface-sheet.png and .pdf). Run alone with: npm run sheet
const { chromium } = require('playwright');
const out = process.argv[2] || 'out/browser';
const URL = 'http://localhost:5173/sheet.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  await page.goto(URL);
  try { await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 }); }
  catch { console.error(`sheet: page did not finish\n${errors.join('\n')}`); await browser.close(); process.exit(1); }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const n = await page.locator('.sh-card').count();
  const size = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  await page.screenshot({ path: `${out}/interface-sheet.png`, fullPage: true });
  // PDF from the PNG: a vector PDF of the SVG filters (paper grain, watercolor) is about 200 MB.
  const png = require('node:fs').readFileSync(`${out}/interface-sheet.png`).toString('base64');
  const pdf = await browser.newPage();
  await pdf.setContent(`<style>@page{margin:0}html,body{margin:0}img{display:block;width:${size.w}px}</style><img src="data:image/png;base64,${png}">`);
  await pdf.pdf({ path: `${out}/interface-sheet.pdf`, width: `${size.w}px`, height: `${size.h}px`, printBackground: true, pageRanges: '1' });
  // No sideways overflow (user, 9 Nov 2026): no card wider than the page, no specimen wider than its card.
  const wide = [];
  for (const w of [2400, 1280, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(300);
    const bad = await page.evaluate(() => {
      const out = [];
      const vw = document.documentElement.clientWidth;
      for (const c of document.querySelectorAll('.sh-card')) if (c.getBoundingClientRect().right > vw + 1) out.push(`card ${c.id}`);
      for (const v of document.querySelectorAll('.sh-var')) {
        const st = v.parentElement.getBoundingClientRect(), r = v.firstElementChild.getBoundingClientRect();
        if (r.right > st.right + 1 || r.left < st.left - 1) out.push(`specimen in ${v.closest('.sh-card').id}`);
      }
      return out;
    });
    if (bad.length) wide.push(`${w}px: ${[...new Set(bad)].join(', ')}`);
  }
  await browser.close();
  console.log(`sheet: ${n} components, ${size.w}x${size.h}`);
  if (wide.length) { console.error(`sheet: overflow\n${wide.join('\n')}`); process.exit(1); }
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  if (n < 50) { console.error('sheet: too few components'); process.exit(1); }
})();
