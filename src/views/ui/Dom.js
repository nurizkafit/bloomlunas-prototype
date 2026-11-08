import { Icons } from './Icons.js';

/**
 * Dom: tiny element builder for the DOM views (no framework).
 * h('div.cls.cls2', {onclick, html, style, ...attrs}, ...children). Strings become text nodes.
 */
export class Dom {
  /** @param {string} sel @param {any} [attrs] @param {...any} kids */
  static h(sel, attrs, ...kids) {
    const [tag, ...cls] = sel.split('.');
    const el = document.createElement(tag || 'div');
    if (cls.length) el.className = cls.join(' ');
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    for (const [k, v] of Object.entries(attrs ?? {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; }
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'cls') el.className += ` ${v}`;
      else el.setAttribute(k, v === true ? '' : v);
    }
    Dom.append(el, kids);
    return el;
  }

  static append(el, kids) {
    for (const k of kids.flat(9)) {
      if (k === null || k === undefined || k === false) continue;
      el.append(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  }

  /** Raw HTML (trusted: icons only). @param {string} html */
  static raw(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  static icon(name, size = 24) { return Dom.raw(Icons.svg(name, size)); }
  static medal(name, size = 38) { return Dom.raw(Icons.medal(name, size)); }

  /** Rattan main frame (big windows and large cards only). */
  static rattan(cls, ...kids) { return Dom.#frame('rf', cls, kids); }
  /** Slim wood frame (small parts). An optional attrs object can come first in kids. */
  static slim(cls, ...kids) { return Dom.#frame('sf', cls, kids); }

  static #frame(base, cls, kids) {
    const first = kids[0];
    const attrs = first && typeof first === 'object' && !(first instanceof Node) && !Array.isArray(first) ? kids.shift() : {};
    return Dom.h(`div.${base}${cls ? '.' + cls : ''}`, attrs, Dom.h('div.in', ...kids));
  }

  /** Small "?" mark that opens the help popup for a key in data/help/help.json. */
  static help(key) { return Dom.h('span.helpq', { 'data-help': key }, '?'); }

  /** Icon + number chip. @param {string} icon @param {any} n @param {string} [cls] */
  static chip(icon, n, cls = '') { return Dom.h(`span.qchip${cls ? '.' + cls : ''}`, Dom.icon(icon, 18), String(n)); }

  /** Value bar. @param {number} ratio 0..1 @param {string} [cls] @param {number} [w] px */
  static bar(ratio, cls = '', w) {
    const b = Dom.h(`div.bar${cls ? '.' + cls : ''}`, Dom.h('i', { style: { width: `${Math.max(0, Math.min(1, ratio)) * 100}%` } }));
    if (w) b.style.width = `${w}px`;
    return b;
  }

  /** Dots row (filled count of total). */
  /**
   * One dialogue line (TutorialView, RetroView). Data gives a string or {say} (the speaker talks) or {do} (narration).
   * Speech shows the speaker's name, quote marks and upright text; narration shows italic text with no name.
   * @param {string|{say?:string, do?:string}} line @param {string} speaker @param {(t:string)=>string} [fill]
   */
  static line(line, speaker, fill = (t) => t) {
    const narr = typeof line === 'object' && line.do != null;
    const text = fill(typeof line === 'string' ? line : narr ? line.do : line.say ?? '');
    return narr
      ? Dom.h('div.line.narr', Dom.h('p', text))
      : Dom.h('div.line.speech', Dom.h('span.speaker', speaker), Dom.h('p', `\u201C${text}\u201D`));
  }

  /** True when a dialogue line is narration. */
  static isNarr(line) { return typeof line === 'object' && line?.do != null; }

  static dots(total, states) {
    return Dom.h('div.dots', Array.from({ length: total }, (_, i) => Dom.h(`i${states[i] ? '.' + states[i] : ''}`)));
  }

  /** Stepper with - n +. @param {number} n @param {(d:number)=>void} on @param {{min?:number,max?:number,big?:boolean,step?:number}} [o] */
  static stepper(n, on, o = {}) {
    const step = o.step ?? 1;
    return Dom.h(`div.stepper${o.big ? '.big' : ''}`,
      Dom.h('button.iconbtn', { onclick: () => on(-step), disabled: n <= (o.min ?? 0), title: 'Less', html: Icons.svg('minus', 16) }),
      Dom.h('div.n', String(n)),
      Dom.h('button.iconbtn', { onclick: () => on(step), disabled: o.max !== undefined && n >= o.max, title: 'More', html: Icons.svg('plus', 16) }));
  }

  /** Button with an optional cost (time, energy, gold). */
  static btn(label, onclick, o = {}) {
    const cost = [];
    if (o.min) cost.push(Dom.h('span.cost', Dom.icon('clock', 14), Dom.mins(o.min)));
    if (o.energy) cost.push(Dom.h('span.cost', Dom.icon('energy', 14), String(o.energy)));
    if (o.gold) cost.push(Dom.h('span.cost', Dom.icon('gold', 14), String(o.gold)));
    return Dom.h(`button.btn${o.cls ? '.' + o.cls : ''}`, { onclick, disabled: o.disabled, title: o.title }, o.icon ? Dom.icon(o.icon, 20) : null, label, cost);
  }

  /** 90 -> "1h 30", 30 -> "30m". */
  static mins(m) {
    const h = Math.floor(m / 60), r = m % 60;
    return h ? `${h}h${r ? ' ' + r : ''}` : `${r}m`;
  }

  /** Art Nouveau corners for a large frame. */
  static corners() {
    return ['tl', 'tr', 'bl', 'br'].map((c) => Dom.raw(`<svg class="corner ${c}" viewBox="0 0 120 120"><use href="#nouveau"/></svg>`));
  }

  static divider() { return Dom.raw('<svg class="divider" viewBox="0 0 400 20" preserveAspectRatio="xMidYMid meet"><use href="#divider"/></svg>'); }

  /**
   * Compact table list (Interface Reference style): header row + one-line rows with fixed columns.
   * @param {string} cols CSS grid-template-columns
   * @param {any[]} head header cells
   * @param {{cells:any[], on?:boolean, onclick?:Function, disabled?:boolean, title?:string, cls?:string}[]} rows
   * @param {string} [empty] text when there are no rows
   */
  static tlist(cols, head, rows, empty = '—') {
    const row = (r) => Dom.h(`${r.onclick ? 'button' : 'div'}.tlr${r.on ? '.on' : ''}${r.cls ? '.' + r.cls : ''}`, { style: { gridTemplateColumns: cols }, onclick: r.onclick, disabled: r.disabled, title: r.title }, r.cells.map((c) => Dom.h('span', c)));
    return Dom.h('div.tlst',
      Dom.h('div.tlh', { style: { gridTemplateColumns: cols } }, head.map((c) => Dom.h('span', c))),
      Dom.h('div.tlb', rows.length ? rows.map(row) : Dom.h('div.small.muted', { style: { padding: '8px' } }, empty)));
  }

  /** Small - n + stepper for a list row. */
  static mini(n, on, o = {}) {
    const step = o.step ?? 1;
    return Dom.h('span.mstep',
      Dom.h('button', { onclick: (e) => { e.stopPropagation(); on(-step); }, disabled: n <= (o.min ?? 0), title: 'Less', html: Icons.svg('minus', 10) }),
      Dom.h('b', String(n)),
      Dom.h('button', { onclick: (e) => { e.stopPropagation(); on(step); }, disabled: o.max !== undefined && n >= o.max, title: 'More', html: Icons.svg('plus', 10) }));
  }

  /** Budget jar SVG filled to a ratio. @param {number} ratio @param {string} color @param {number} [size] */
  static jarSvg(ratio, color, size = 40) {
    const r = Math.max(0, Math.min(1, ratio)), y = 40 - r * 28, id = `j${color.slice(1)}${Math.round(r * 100)}`;
    return `<svg width="${size}" height="${Math.round(size * 1.1)}" viewBox="0 0 40 44"><defs><clipPath id="${id}"><path d="M9 10h22l3 6v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z"/></clipPath></defs>
      <path d="M9 10h22l3 6v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z" fill="#F4ECDB" stroke="#2D3B3A" stroke-width="2"/>
      <rect x="0" y="${y}" width="40" height="44" fill="${color}" clip-path="url(#${id})" opacity=".9"/>
      <path d="M9 10h22l3 6v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z" fill="none" stroke="#2D3B3A" stroke-width="2"/>
      <rect x="8" y="4" width="24" height="6" rx="2" fill="#C8955A" stroke="#2D3B3A" stroke-width="1.6"/></svg>`;
  }

  /** Quality stars for a tier. */
  static stars(n) { return Dom.h('span.tier', Array.from({ length: n }, () => Dom.icon('star', 11))); }
}
