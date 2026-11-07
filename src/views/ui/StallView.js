import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { PlaceView } from './PlaceView.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/** StallView: the market stall. Buy materials (weekly price), buy food packs, sell products (low ratio). */
export class StallView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, L = ui.local;
    const mode = L.pick.mode ?? 'buy';
    const tabs = h('div.row', { style: { gap: '8px', marginBottom: '8px' } }, [['buy', 'cart', 'Buy'], ['food', 'meal', 'Food'], ['sell', 'gold', 'Sell']].map(([id, ic, t]) =>
      Dom.btn(t, () => ui.set({ pick: { mode: id } }), { cls: mode === id ? 'sm' : 'alt.sm', icon: ic })));
    const [list, detail, foot] = mode === 'sell' ? this.#sell() : mode === 'food' ? this.#food() : this.#buy();
    return PlaceView.win(ui, 'stall', 'Market stall', [h('div', { style: { display: 'flex', flexDirection: 'column', minHeight: 0 } }, tabs, list), detail], foot);
  }

  #buy() {
    const ui = this.ui, st = ui.st, L = ui.local, eco = ui.sys.economy;
    const mats = ui.c.all('items').filter((i) => i.kind === 'material');
    const need = Object.fromEntries(ui.sys.plan.materials().map((m) => [`${m.item}|${m.buyVariant}`, m.buy]));
    const sel = mats.find((m) => m.id === L.pick.item) ?? mats[0];
    const v = sel.variants[0];
    const unit = eco.buyPrice(sel.id, v);
    const maxQ = Math.max(0, Math.floor(st.gold / unit));
    const qty = Math.min(L.pick.qty ?? Math.max(1, need[`${sel.id}|${v}`] ?? 1), Math.max(1, maxQ));
    const list = h('div.scroll', { style: { flex: 1 } }, mats.map((m) => {
      const mv = m.variants[0], p = eco.buyPrice(m.id, mv), prev = st.market.prevPrices[m.id];
      const n = need[`${m.id}|${mv}`];
      return h(`button.pick${m === sel ? '.on' : ''}`, { onclick: () => ui.set({ pick: { mode: 'buy', item: m.id } }) },
        Dom.medal(m.icon, 36), h('span.t', m.name), n ? h('span.badge', String(n)) : null,
        h('span.r', prev ? Dom.icon(st.market.prices[m.id] > prev ? 'trend_up' : st.market.prices[m.id] < prev ? 'trend_down' : 'trend_flat', 14) : null, Dom.icon('gold', 14), p.toFixed(1)));
    }));
    const pv = ui.preview('marketBuy', { item: sel.id, variant: v, qty });
    const detail = this.#detail(sel.icon, sel.name, Inventory.count(st.inv, sel.id, v, ''), qty, (d) => ui.set({ pick: { mode: 'buy', item: sel.id, qty: Math.max(1, qty + d) } }), maxQ, -Math.round(unit * qty * 10) / 10);
    return [list, detail, [Dom.btn('Buy', () => ui.act('marketBuy', { item: sel.id, variant: v, qty }), { cls: 'gold', icon: 'cart', min: pv.min, disabled: !!pv.reason || unit * qty > st.gold, title: ui.why(pv.reason) })]];
  }

  #food() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const price = ui.num('FOOD_PRICE');
    const qty = L.pick.qty ?? 7;
    const pv = ui.preview('buyFood', { qty });
    const list = h('div', { style: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' } },
      h('div.ln', Dom.icon('meal', 20), 'Have', h('span.v', String(st.inv['meal|pack|'] ?? 0))),
      h('div.ln', Dom.icon('calendar', 20), 'Per day', h('span.v', String(ui.num('MEALS_PER_DAY')))),
      h('div.ln', Dom.icon('jar', 20), 'Personal jar', h('span.v', `${Math.round(st.week.spent.personal)}/${st.plan.budget.personal}`)));
    const detail = this.#detail('meal', 'Meal pack', st.inv['meal|pack|'] ?? 0, qty, (d) => ui.set({ pick: { mode: 'food', qty: Math.max(1, qty + d) } }), Math.floor(st.gold / price), -price * qty);
    return [list, detail, [Dom.btn('Buy food', () => ui.act('buyFood', { qty }), { cls: 'gold', icon: 'meal', min: pv.min, disabled: !!pv.reason || price * qty > st.gold, title: ui.why(pv.reason) })]];
  }

  #sell() {
    const ui = this.ui, eco = ui.sys.economy;
    return StallView.sellParts(ui, 'market', 'marketSell', (it, t) => eco.marketSellPrice(it, t));
  }

  /** Shared product sell list (market and guild). */
  static sellParts(ui, mode, action, priceOf) {
    const st = ui.st, L = ui.local, eco = ui.sys.economy;
    const groups = Object.entries(st.inv).filter(([k, q]) => q > 0 && k.split('|')[1] === 'product').map(([k]) => { const [item, , tier] = k.split('|'); return { item, tier, free: eco.freeStock(item, tier) }; }).filter((g) => g.free > 0);
    const tiers = ui.num('QUALITY_TIERS');
    const sel = groups.find((g) => g.item === L.pick.item && g.tier === L.pick.tier) ?? groups[0];
    const list = h('div.scroll', { style: { flex: 1 } }, groups.length ? groups.map((g) => {
      const it = ui.c.get('items', g.item);
      return h(`button.pick${g === sel ? '.on' : ''}`, { onclick: () => ui.set({ pick: { mode: L.pick.mode, item: g.item, tier: g.tier } }) },
        Dom.medal(it.icon, 36), h('span.t', it.name), Dom.stars(tiers[g.tier].stars), h('span.r', Dom.icon('bag', 14), String(g.free), Dom.icon('gold', 14), String(priceOf(g.item, g.tier))));
    }) : h('div.small.muted', { style: { padding: '16px' } }, 'No free products.'));
    if (!sel) return [list, h('div.bigicon', Dom.medal('bag', 96)), []];
    const it = ui.c.get('items', sel.item);
    const qty = Math.max(1, Math.min(L.pick.qty ?? sel.free, sel.free));
    const unit = priceOf(sel.item, sel.tier);
    const pv = ui.preview(action, { item: sel.item, tier: sel.tier, qty });
    const detail = StallView.detail(ui, it.icon, it.name, sel.free, qty, (d) => ui.set({ pick: { ...L.pick, item: sel.item, tier: sel.tier, qty: Math.max(1, qty + d) } }), sel.free, Math.round(unit * qty * 10) / 10);
    return [list, detail, [Dom.btn('Sell', () => ui.act(action, { item: sel.item, tier: sel.tier, qty }), { cls: 'gold', icon: 'gold', min: pv.min, disabled: !!pv.reason, title: ui.why(pv.reason) })]];
  }

  #detail(...a) { return StallView.detail(this.ui, ...a); }

  /** Big icon, have, stepper, gold change. */
  static detail(ui, icon, name, have, qty, on, max, gold) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center' } },
      Dom.medal(icon, 96), h('div', { style: { fontFamily: 'var(--head)', fontSize: '22px' } }, name),
      Dom.chip('bag', have),
      Dom.stepper(qty, on, { min: 1, max: Math.max(1, max), big: true }),
      h('div.bigtotal', { style: { fontSize: '32px', color: gold < 0 ? 'var(--red)' : 'var(--fern)' } }, Dom.icon('gold', 30), `${gold > 0 ? '+' : ''}${gold}`));
  }
}
