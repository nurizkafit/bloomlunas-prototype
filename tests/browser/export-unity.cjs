// Unity sprite export (npm run export:unity, user 11 Nov 2026): cuts every sprite of unity.html into its own PNG
// (2x, transparent), with no text. Skins are compact 9-slice sprites. Output: assets/unity-export/png/, manifest.json
// and manifest.csv (size, 9-slice borders in 1x px and in PNG px, Unity Image Type). Vite serves assets/ as is,
// so unity.html links each sprite to its PNG. The files are committed, so the page works after a clone.
// Options (env): EXPORT_SCALE (default 2).
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join('assets', 'unity-export');
const URL = 'http://localhost:5173/unity.html';
const SCALE = Number(process.env.EXPORT_SCALE || 2);

(async () => {
  fs.rmSync(path.join(OUT, 'png'), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'png'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: SCALE });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL);
  await page.waitForSelector('body[data-ready="1"]');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: `
    html, body.sheetpage, .sh-card, .sh-stage { background: transparent !important; box-shadow: none !important; overflow: visible !important; }
    .sh-tag, .sh-meta, .sh-head, .sh-notes, .sh-sec > h2, .sh-dl, .sh-dlbar, .u-guide { visibility: hidden !important; }
    .u-big { zoom: 1 !important; }
    body.cut .sh-var { visibility: hidden !important; } body.cut .sh-var.cur > .u-spr { visibility: visible !important; } body.cut .sh-var.cur .u-guide { visibility: hidden !important; }` });
  await page.waitForTimeout(400);

  const parts = await page.evaluate(() => [...document.querySelectorAll('.sh-var[data-file]')].map((v, k) => {
    const q = v.querySelector('.u-spr').getBoundingClientRect();
    const [pl, pr, pt, pb] = v.dataset.pad.split(',').map(Number);
    // Same size for every state of a part (Sprite Swap): the size comes from the layout size, not the sub-pixel position.
    const x = Math.round(q.left - pl + scrollX), y = Math.round(q.top - pt + scrollY);
    const w = Math.round(v.querySelector('.u-spr').offsetWidth) + pl + pr, h = Math.round(v.querySelector('.u-spr').offsetHeight) + pt + pb;
    const nine = v.dataset.nine ? v.dataset.nine.split(',').map(Number) : null;
    // Borders from the PNG edge: the 9-slice border of the skin + the room around it.
    // The room is a whole number of px on each side, so all states of a part get the same borders.
    const off = { l: pl, r: pr, t: pt, b: pb };
    return { k, file: v.dataset.file, id: v.dataset.id, card: v.dataset.card, sheet: v.dataset.sheet, name: v.dataset.name, variant: v.dataset.variant, mode: v.dataset.mode, box: { x, y, w, h },
      nine: nine && { left: nine[0] + off.l, right: nine[1] + off.r, top: nine[2] ? nine[2] + off.t : 0, bottom: nine[3] ? nine[3] + off.b : 0 } };
  }));

  const rows = [];
  // Unity codes (SK skin, OR ornament, IC icon) are not the sheet codes; sheet = the sheet parts (BTN-03 ...) that use the sprite.
  for (const p of parts) {
    await page.evaluate((k) => { document.body.classList.add('cut'); document.querySelectorAll('.sh-var[data-file]').forEach((v, j) => v.classList.toggle('cur', j === k)); }, p.k);
    const png = await page.screenshot({ clip: { x: p.box.x, y: p.box.y, width: p.box.w, height: p.box.h }, omitBackground: true, fullPage: true });
    fs.writeFileSync(path.join(OUT, 'png', `${p.file}.png`), png);
    const r1 = (n) => Math.round(n * 2) / 2, px = (n) => Math.round(n * SCALE);
    const nine = p.nine && { left: r1(p.nine.left), right: r1(p.nine.right), top: r1(p.nine.top), bottom: r1(p.nine.bottom) };
    rows.push({ code: p.id, card: p.card, sheet: p.sheet.split(' '), name: p.name, variant: p.variant, png: `png/${p.file}.png`, mode: p.mode, width: p.box.w, height: p.box.h, scale: SCALE,
      nineSlice: nine, nineSlicePx: p.nine && { left: px(p.nine.left), right: px(p.nine.right), top: px(p.nine.top), bottom: px(p.nine.bottom) } });
  }
  await browser.close();

  const columns = [['code', 'code'], ['card', 'card'], ['sheet_ids', 'sheet'], ['name', 'name'], ['variant', 'variant'], ['png', 'png'], ['mode', 'mode'], ['width', 'width'], ['height', 'height'], ['scale', 'scale'],
    ['nine_left', 'nineSlice.left'], ['nine_right', 'nineSlice.right'], ['nine_top', 'nineSlice.top'], ['nine_bottom', 'nineSlice.bottom'],
    ['nine_left_px', 'nineSlicePx.left'], ['nine_right_px', 'nineSlicePx.right'], ['nine_top_px', 'nineSlicePx.top'], ['nine_bottom_px', 'nineSlicePx.bottom']];
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    note: 'Unity sprites from the BloomLunas prototype (unity.html). No text. code = Unity sprite code (SK skin, OR ornament, IC icon), card = its card on unity.html, sheet = interface sheet parts that use it. Width and height are 1x px; PNG pixels = size x scale. '
      + 'nineSlicePx = Sprite Editor border in PNG pixels (left, right, top, bottom). mode = Unity Image Type (Sliced, Tiled, Simple). Pixels Per Unit = 100 x scale.',
    scale: SCALE, count: rows.length, columns, parts: rows }, null, 1));
  const q = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  const get = (r, p) => { const v = p.split('.').reduce((o, k) => o?.[k], r); return Array.isArray(v) ? v.join(' ') : v; };
  fs.writeFileSync(path.join(OUT, 'manifest.csv'), [columns.map((c) => c[0]).join(','), ...rows.map((r) => columns.map((c) => q(get(r, c[1]))).join(','))].join('\n'));
  console.log(`export:unity: ${rows.length} sprites at ${SCALE}x, ${rows.filter((r) => r.nineSlice).length} with 9-slice -> ${OUT}`);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
})();
