// UI placeholder export (npm run export:ui): cuts every component variant of the interface sheet (sheet.html)
// into its own PNG (2x, transparent background), for the Unity developer to use until the final art arrives (user, 11 Nov 2026).
// Output: out/export/png/, out/export/manifest.json and manifest.csv.
// File name: <ID>_<component-name>_<variant>.png, for example BTN-03_gold-action-button_hover.png.
// PNG only by default (user choice). Optional SVG: EXPORT_SVG=vector (true vector for pure-SVG parts, else PNG inside) or embed.
// Options (env): EXPORT_SCALE (default 2), EXPORT_SVG = none | vector | embed (default none).
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(path.dirname(process.argv[2] || 'out/browser'), 'export');
const URL = 'http://localhost:5173/sheet.html';
const SCALE = Number(process.env.EXPORT_SCALE || 2);
const SVG = process.env.EXPORT_SVG || 'none';
const PAD = 4; // px around the part, so outlines and small offsets are not cut

/** 9-slice borders (1x px, left/right/top/bottom) for parts that stretch. Unity: Sprite Editor > Border (multiply by scale). */
const NINE = {
  'FRM-01': [26, 26, 26, 26], 'FRM-02': [16, 16, 16, 16], 'FRM-03': [16, 16, 16, 16], 'FRM-04': [26, 26, 56, 26],
  'BTN-01': [24, 24, 0, 0], 'BTN-02': [24, 24, 0, 0], 'BTN-03': [24, 24, 0, 0], 'BTN-04': [18, 18, 0, 0], 'BTN-07': [24, 24, 0, 0],
  'TTL-02': [60, 60, 0, 0], 'CHP-01': [16, 16, 0, 0], 'CHP-06': [16, 16, 0, 0], 'LST-02': [12, 12, 32, 12], 'CRD-01': [26, 26, 26, 26]
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default';

(async () => {
  for (const d of ['png', 'svg']) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'png'), { recursive: true });
  if (SVG !== 'none') fs.mkdirSync(path.join(OUT, 'svg'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: SCALE });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL);
  await page.waitForSelector('body[data-ready="1"]');
  await page.evaluate(() => document.fonts.ready);
  // Export look: no page or stage backgrounds, no clipping, no fit-to-card zoom, no labels.
  await page.addStyleTag({ content: `
    html, body.sheetpage, .sh-card, .sh-stage { background: transparent !important; box-shadow: none !important; overflow: visible !important; }
    .sh-tag, .sh-meta, .sh-head, .sh-notes, .sh-sec > h2 { visibility: hidden !important; }
    .sh-card { width: auto !important; max-width: none !important; }
    body.cut .sh-var { visibility: hidden !important; } body.cut .sh-var.cur > :first-child { visibility: visible !important; }` });
  await page.evaluate(() => document.querySelectorAll('.sh-var > *').forEach((e) => { e.style.zoom = ''; }));
  await page.waitForTimeout(400);

  const parts = await page.evaluate((pad) => {
    const out = [];
    for (const [k, v] of [...document.querySelectorAll('.sh-var')].entries()) {
      const el = v.firstElementChild;
      if (!el || el.classList.contains('sh-tag')) continue;
      // Visual box: the part and everything inside it (corners, labels and arrows can stick out).
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      for (const n of [el, ...el.querySelectorAll('*')]) {
        const q = n.getBoundingClientRect();
        if (!q.width || !q.height || getComputedStyle(n).visibility === 'hidden') continue;
        l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
      }
      // Pure SVG: every element is SVG or an empty wrapper with no paint of its own.
      const plain = (n) => { const c = getComputedStyle(n); return c.backgroundImage === 'none' && c.backgroundColor === 'rgba(0, 0, 0, 0)' && c.boxShadow === 'none' && c.borderStyle === 'none' && c.filter === 'none'; };
      const svgs = [...el.querySelectorAll('svg')].concat(el.tagName.toLowerCase() === 'svg' ? [el] : []);
      const html = [el, ...el.querySelectorAll('*')].filter((n) => !(n instanceof SVGElement));
      const pure = svgs.length > 0 && html.every((n) => plain(n) && [...n.childNodes].every((c) => c.nodeType !== 3 || !c.textContent.trim()));
      out.push({ k, id: v.dataset.id, name: v.dataset.name, variant: v.dataset.variant, cls: v.dataset.cls, pure,
        box: { x: Math.floor(l - pad + scrollX), y: Math.floor(t - pad + scrollY), w: Math.ceil(r - l + 2 * pad), h: Math.ceil(b - t + 2 * pad) } });
    }
    return out;
  }, PAD);

  const names = new Map();
  const rows = [];
  const defs = SVG === 'vector' ? await page.evaluate(() => document.querySelector('body > svg defs')?.outerHTML ?? '') : '';
  for (const [i, p] of parts.entries()) {
    let base = `${p.id}_${slug(p.name)}_${slug(p.variant)}`;
    const n = (names.get(base) ?? 0) + 1;
    names.set(base, n);
    if (n > 1) base += `-${n}`;
    // Show only this part, so a neighbour inside the box is not in the PNG.
    await page.evaluate((k) => { document.body.classList.add('cut'); document.querySelectorAll('.sh-var').forEach((v, j) => v.classList.toggle('cur', j === k)); }, p.k);
    const png = await page.screenshot({ clip: { x: p.box.x, y: p.box.y, width: p.box.w, height: p.box.h }, omitBackground: true, fullPage: true });
    fs.writeFileSync(path.join(OUT, 'png', `${base}.png`), png);
    let svgType = '';
    if (SVG !== 'none') {
      let svg = null;
      if (SVG === 'vector' && p.pure) {
        svg = await page.evaluate(({ k, box, defs }) => {
          const v = document.querySelectorAll('.sh-var')[k], el = v.firstElementChild;
          const svgs = el.tagName.toLowerCase() === 'svg' ? [el] : [...el.querySelectorAll('svg')].filter((s) => !s.parentElement.closest('svg'));
          const inner = svgs.map((s) => {
            const q = s.getBoundingClientRect(), c = s.cloneNode(true);
            c.setAttribute('x', (q.left + scrollX - box.x).toFixed(2)); c.setAttribute('y', (q.top + scrollY - box.y).toFixed(2));
            c.setAttribute('width', q.width.toFixed(2)); c.setAttribute('height', q.height.toFixed(2));
            c.removeAttribute('class'); c.removeAttribute('style');
            return c.outerHTML;
          }).join('');
          return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${box.w}" height="${box.h}" viewBox="0 0 ${box.w} ${box.h}">${/href="#/.test(inner) ? defs : ''}${inner}</svg>`;
        }, { k: p.k, box: p.box, defs });
        svgType = 'vector';
      }
      if (!svg) {
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${p.box.w}" height="${p.box.h}" viewBox="0 0 ${p.box.w} ${p.box.h}"><image width="${p.box.w}" height="${p.box.h}" href="data:image/png;base64,${png.toString('base64')}"/></svg>`;
        svgType = 'png-in-svg';
      }
      fs.writeFileSync(path.join(OUT, 'svg', `${base}.svg`), svg);
    }
    const nine = NINE[p.id];
    rows.push({ id: p.id, name: p.name, variant: p.variant || 'default', png: `png/${base}.png`, svg: SVG === 'none' ? '' : `svg/${base}.svg`, svgType,
      width: p.box.w, height: p.box.h, scale: SCALE, nineSlice: nine ? { left: nine[0], right: nine[1], top: nine[2], bottom: nine[3] } : null, css: p.cls });
  }
  await browser.close();

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    note: 'Placeholder UI parts from the BloomLunas prototype interface sheet. Width and height are 1x px (1280x720 screen). PNG pixels = size x scale. nineSlice is in 1x px: multiply by scale for the Unity Sprite Editor border.',
    scale: SCALE, count: rows.length, parts: rows }, null, 1));
  const csv = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  fs.writeFileSync(path.join(OUT, 'manifest.csv'), ['id,name,variant,png,svg,svg_type,width,height,scale,nine_left,nine_right,nine_top,nine_bottom,css',
    ...rows.map((r) => [r.id, r.name, r.variant, r.png, r.svg, r.svgType, r.width, r.height, r.scale, r.nineSlice?.left, r.nineSlice?.right, r.nineSlice?.top, r.nineSlice?.bottom, r.css].map(csv).join(','))].join('\n'));
  const vec = rows.filter((r) => r.svgType === 'vector').length;
  console.log(`export: ${rows.length} parts at ${SCALE}x, ${vec} vector SVG -> ${OUT}`);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
})();
