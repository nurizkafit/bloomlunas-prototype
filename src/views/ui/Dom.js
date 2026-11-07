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
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
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
  static rattan(cls, ...kids) { return Dom.h(`div.rf${cls ? '.' + cls : ''}`, Dom.h('div.in', ...kids)); }
  /** Slim wood frame (small parts). */
  static slim(cls, ...kids) { return Dom.h(`div.sf${cls ? '.' + cls : ''}`, Dom.h('div.in', ...kids)); }

  /** Icon + number chip. @param {string} icon @param {any} n @param {string} [cls] */
  static chip(icon, n, cls = '') { return Dom.h(`span.qchip${cls ? '.' + cls : ''}`, Dom.icon(icon, 18), String(n)); }

  /** Value bar. @param {number} ratio 0..1 @param {string} [cls] @param {number} [w] px */
  static bar(ratio, cls = '', w) {
    const b = Dom.h(`div.bar${cls ? '.' + cls : ''}`, Dom.h('i', { style: { width: `${Math.max(0, Math.min(1, ratio)) * 100}%` } }));
    if (w) b.style.width = `${w}px`;
    return b;
  }

  /** Dots row (filled count of total). */
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

  /** Quality stars for a tier. */
  static stars(n) { return Dom.h('span.tier', Array.from({ length: n }, () => Dom.icon('star', 11))); }
}
