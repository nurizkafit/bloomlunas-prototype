/**
 * HoverPreview: a popup that shows the PNGs of the other page when you hover a link (user, 11 Nov 2026).
 * sheet.html: hover a Unity code (SK-15) to see that sprite and its states (assets/unity-export).
 * unity.html: hover a sheet ID (BTN-03) to see that part and its variants (assets/ui-export).
 * The data comes from the export manifest of the other page, so no page switch is needed. A click still opens the other page.
 */
export class HoverPreview {
  /**
   * @param {{manifest: string, base: string, key: (row: any) => string, title: (key: string, rows: any[]) => string,
   *   meta?: (rows: any[]) => string, tag?: (row: any) => string, max?: number, missing: string}} o
   */
  constructor(o) {
    this.o = { max: 24, tag: (r) => r.variant, meta: () => '', ...o };
    /** @type {Map<string, any[]>} */
    this.groups = new Map();
    this.pop = document.createElement('div');
    this.pop.className = 'sh-pop';
    this.pop.setAttribute('role', 'tooltip');
    this.timer = 0;
  }

  /** Load the manifest, then show the popup for every element that matches the selector. @param {string} selector @param {(el: HTMLElement) => string} keyOf */
  async attach(selector, keyOf) {
    document.body.append(this.pop);
    try {
      const r = await fetch(this.o.manifest);
      if (r.ok && /json/.test(r.headers.get('content-type') ?? '')) {
        for (const row of (await r.json()).parts) {
          const k = this.o.key(row);
          if (!this.groups.has(k)) this.groups.set(k, []);
          this.groups.get(k).push(row);
        }
      }
    } catch { /* no export yet: the popup says so */ }
    const find = (e) => /** @type {HTMLElement} */ (e.target).closest?.(selector);
    const show = (e) => { const el = find(e); if (el) { clearTimeout(this.timer); this.show(el, keyOf(el)); } };
    const hide = (e) => { if (find(e)) this.timer = setTimeout(() => this.hide(), 80); };
    document.addEventListener('mouseover', show);
    document.addEventListener('focusin', show);
    document.addEventListener('mouseout', hide);
    document.addEventListener('focusout', hide);
    addEventListener('scroll', () => this.hide(), { passive: true });
    document.body.dataset.previews = String(this.groups.size);
  }

  /** @param {HTMLElement} el @param {string} key */
  show(el, key) {
    const rows = this.groups.get(key) ?? [];
    const d = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
    this.pop.replaceChildren(d('b', 'sh-pop-t', this.o.title(key, rows)));
    if (!rows.length) {
      this.pop.append(d('p', 'sh-pop-m', this.o.missing));
    } else {
      const meta = this.o.meta(rows);
      if (meta) this.pop.append(d('p', 'sh-pop-m', meta));
      const grid = d('div', 'sh-pop-g');
      for (const r of rows.slice(0, this.o.max)) {
        const img = d('img');
        img.src = this.o.base + r.png;
        img.alt = '';
        // 1x size, so the preview matches the game; very wide parts are scaled down.
        img.style.width = `${Math.min(r.width, 260)}px`;
        const f = d('figure', '');
        f.append(img, d('figcaption', '', this.o.tag(r)));
        grid.append(f);
      }
      this.pop.append(grid);
      if (rows.length > this.o.max) this.pop.append(d('p', 'sh-pop-m', `+ ${rows.length - this.o.max} more. Click to see all.`));
    }
    this.pop.classList.add('on');
    // Below the link; above it when there is no room; never outside the window.
    const q = el.getBoundingClientRect(), p = this.pop.getBoundingClientRect();
    const left = Math.max(8, Math.min(q.left, innerWidth - p.width - 8));
    const top = q.bottom + 8 + p.height < innerHeight ? q.bottom + 8 : Math.max(8, q.top - 8 - p.height);
    Object.assign(this.pop.style, { left: `${left}px`, top: `${top}px` });
  }

  hide() { this.pop.classList.remove('on'); }
}
