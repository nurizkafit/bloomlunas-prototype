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
  /** @param {{base?: string, zipName?: string, cmd?: string, intro?: string}} [o] */
  constructor({ base = './ui-export/', zipName = 'bloomlunas-ui', cmd = 'npm run export:ui', intro = 'PNG at 2x, clear background. Tick the parts you want, or use the PNG link under a part.' } = {}) {
    this.base = base;
    this.zipName = zipName;
    this.cmd = cmd;
    this.intro = intro;
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
      h('span', {}, h('b', {}, 'Downloads: '), this.intro),
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
      this.status.textContent = `No PNG files yet. Run ${this.cmd}, then reload.`;
      this.status.classList.add('bad');
      return;
    }
    for (const row of this.manifest.parts) this.rows.set(row.png.replace(/^png\/|\.png$/g, ''), row);
    let stale = 0;
    for (const v of document.querySelectorAll('.sh-var[data-file]')) {
      const f = v.dataset.file, a = v.querySelector('.sh-get'), box = v.querySelector('.sh-pick');
      if (!this.rows.has(f)) { stale += 1; a.title = `No PNG for this part. Run ${this.cmd} again.`; a.classList.add('off'); continue; }
      a.href = `${this.base}png/${f}.png`; a.download = `${f}.png`; a.removeAttribute('aria-disabled');
      box.disabled = false;
    }
    this.links.append(h('a', { href: `${this.base}manifest.json`, download: 'manifest.json' }, 'manifest.json'), h('a', { href: `${this.base}manifest.csv`, download: 'manifest.csv' }, 'manifest.csv'));
    this.btnAll.disabled = this.rows.size === 0;
    this.status.textContent = `${this.rows.size} PNG files.${stale ? ` ${stale} parts have no PNG: run ${this.cmd} again.` : ''}`;
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
      zip.add('manifest.csv', enc(SheetDownloads.csv(rows, this.manifest.columns)));
      const a = h('a', { href: URL.createObjectURL(zip.blob()), download: `${this.zipName}-${tag}-${rows.length}.zip` });
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

  /**
   * Same columns as manifest.csv from the export. A manifest can name its own columns: [[header, field path], ...].
   * @param {any[]} rows @param {[string, string][]} [cols]
   */
  static csv(rows, cols = SheetDownloads.COLS) {
    const q = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
    const get = (r, path) => { const v = path.split('.').reduce((o, k) => o?.[k], r); return Array.isArray(v) ? v.join(' ') : v; };
    return [cols.map((c) => c[0]).join(','), ...rows.map((r) => cols.map((c) => q(get(r, c[1]))).join(','))].join('\n');
  }

  static COLS = [['id', 'id'], ['name', 'name'], ['variant', 'variant'], ['png', 'png'], ['svg', 'svg'], ['svg_type', 'svgType'], ['width', 'width'], ['height', 'height'], ['scale', 'scale'],
    ['nine_left', 'nineSlice.left'], ['nine_right', 'nineSlice.right'], ['nine_top', 'nineSlice.top'], ['nine_bottom', 'nineSlice.bottom'], ['css', 'css']];
}
