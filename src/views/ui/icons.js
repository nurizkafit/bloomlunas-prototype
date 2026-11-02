/** Shared view helpers: line icons (from the Planner Book) and card colors by activity category. View layer only. */
const IC = {
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l8-8"/>',
  sprout: '<path d="M12 20v-8M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
  basket: '<path d="M4 10h16l-2 9H6zM8 10l4-6 4 6"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0zM14 4l-4 7"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  scroll: '<path d="M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3h4V4zM10 9h5M10 13h5"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  home: '<path d="M4 11l8-7 8 7v9H4zM10 20v-5h4v5"/>',
  crate: '<path d="M4 8h16v12H4zM4 8l3-4h10l3 4M10 12h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  hand: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.5L7 13"/>',
  mill: '<circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  alert: '<path d="M12 3l9 16H3zM12 10v4M12 17v.5"/>'
};

/** @param {string} name @param {string} [cls] */
export function ic(name, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24">${IC[name] ?? IC.flag}</svg>`;
}

/** Card colors (Planner Book KC). */
export const KC = { gather: '#5cc29b', buy: '#7fb7e6', craft: '#c98a3c', sell: '#e9b44c', org: '#b7adff', rest: '#9ba4c4', event: '#e8735c', dry: '#d9b25c' };

const ICON_BY_ACTIVITY = { open_shop: 'coin', sell_to_organization: 'crate', buy: 'basket', craft: 'bowl', sun_drying: 'sun', grinding: 'mill', explore: 'leaf', commission: 'scroll', organization_visit: 'hand', rest: 'home', respond_to_event: 'alert' };
const COLOR_BY_ACTIVITY = { open_shop: KC.sell, sell_to_organization: KC.sell, buy: KC.buy, craft: KC.craft, sun_drying: KC.dry, grinding: KC.craft, explore: KC.gather, commission: KC.org, organization_visit: KC.org, rest: KC.rest, respond_to_event: KC.event };

/** @param {{id:string}} a activity */
export function iconFor(a) { return ICON_BY_ACTIVITY[a.id] ?? 'flag'; }
/** @param {{id:string}} a activity */
export function colorFor(a) { return COLOR_BY_ACTIVITY[a.id] ?? KC.org; }
