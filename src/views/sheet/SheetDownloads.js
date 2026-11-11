import { ZipWriter } from './ZipWriter.js';

const h = (tag, props = {}, ...kids) => {
  const [name, ...cls] = tag.split('.');
  const el = document.createElement(name);
  if (cls.length) el.className = cls.join(' ');
  for (const [k, v] of Object.entries(props)) if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v != null) el.setAttribute(k, v);
  el.append(...kids.flat().filter((x) => x != null));
  return el;
};

/**
 * SheetDownloads: the download tools of the interface sheet (user, 11 Nov 2026).
 * The PNGs come from npm run export:ui, which writes them to assets/ui-export/ (served as ./ui-export/).
 * Each variant gets a check box and a PNG link. The bar downloads the selected parts, or all parts, as one zip with its manifest.
 */
export class SheetDownloads {
  constructor(base = './ui-export/') {
    this.base = base;
    /** @type {Map<string, any>} manifest row by file name (without .png) */
    this.rows = new Map();
    this.manifest = null;
    this.count = h('b', {}, '0');
    this.status = h('span.sh-dlstate', {}, 'Looking for the PNG files ...');
    this.btnSel = h('button', { type: 'button', disabled: '', onclick: () => this.download(this.picked(), 'selected') }, 'Download selected (.zip)');
    this.btnAll = h('button', { type: 'button', disabled: '', onclick: () => this.download([...this.rows.keys()], 'all') }, 'Download all (.zip)');
    this.btnClr = h('button.alt', { type: 'button', onclick: () => this.pick(document.querySelectorAll('.sh-pick'), false) }, 'Clear');
    this.links = h('span.sh-dlfiles');
  }

  /** The bar at the top of the sheet. */
  bar() {
    return h('div.sh-dlbar', {},
      h('span', {}, h('b', {}, 'Unity placeholders: '), 'PNG at 2x, clear background. Tick the parts you want, or use the PNG link under a part.'),
      h('span.sh-dlsel', {}, this.count, ' selected'), this.btnSel, this.btnClr, this.btnAll, this.links, this.status);
  }

  /** Add a check box and a PNG link to each variant, then load the manifest. */
  async mount() {
    for (const v of document.querySelectorAll('.sh-var[data-file]')) {
      const f = v.dataset.file;
      v.append(h('div.sh-dl', {},
        h('label', { title: 'Select for the zip' }, h('input.sh-pick', { type: 'checkbox', value: f, disabled: '', onchange: () => this.update() })),
        h('a.sh-get', { title: `${f}.png`, 'aria-disabled': 'true' }, 'PNG')));
    }
    for (const c of document.querySelectorAll('.sh-card')) {
      const picks = () => c.querySelectorAll('.sh-pick:not(:disabled)');
      c.querySelector('.sh-id')?.append(h('button.sh-pickall', { type: 'button', onclick: () => { const p = picks(); this.pick(p, [...p].some((x) => !x.checked)); } }, 'Select all'));
    }
    try {
      const r = await fetch(`${this.base}manifest.json`);
      if (!r.ok || !/json/.test(r.headers.get('content-type') ?? '')) throw new Error('no manifest');
      this.manifest = await r.json();
    } catch {
      this.status.textContent = 'No PNG files yet. Run npm run export:ui, then reload.';
      this.status.classList.add('bad');
      return;
    }
    for (const row of this.manifest.parts) this.rows.set(row.png.replace(/^png\/|\.png$/g, ''), row);
    let stale = 0;
    for (const v of document.querySelectorAll('.sh-var[data-file]')) {
      const f = v.dataset.file, a = v.querySelector('.sh-get'), box = v.querySelector('.sh-pick');
      if (!this.rows.has(f)) { stale += 1; a.title = 'No PNG for this part. Run npm run export:ui again.'; a.classList.add('off'); continue; }
      a.href = `${this.base}png/${f}.png`; a.download = `${f}.png`; a.removeAttribute('aria-disabled');
      box.disabled = false;
    }
    this.links.append(h('a', { href: `${this.base}manifest.json`, download: 'manifest.json' }, 'manifest.json'), h('a', { href: `${this.base}manifest.csv`, download: 'manifest.csv' }, 'manifest.csv'));
    this.btnAll.disabled = this.rows.size === 0;
    this.status.textContent = `${this.rows.size} PNG files.${stale ? ` ${stale} parts have no PNG: run npm run export:ui again.` : ''}`;
    this.status.classList.toggle('bad', stale > 0);
    document.body.dataset.downloads = String(this.rows.size);
  }

  /** @param {Iterable<HTMLInputElement>} boxes @param {boolean} on */
  pick(boxes, on) {
    for (const b of boxes) b.checked = on;
    this.update();
  }

  update() {
    const n = this.picked().length;
    this.count.textContent = String(n);
    this.btnSel.disabled = n === 0;
  }

  /** @returns {string[]} file names of the ticked variants */
  picked() { return [...document.querySelectorAll('.sh-pick:checked')].map((b) => b.value); }

  /** Fetch the PNGs and save them as one zip, with a manifest of only these parts. @param {string[]} files @param {string} tag */
  async download(files, tag) {
    const rows = files.map((f) => this.rows.get(f)).filter(Boolean);
    if (!rows.length) return;
    const btns = [this.btnSel, this.btnAll];
    btns.forEach((b) => { b.disabled = true; });
    try {
      const zip = new ZipWriter();
      for (const [i, row] of rows.entries()) {
        this.status.textContent = `Packing ${i + 1} of ${rows.length} ...`;
        zip.add(row.png, new Uint8Array(await (await fetch(this.base + row.png)).arrayBuffer()));
      }
      const enc = (s) => new TextEncoder().encode(s);
      zip.add('manifest.json', enc(JSON.stringify({ ...this.manifest, count: rows.length, parts: rows }, null, 1)));
      zip.add('manifest.csv', enc(SheetDownloads.csv(rows)));
      const a = h('a', { href: URL.createObjectURL(zip.blob()), download: `bloomlunas-ui-${tag}-${rows.length}.zip` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      this.status.textContent = `Saved ${rows.length} PNG files in one zip.`;
    } catch (e) {
      this.status.textContent = `Download failed: ${e.message}`;
    } finally {
      this.btnAll.disabled = false;
      this.update();
    }
  }

  /** Same columns as manifest.csv from the export. */
  static csv(rows) {
    const q = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
    return ['id,name,variant,png,svg,svg_type,width,height,scale,nine_left,nine_right,nine_top,nine_bottom,css',
      ...rows.map((r) => [r.id, r.name, r.variant, r.png, r.svg, r.svgType, r.width, r.height, r.scale, r.nineSlice?.left, r.nineSlice?.right, r.nineSlice?.top, r.nineSlice?.bottom, r.css].map(q).join(','))].join('\n');
  }
}
