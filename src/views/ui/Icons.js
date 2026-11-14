/**
 * Icons: placeholder icon set (inline SVG, 24x24, ink line + M2 palette fills).
 * Rule (user, 7 Nov 2026): show information with icon + number, keep words short.
 * Replace each path with final art later; the names stay.
 */
import { ArtPack } from './ArtPack.js';

const INK = '#2D3B3A';
const C = { tur: '#D9A326', ver: '#5FA39A', bam: '#6B8A3A', rat: '#C8955A', wis: '#9C87C0', cream: '#F2E9D8', teal: '#1F3A3D', fern: '#2E5A56', red: '#B5523B', sky: '#A9B8E8', stone: '#E8DFCB' };

const P = {
  gold: `<circle cx="12" cy="12" r="8" fill="${C.tur}"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#8A6238" stroke-width="1"/><path d="M12 8.5v7M10 10h3.5a1.5 1.5 0 010 3H10" stroke="#5a3b1c" stroke-width="1.2" fill="none"/>`,
  debt: `<path d="M5 6h14v13H5z" fill="${C.stone}"/><path d="M8 10h8M8 13h8M8 16h5" stroke="${C.red}" stroke-width="1.4"/><circle cx="17" cy="6" r="3.2" fill="${C.red}"/><path d="M17 4.5v2M17 7.6v.1" stroke="#fff" stroke-width="1.2"/>`,
  energy: `<path d="M13 2L5 14h6l-1 8 8-12h-6z" fill="${C.bam}"/>`,
  clock: `<circle cx="12" cy="12" r="8.5" fill="${C.cream}"/><path d="M12 7v5l3.5 2" stroke="${INK}" stroke-width="1.6" fill="none"/>`,
  time: `<circle cx="12" cy="12" r="8.5" fill="${C.cream}"/><path d="M12 7v5l3.5 2" stroke="${INK}" stroke-width="1.6" fill="none"/>`,
  calendar: `<rect x="4" y="5" width="16" height="15" rx="2" fill="${C.cream}"/><path d="M4 9h16" stroke="${INK}"/><rect x="4" y="5" width="16" height="4" fill="${C.ver}"/><path d="M8 3v4M16 3v4" stroke="${INK}" stroke-width="1.6"/><circle cx="9" cy="14" r="1.3" fill="${C.tur}"/><circle cx="15" cy="14" r="1.3" fill="${INK}"/>`,
  house: `<path d="M4 20V11l8-6 8 6v9z" fill="${C.stone}"/><path d="M2.5 11.5L12 4l9.5 7.5" fill="${C.ver}"/><path d="M10 20v-5h4v5" fill="${C.rat}"/>`,
  store: `<path d="M4 10h16v10H4z" fill="${C.stone}"/><path d="M3 6h18l-1 4H4z" fill="${C.tur}"/><path d="M6 6l-1 4M10 6v4M14 6v4M18 6l1 4" stroke="${INK}" stroke-width=".8"/><path d="M7 13h4v4H7z" fill="${C.sky}"/><path d="M13 13h4v7h-4z" fill="${C.rat}"/>`,
  market: `<path d="M3 9l2-5h14l2 5z" fill="${C.red}"/><path d="M5 4l1 5M9 4v5M15 4v5M19 4l-1 5" stroke="#fff" stroke-width="1.4"/><path d="M5 9h14v10H5z" fill="${C.stone}"/><circle cx="9" cy="14" r="2" fill="${C.tur}"/><circle cx="14" cy="15" r="2" fill="${C.bam}"/>`,
  stall: `<path d="M3 9l2-5h14l2 5z" fill="${C.bam}"/><path d="M5 4l1 5M9 4v5M15 4v5M19 4l-1 5" stroke="#fff" stroke-width="1.4"/><path d="M5 9h14v3H5z" fill="${C.rat}"/><path d="M6 12v8M18 12v8" stroke="${INK}" stroke-width="1.6"/>`,
  guild: `<path d="M3 20V10h18v10z" fill="${C.stone}"/><path d="M2 10L12 3l10 7z" fill="${C.wis}"/><path d="M6 12v6M10 12v6M14 12v6M18 12v6" stroke="${INK}" stroke-width="1.6"/><path d="M12 3v-2" stroke="${INK}"/><path d="M12 1h4l-1 1.5 1 1.5h-4" fill="${C.tur}"/>`,
  outskirt: `<path d="M2 20l6-10 4 6 3-4 7 8z" fill="${C.bam}"/><circle cx="17" cy="6" r="3" fill="${C.tur}"/>`,
  explore: `<circle cx="10.5" cy="10.5" r="6" fill="${C.sky}"/><path d="M15 15l5 5" stroke="${C.rat}" stroke-width="3" stroke-linecap="round"/><path d="M8 9a3 3 0 013-3" stroke="#fff" stroke-width="1.4" fill="none"/>`,
  map: `<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="${C.cream}"/><path d="M9 4v14M15 6v14" stroke="${INK}" stroke-width=".8"/><path d="M5 14c2-3 5 0 7-3s4-1 6-4" stroke="${C.red}" stroke-width="1.4" stroke-dasharray="2 1.5" fill="none"/>`,
  journal: `<path d="M5 3h12a2 2 0 012 2v16H7a2 2 0 01-2-2z" fill="${C.teal}"/><path d="M7 5h10v12H7z" fill="none" stroke="${C.tur}" stroke-width=".9"/><path d="M14 3v8l2-1.5 2 1.5V3" fill="#7E5FA8"/><circle cx="12" cy="11" r="2.4" fill="${C.tur}"/>`,
  bag: `<path d="M5 9h14l-1 11H6z" fill="${C.rat}"/><path d="M9 9V7a3 3 0 016 0v2" stroke="${INK}" stroke-width="1.6" fill="none"/><path d="M5 12h14" stroke="#8A6238"/>`,
  cauldron: `<path d="M4 10h16c0 6-3 9-8 9s-8-3-8-9z" fill="${C.teal}"/><path d="M3 10h18" stroke="${INK}" stroke-width="2"/><circle cx="9" cy="7" r="1.6" fill="${C.ver}"/><circle cx="13" cy="5" r="1.2" fill="${C.ver}"/><circle cx="15" cy="7.5" r="1" fill="${C.ver}"/><path d="M7 19l-1 2M17 19l1 2" stroke="${INK}" stroke-width="1.6"/>`,
  rack: `<path d="M4 4v17M20 4v17" stroke="#8A6238" stroke-width="2"/><path d="M4 8h16M4 13h16M4 18h16" stroke="${C.rat}" stroke-width="1.6"/><path d="M7 8v3M10 8v4M13 13v3M16 13v4M8 18v2" stroke="${C.bam}" stroke-width="2"/>`,
  grinder: `<ellipse cx="12" cy="16" rx="8" ry="4" fill="${C.stone}"/><path d="M4 16c0 2 3.6 4 8 4s8-2 8-4" fill="#B9AE8E"/><path d="M8 15l9-10" stroke="${C.rat}" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="12" cy="15.5" rx="4" ry="1.5" fill="${C.tur}"/>`,
  bed: `<path d="M3 12h18v6H3z" fill="${C.ver}"/><path d="M3 9h6v3H3z" fill="${C.cream}"/><path d="M3 7v13M21 12v8" stroke="#8A6238" stroke-width="2"/><path d="M15 4h3l-3 3h3" stroke="${C.wis}" stroke-width="1.2" fill="none"/>`,
  rest: `<path d="M5 12h12v3a5 5 0 01-5 5H10a5 5 0 01-5-5z" fill="${C.cream}"/><path d="M17 13h1.5a2 2 0 010 4H17" stroke="${INK}" fill="none"/><path d="M9 4c-1 2 1 3 0 5M13 4c-1 2 1 3 0 5" stroke="${C.ver}" stroke-width="1.4" fill="none"/>`,
  meal: `<path d="M3 12h18a9 7 0 01-18 0z" fill="${C.cream}"/><path d="M6 12a6 3 0 0112 0" fill="${C.tur}"/><circle cx="10" cy="10" r="1" fill="${C.bam}"/><circle cx="14" cy="10.5" r="1" fill="${C.red}"/>`,
  food: `<path d="M3 12h18a9 7 0 01-18 0z" fill="${C.cream}"/><path d="M6 12a6 3 0 0112 0" fill="${C.tur}"/>`,
  cart: `<path d="M3 5h3l2 10h11l2-7H7" fill="none" stroke="${INK}" stroke-width="1.6"/><path d="M8 8h12l-1.5 5H9z" fill="${C.rat}"/><circle cx="9" cy="19" r="1.8" fill="${INK}"/><circle cx="17" cy="19" r="1.8" fill="${INK}"/>`,
  quest: `<path d="M5 3h14v18H5z" fill="${C.cream}"/><path d="M8 7h8M8 10h8M8 13h5" stroke="${INK}"/><circle cx="16" cy="17" r="3" fill="${C.red}"/><path d="M12 3V1" stroke="${INK}"/>`,
  desk: `<path d="M2 11h20v3H2z" fill="${C.rat}"/><path d="M4 14v7M20 14v7" stroke="#8A6238" stroke-width="2"/><path d="M14 6h5v5h-5z" fill="${C.cream}"/><circle cx="7" cy="8" r="2.5" fill="${C.wis}"/><path d="M4 11a3 3 0 016 0" fill="${C.wis}"/>`,
  people: `<circle cx="9" cy="8" r="3" fill="${C.rat}"/><path d="M3 20a6 6 0 0112 0z" fill="${C.ver}"/><circle cx="16.5" cy="9" r="2.5" fill="${C.tur}"/><path d="M12.5 20a4.5 5 0 019 0z" fill="${C.wis}"/>`,
  customer: `<circle cx="12" cy="8" r="3.5" fill="${C.rat}"/><path d="M5 21a7 7 0 0114 0z" fill="${C.ver}"/>`,
  neighbour: `<path d="M5 21a7 7 0 0114 0z" fill="${C.tur}"/><path d="M6.5 10a5.5 5.5 0 0111 0v3h-11z" fill="${C.wis}"/><circle cx="12" cy="10.5" r="3.6" fill="${C.rat}"/><path d="M8 8.6a4.4 4.4 0 018 0" stroke="${C.wis}" stroke-width="2.4" fill="none"/><path d="M10.4 11.6q1.6 1.2 3.2 0" stroke="${INK}" stroke-width=".9" fill="none"/>`,
  root: `<path d="M9 5c4-2 8 1 7 6-1 4-4 9-8 10 1-4-2-6 0-10" fill="${C.tur}"/><path d="M10 6c-1-2-3-3-5-3M11 5c0-2 1-3 2-4" stroke="${C.bam}" stroke-width="1.6" fill="none"/>`,
  leaf: `<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" fill="${C.bam}"/><path d="M5 19L15 9" stroke="${C.fern}" stroke-width="1.2"/>`,
  herb: `<path d="M12 21V9" stroke="${C.fern}" stroke-width="1.4"/><path d="M12 12c-4 0-6-3-6-6 4 0 6 3 6 6zM12 15c4 0 6-3 6-6-4 0-6 3-6 6zM12 9c-2-2-2-5 0-7 2 2 2 5 0 7z" fill="${C.bam}"/>`,
  fruit: `<circle cx="12" cy="14" r="6.5" fill="#8A6238"/><path d="M12 7c0-2 1-3 3-4" stroke="${C.bam}" stroke-width="1.6" fill="none"/>`,
  sugar: `<path d="M5 9l7-4 7 4v8l-7 4-7-4z" fill="#A57A49"/><path d="M5 9l7 4 7-4M12 13v8" stroke="#5a3b1c" stroke-width=".9" fill="none"/>`,
  grain: `<path d="M12 21V6" stroke="${C.rat}" stroke-width="1.4"/><ellipse cx="9.5" cy="9" rx="2" ry="3" fill="${C.stone}"/><ellipse cx="14.5" cy="9" rx="2" ry="3" fill="${C.stone}"/><ellipse cx="9.5" cy="14" rx="2" ry="3" fill="${C.stone}"/><ellipse cx="14.5" cy="14" rx="2" ry="3" fill="${C.stone}"/><ellipse cx="12" cy="5" rx="1.8" ry="2.6" fill="${C.stone}"/>`,
  oil: `<path d="M9 3h6v3l3 4v10H6V10l3-4z" fill="${C.cream}"/><path d="M6 13h12v7H6z" fill="${C.tur}" opacity=".7"/><path d="M9 3h6" stroke="${INK}" stroke-width="2"/>`,
  wax: `<path d="M12 3l7 4v9l-7 5-7-5V7z" fill="#E8C060"/><path d="M12 3v18M5 7l14 9M19 7L5 16" stroke="#A8771A" stroke-width=".8"/>`,
  jamu: `<path d="M8 3h8v3l2 3v12H6V9l2-3z" fill="${C.cream}"/><path d="M6 12h12v9H6z" fill="${C.tur}"/><path d="M8 3h8" stroke="${INK}" stroke-width="2"/><path d="M9 15h6" stroke="#fff" stroke-width="1.2"/>`,
  salep: `<ellipse cx="12" cy="9" rx="8" ry="3" fill="${C.ver}"/><path d="M4 9v7c0 1.7 3.6 3 8 3s8-1.3 8-3V9" fill="${C.rat}" stroke="${INK}" stroke-width=".8"/><ellipse cx="12" cy="9" rx="5" ry="1.6" fill="${C.cream}"/>`,
  jar: `<path d="M7 6h10v2l1 2v10H6V10l1-2z" fill="${C.cream}"/><path d="M6 14h12v6H6z" fill="${C.ver}"/><path d="M6 4h12v2H6z" fill="${C.rat}"/>`,
  heart: `<path d="M12 20s-8-5-8-11a4 4 0 018-1 4 4 0 018 1c0 6-8 11-8 11z" fill="${C.red}"/>`,
  cross: `<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="${C.red}"/>`,
  trend_up: `<path d="M3 18l6-6 4 3 7-8" stroke="${C.bam}" stroke-width="2.4" fill="none"/><path d="M15 6h6v6" stroke="${C.bam}" stroke-width="2.4" fill="none"/>`,
  trend_down: `<path d="M3 6l6 6 4-3 7 8" stroke="${C.red}" stroke-width="2.4" fill="none"/><path d="M15 18h6v-6" stroke="${C.red}" stroke-width="2.4" fill="none"/>`,
  trend_flat: `<path d="M3 12h18" stroke="${C.rat}" stroke-width="2.4"/><path d="M16 8l5 4-5 4" stroke="${C.rat}" stroke-width="2.4" fill="none"/>`,
  sun: `<circle cx="12" cy="12" r="5" fill="${C.tur}"/><g stroke="${C.tur}" stroke-width="2"><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/></g>`,
  moon: `<path d="M15 3a9 9 0 106 13 7 7 0 01-6-13z" fill="${C.sky}"/>`,
  earth: `<path d="M3 18c3-6 6-9 9-9s6 3 9 9z" fill="${C.bam}"/><path d="M12 9V4M12 6c2-2 4-2 5-1-1 2-3 2-5 1z" stroke="${C.fern}" fill="${C.bam}"/>`,
  rain: `<path d="M6 13a4 4 0 010-8 5 5 0 019 1 3.5 3.5 0 011 7z" fill="${C.sky}"/><path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3" stroke="${C.ver}" stroke-width="1.6"/>`,
  lantern: `<path d="M8 6h8l1 10H7z" fill="${C.red}"/><path d="M8 6h8M7 16h10M12 3v3M12 16v4" stroke="${INK}" stroke-width="1.4"/><ellipse cx="12" cy="11" rx="2" ry="3" fill="${C.tur}"/>`,
  star: `<path d="M12 2l3 7 7 .6-5.3 4.6 1.6 7.3L12 17.8 5.7 21.5l1.6-7.3L2 9.6 9 9z" fill="${C.tur}"/>`,
  check: `<path d="M4 12l5 5L20 6" stroke="${C.bam}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  x: `<path d="M6 6l12 12M18 6L6 18" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`,
  minus: `<path d="M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`,
  back: `<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  next: `<path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  lock: `<rect x="5" y="10" width="14" height="11" rx="2" fill="${C.tur}"/><path d="M8 10V7a4 4 0 018 0v3" stroke="${INK}" stroke-width="1.8" fill="none"/>`,
  note: `<path d="M5 3h10l4 4v14H5z" fill="${C.cream}"/><path d="M15 3v4h4" fill="${C.stone}"/><path d="M8 11h8M8 14h8M8 17h5" stroke="${INK}"/>`,
  ledger: `<path d="M4 4h16v17H4z" fill="${C.cream}"/><path d="M4 8h16M10 4v17" stroke="${INK}" stroke-width=".8"/><path d="M12 11h6M12 14h6M12 17h4" stroke="${C.ver}" stroke-width="1.4"/>`,
  chart: `<path d="M4 20h17" stroke="${INK}" stroke-width="1.4"/><path d="M6 14h3v6H6z" fill="${C.ver}"/><path d="M11 9h3v11h-3z" fill="${C.tur}"/><path d="M16 5h3v15h-3z" fill="${C.wis}"/>`,
  skills: `<path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 17l-5.5 3.5 1.5-7L3 9l6.5-.5z" fill="${C.wis}"/><circle cx="12" cy="12" r="2.5" fill="${C.cream}"/>`,
  log: `<path d="M6 3h12v18H6z" fill="${C.cream}"/><circle cx="9" cy="8" r="1.2" fill="${C.ver}"/><circle cx="9" cy="12" r="1.2" fill="${C.tur}"/><circle cx="9" cy="16" r="1.2" fill="${C.wis}"/><path d="M11.5 8H16M11.5 12H16M11.5 16H16" stroke="${INK}"/>`,
  settings: `<circle cx="12" cy="12" r="7" fill="${C.rat}"/><circle cx="12" cy="12" r="3" fill="${C.cream}"/><g stroke="${C.rat}" stroke-width="3"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></g>`,
  shelf: `<path d="M3 4h18v17H3z" fill="#B9874F"/><path d="M5 6h4v4H5zM10 6h4v4h-4zM15 6h4v4h-4zM5 12h4v3H5zM10 12h4v3h-4zM15 12h4v3h-4zM5 17h4v2H5zM10 17h4v2h-4zM15 17h4v2h-4z" fill="${C.cream}"/>`,
  tag: `<path d="M3 12l9-9h8v8l-9 9z" fill="${C.tur}"/><circle cx="16" cy="8" r="1.6" fill="${C.cream}"/>`,
  walk: `<circle cx="13" cy="4" r="2" fill="${C.rat}"/><path d="M13 7l-3 6 3 3-1 5M10 13l-3 7M12 8l4 3" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  skip: `<path d="M5 5l7 7-7 7M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  dried: `<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" fill="#A57A49"/><path d="M5 19L15 9" stroke="#5a3b1c" stroke-width="1.2"/>`,
  powder: `<path d="M3 19c3-6 15-6 18 0z" fill="${C.tur}"/><circle cx="8" cy="12" r=".9" fill="${C.tur}"/><circle cx="12" cy="10" r=".9" fill="${C.tur}"/><circle cx="16" cy="12.5" r=".9" fill="${C.tur}"/>`,
  sleep: `<path d="M15 3a9 9 0 106 13 7 7 0 01-6-13z" fill="${C.sky}"/><path d="M5 4h3L5 7h3" stroke="${INK}" stroke-width="1.2" fill="none"/>`,
  festival: `<path d="M8 6h8l1 10H7z" fill="${C.red}"/><ellipse cx="12" cy="11" rx="2" ry="3" fill="${C.tur}"/>`,
  sign: `<path d="M11 3h2v18h-2z" fill="#8A6238"/><path d="M4 6h14l2 2.5-2 2.5H4z" fill="${C.tur}"/>`,
  lesson: `<path d="M3 8l9-4 9 4-9 4z" fill="${C.wis}"/><path d="M7 10v5c2 2 8 2 10 0v-5" fill="${C.cream}"/><path d="M21 8v6" stroke="${INK}" stroke-width="1.4"/>`,
  trade: `<path d="M4 8h13l-3-3M20 16H7l3 3" stroke="${C.ver}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  info: `<circle cx="12" cy="12" r="9" fill="${C.ver}"/><path d="M12 11v6M12 7.5v.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`,
  warn: `<path d="M12 3l10 18H2z" fill="${C.tur}"/><path d="M12 10v5M12 17.5v.5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  buffer: `<path d="M7 6h10v2l1 2v10H6V10l1-2z" fill="${C.cream}"/><path d="M6 13h12v7H6z" fill="${C.wis}"/><path d="M6 4h12v2H6z" fill="${C.rat}"/>`
};

export class Icons {
  /** Inline SVG string. @param {string} name @param {number} [size] */
  static svg(name, size = 24) {
    const art = ArtPack.icon(name);
    if (art) return `<img class="icn" src="${art}" width="${size}" height="${size}" alt="" aria-hidden="true" draggable="false">`;
    const body = P[name] ?? P.info;
    return `<svg class="icn" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><g stroke-linejoin="round">${body}</g></svg>`;
  }

  /** Icon on a wood ring (medallion), used in lists and station cards. @param {string} name @param {number} [size] */
  static medal(name, size = 38) {
    return `<span class="ico" style="--s:${size}px"><i>${Icons.svg(name, Math.round(size * 0.58))}</i></span>`;
  }

  /** Icon name for an item, by variant (dried/powder show their own icon). @param {any} item @param {string} [variant] */
  static forItem(item, variant) {
    if (variant === 'dried') return 'dried';
    if (variant === 'powder') return 'powder';
    return item?.icon ?? 'info';
  }

  static has(name) { return name in P; }

  /** All icon names (interface sheet). */
  static names() { return Object.keys(P); }
}
