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
  await browser.close();
  console.log(`sheet: ${n} components, ${size.w}x${size.h}`);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  if (n < 50) { console.error('sheet: too few components'); process.exit(1); }
})();
