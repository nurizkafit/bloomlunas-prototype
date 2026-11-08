import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';
import { Calendar } from '../../model/Calendar.js';

const h = Dom.h;
const LV = ['low', 'fair', 'high'];

/**
 * StoreView: the home store. Stock the 3x3 shelf (product, quantity, price level Low/Fair/High),
 * Open store (one energy cost), watch the hours play out, then the Shop result.
 */
export class StoreView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st;
    if (st.store.open || ui.local.storeRun) return this.#running();
    if (ui.local.showResult && st.store.result?.end != null) return this.#result();
    return this.#stock();
  }

  #slot(i, sel, onclick) {
    const ui = this.ui, s = ui.st.shelf[i];
    if (!s) return h(`button.slot.empty${sel ? '.sel' : ''}`, { onclick }, Dom.icon('plus', 22));
    const it = ui.c.get('items', s.item);
    const tiers = ui.num('QUALITY_TIERS');
    return h(`button.slot${sel ? '.sel' : ''}`, { onclick, title: `${it.name} · ${s.level}` },
      h(`span.p.lv-${s.level}`, s.level[0].toUpperCase()),
      h('span.pr', Dom.icon('gold', 12), String(ui.sys.economy.shelfPrice(s.item, s.tier, s.level))),
      Dom.icon(it.icon, 34), Dom.stars(tiers[s.tier].stars), h('span.q', String(s.qty)));
  }

  #stock() {
    const ui = this.ui, st = ui.st, L = ui.local, eco = ui.sys.economy;
    const sel = L.pick.slot ?? 0;
    const cur = st.shelf[sel];
    const products = Object.entries(st.inv).filter(([k, q]) => q > 0 && k.split('|')[1] === 'product').map(([k]) => { const [item, , tier] = k.split('|'); return { item, tier }; });
    const pItem = L.pick.item ?? cur?.item ?? products[0]?.item;
    const pTier = L.pick.tier ?? cur?.tier ?? products.find((p) => p.item === pItem)?.tier;
    const level = L.pick.level ?? cur?.level ?? 'fair';
    const free = pItem ? eco.freeStock(pItem, pTier) + (cur && cur.item === pItem && cur.tier === pTier ? cur.qty : 0) : 0;
    const max = Math.min(free, ui.num('SHELF_SLOT_MAX'));
    const qty = Math.min(L.pick.qty ?? (cur && cur.item === pItem ? cur.qty : max), max);
    const tiers = ui.num('QUALITY_TIERS');
    const pick = (patch) => ui.set({ pick: { ...L.pick, ...patch } });
    const pvOpen = ui.preview('storeOpen');
    const [o, c] = ui.num('STORE_OPEN_HOURS');
    const units = eco.shelfUnits();
    const left = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      h('div.shelf', st.shelf.map((_, i) => this.#slot(i, i === sel, () => ui.set({ pick: { slot: i } })))),
      h('div.row', Dom.chip('shelf', units), Dom.chip('gold', `≈ ${Math.round(st.shelf.reduce((s, x) => s + (x ? x.qty * eco.shelfPrice(x.item, x.tier, x.level) : 0), 0))}`), h('span.spacer'), Dom.chip('clock', `${o}–${c}`)));
    const right = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
      h('div.kick', `Shelf space ${sel + 1}`),
      h('div', { style: { height: '152px', display: 'flex' } }, Dom.tlist('28px 1fr 48px', ['', 'Product', 'Spare'], products.map((p) => {
        const it = ui.c.get('items', p.item);
        return { on: p.item === pItem && p.tier === pTier, onclick: () => pick({ item: p.item, tier: p.tier, qty: undefined }),
          cells: [ui.itemBtn(p.item, 'product', p.tier), h('span', it.name, ' ', Dom.stars(tiers[p.tier].stars)), String(eco.freeStock(p.item, p.tier))] };
      }), 'Nothing to sell yet. Make something first.')),
      h('div.lvpick', LV.map((k) => h(`button.lv-${k}${level === k ? '.on' : ''}`, { onclick: () => pick({ level: k }) },
        k[0].toUpperCase() + k.slice(1), pItem ? h('small.row', { style: { gap: '4px' } }, Dom.icon('gold', 12), `${eco.shelfPrice(pItem, pTier, k)}`, Dom.icon('customer', 12), '●'.repeat(k === 'low' ? 3 : k === 'fair' ? 2 : 1)) : null))),
      h('div.row', { style: { marginTop: '8px' } }, Dom.stepper(qty, (d) => pick({ qty: Math.max(0, qty + d) }), { max, big: true }), h('span.spacer'),
        cur ? Dom.btn('', () => { ui.act('stockShelf', { slot: sel, qty: 0 }); ui.set({ pick: { slot: sel } }); }, { cls: 'alt.sm', icon: 'x', title: 'Clear this space' }) : null,
        Dom.btn('Place', () => { ui.act('stockShelf', { slot: sel, item: pItem, tier: pTier, qty, level }); ui.set({ pick: { slot: Math.min(8, sel + 1) } }); }, { cls: 'sm', icon: 'check', disabled: !pItem || qty <= 0 })));
    const foot = [
      h('span.small', Dom.icon('customer', 18)), h('span.small.muted', `${ui.num('CUSTOMERS_PER_HOUR')}/h`),
      h('span.spacer'),
      Dom.btn('Open the shop', () => this.#start(), { cls: 'gold', icon: 'store', energy: ui.num('STORE_OPEN_ENERGY'), disabled: !!pvOpen.reason, title: ui.why(pvOpen.reason) })
    ];
    return PlaceView.win(ui, 'store', 'Shop shelf', [left, right], foot, 'cols-6-6');
  }

  #start() {
    const ui = this.ui;
    ui.act('storeOpen');
    if (!ui.st.store.open) return;
    ui.local.storeRun = true;
    const tick = () => {
      if (!ui.local.storeRun) return;
      if (!ui.st.store.open) { ui.local.storeRun = false; ui.local.showResult = true; ui.render(); return; }
      if (ui.preview('storeHour').reason) { ui.act('storeClose'); ui.local.storeRun = false; ui.local.showResult = true; ui.render(); return; }
      ui.act('storeHour');
      ui.local.storeTimer = setTimeout(tick, ui.local.fast ? 60 : 650);
    };
    ui.local.storeTimer = setTimeout(tick, 400);
  }

  #running() {
    const ui = this.ui, st = ui.st, r = st.store.result ?? { hours: [], income: 0, customers: 0 };
    const [o, c] = ui.num('STORE_OPEN_HOURS');
    const n = c - o;
    const startH = Math.floor((r.start ?? o * 60) / 60);
    const hours = Array.from({ length: n }, (_, i) => o + i);
    const maxSold = Math.max(4, ...r.hours.map((x) => x.sold.length));
    const left = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      h('div.shelf', st.shelf.map((_, i) => this.#slot(i, false, null))));
    const right = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      h('div.kick', 'The doors are open'),
      h('div.bigtotal', Dom.icon('gold', 40), `+${Math.round(r.income)}`),
      h('div.row', Dom.chip('customer', r.customers), Dom.chip('tag', r.hours.reduce((s, x) => s + x.sold.length, 0)), h('span.spacer'), Dom.chip('clock', Calendar.clock(st.cal.minute))),
      h('div.hours', hours.map((hr) => {
        const idx = hr - startH;
        const x = idx >= 0 ? r.hours[idx] : null;
        return h(`div.h${idx === r.hours.length && st.store.open ? '.now' : ''}`, { style: { height: `${8 + (x ? x.sold.length / maxSold : 0) * 80}px` }, title: x ? `${x.customers} came in, ${x.sold.length} bought` : '' }, x ? x.sold.map(() => h('i')) : null);
      })),
      h('div.hours', { style: { height: 'auto' } }, hours.map((hr) => h('span.lab', String(hr)))));
    const foot = [
      Dom.btn('Faster', () => ui.set({ fast: !ui.local.fast }), { cls: ui.local.fast ? 'sm' : 'alt.sm', icon: 'skip' }),
      Dom.btn('Close early', () => { clearTimeout(ui.local.storeTimer); ui.local.storeRun = false; ui.act('storeClose'); ui.local.showResult = true; ui.render(); }, { cls: 'alt', icon: 'lock' })
    ];
    return PlaceView.win(ui, 'store', 'Shop · open', [left, right], foot, 'cols-5-7');
  }

  #result() {
    const ui = this.ui, r = ui.st.store.result;
    const sold = Object.entries(r.sold);
    return PlaceView.win(ui, 'store', 'The shop day is over', [
      h('div.bigicon', Dom.medal(r.reason === 'soldOut' ? 'star' : 'clock', 96), h('div.kick', { style: { marginTop: '8px' } }, r.reason === 'soldOut' ? 'Sold out!' : 'Closing time')),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        h('div.bigtotal', Dom.icon('gold', 40), `+${Math.round(r.income)}`),
        h('div.ln', Dom.icon('customer', 20), 'Customers', h('span.v', String(r.customers))),
        h('div.ln', Dom.icon('clock', 20), 'Hours open', h('span.v', String(r.hours.length))),
        h('div.ln', Dom.icon('shelf', 20), 'Left on shelf', h('span.v', String(r.unsold ?? 0))),
        h('div.chipline', { style: { marginTop: '8px' } }, sold.map(([id, q]) => Dom.chip(ui.c.get('items', id).icon, q))))
    ], [Dom.btn('Done', () => ui.set({ showResult: false }), { cls: 'gold', icon: 'check' })], 'cols-5-7');
  }
}
