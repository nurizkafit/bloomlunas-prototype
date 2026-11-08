import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/**
 * StallView: the market stall. Buy materials (weekly price), buy food packs, sell products (low ratio).
 * Bulk trade (user feedback D4): set a quantity on many rows, then one click buys or sells the whole basket.
 * Lists use the compact table of the Interface Reference (D6). The jar badge shows which jar pays (D11).
 */
export class StallView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, L = ui.local;
    const mode = L.pick.mode ?? 'buy';
    const tabs = StallView.tabs(ui, mode, [['buy', 'cart', 'Buy'], ['food', 'meal', 'Food'], ['sell', 'gold', 'Sell']]);
    const eco = ui.sys.economy;
    const [list, panel] = mode === 'sell' ? StallView.sellParts(ui, 'marketSell', (it, t) => eco.marketSellPrice(it, t))
      : mode === 'food' ? this.#food() : this.#buy();
    return PlaceView.win(ui, 'stall', 'Market stall', [h('div.col', tabs, list), panel], [], 'cols-7-5');
  }

  static tabs(ui, mode, list) {
    return h('div.tabs2', list.map(([id, ic, t]) => Dom.btn(t, () => ui.set({ pick: { mode: id } }), { cls: mode === id ? 'sm' : 'alt.sm', icon: ic })));
  }

  /** Basket quantities in view state. */
  static cart(ui) { return ui.local.pick.cart ?? {}; }
  static setCart(ui, cart) { ui.set({ pick: { ...ui.local.pick, cart } }); }

  #buy() {
    const ui = this.ui, st = ui.st, eco = ui.sys.economy;
    const mats = ui.c.all('items').filter((i) => i.kind === 'material');
    const need = Object.fromEntries(ui.sys.plan.materials().map((m) => [`${m.item}|${m.buyVariant}`, m.buy]));
    const cart = StallView.cart(ui);
    const rows = mats.map((m) => {
      const v = m.variants[0], k = `${m.id}|${v}`, q = cart[k] ?? 0;
      const p = eco.buyPrice(m.id, v), prev = st.market.prevPrices[m.id];
      const tr = prev ? (st.market.prices[m.id] > prev ? 'trend_up' : st.market.prices[m.id] < prev ? 'trend_down' : 'trend_flat') : null;
      return {
        cls: q ? 'has' : '',
        cells: [ui.itemBtn(m.id, v), h('span', m.name, h('small.muted', ` ${v}`)), [tr ? Dom.icon(tr, 12) : null, p.toFixed(1)], String(Inventory.count(st.inv, m.id, v, '')),
          need[k] ? h('b', { style: { color: 'var(--red)' } }, String(need[k])) : '·',
          Dom.mini(q, (d) => StallView.setCart(ui, { ...cart, [k]: Math.max(0, q + d) }))]
      };
    });
    const list = Dom.tlist('28px 1fr 60px 40px 40px 84px', ['', 'Herb or material', h('span', Dom.icon('gold', 12), 'each'), 'Have', 'Plan', 'Qty'], rows);
    const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([k, qty]) => { const [item, variant] = k.split('|'); return { item, variant, qty, cost: eco.buyPrice(item, variant) * qty }; });
    const fill = () => StallView.setCart(ui, Object.fromEntries(Object.entries(need).filter(([, n]) => n > 0)));
    return [list, StallView.buyPanel(ui, lines, 'marketBuy', { lines: lines.map(({ item, variant, qty }) => ({ item, variant, qty })) }, fill, Object.values(need).some((n) => n > 0))];
  }

  /** Right panel of a buy basket: lines, fill from plan, total, jar badge, one Buy button. */
  static buyPanel(ui, lines, action, params, fill, canFill, unit = '') {
    const total = Math.round(lines.reduce((s, l) => s + l.cost, 0) * 10) / 10;
    const pv = ui.preview(action, params);
    return h('div.tpanel',
      h('div.kick', 'Basket'),
      h('div.row', { style: { gap: '8px' } },
        Dom.btn('Fill from plan', fill, { cls: 'alt.sm', icon: 'note', disabled: !canFill, title: 'Add what your week plan still needs' }),
        Dom.btn('', () => StallView.setCart(ui, {}), { cls: 'alt.sm', icon: 'x', title: 'Clear basket', disabled: !lines.length })),
      h('div.cart', lines.length ? lines.map((l) => { const it = ui.c.get('items', l.item); return h('div.ln.sm', ui.itemBtn(l.item, l.variant, null, 18), h('span', it.name), h('span.small.muted', `×${l.qty}${unit}`), h('span.v', `${Math.round(l.cost * 10) / 10}`)); })
        : h('div.small.muted', 'Your basket is empty.')),
      h('div.row', h(`span.tot${total ? '.neg' : ''}`, Dom.icon('gold', 26), total ? `-${total}` : '0'), h('span.spacer'), ui.jarTag('store', total)),
      h('div.row.end', Dom.btn('Buy', () => ui.act(action, params), { cls: 'gold', icon: 'cart', min: pv.min, disabled: !!pv.reason, title: ui.why(pv.reason) })));
  }

  #food() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const price = ui.num('FOOD_PRICE');
    const have = st.inv['meal|pack|'] ?? 0;
    const qty = L.pick.qty ?? 7;
    const pv = ui.preview('buyFood', { qty });
    const info = h('div.col', { style: { gap: '8px', paddingTop: '8px' } },
      h('div.row', { style: { gap: '16px' } }, ui.itemBtn('meal', 'pack', null, 40), h('div', h('div', { style: { fontFamily: 'var(--head)', fontSize: '22px' } }, 'Meal pack'), h('div.small.muted', `Rice and sambal in a banana leaf. Eat up to ${ui.num('MEALS_PER_DAY')} a day at Rest.`))),
      h('div.ln', ui.itemBtn('meal', 'pack', null, 18), 'You have', h('span.v', String(have))),
      h('div.ln', Dom.icon('calendar', 18), 'Days covered', h('span.v', String(Math.floor(have / ui.num('MEALS_PER_DAY'))))),
      h('div.ln', Dom.icon('gold', 18), 'Price each', h('span.v', String(price))));
    const panel = h('div.tpanel',
      h('div.kick', 'Meal packs'),
      h('div.row.center', Dom.stepper(qty, (d) => ui.set({ pick: { mode: 'food', qty: Math.max(1, qty + d) } }), { min: 1, max: Math.max(1, Math.floor(st.gold / price)), big: true })),
      h('div.row', h('span.tot.neg', Dom.icon('gold', 26), `-${price * qty}`), h('span.spacer'), ui.jarTag('personal', price * qty)),
      h('div.row.end', Dom.btn('Buy food', () => ui.act('buyFood', { qty }), { cls: 'gold', icon: 'meal', min: pv.min, disabled: !!pv.reason || price * qty > st.gold, title: ui.why(pv.reason) })));
    return [info, panel];
  }

  /** Shared product sell list (market and guild): quantities per row, "All", one Sell button. */
  static sellParts(ui, action, priceOf) {
    const st = ui.st, eco = ui.sys.economy;
    const tiers = ui.num('QUALITY_TIERS');
    const groups = Object.entries(st.inv).filter(([k, q]) => q > 0 && k.split('|')[1] === 'product').map(([k]) => { const [item, , tier] = k.split('|'); return { item, tier, free: eco.freeStock(item, tier) }; }).filter((g) => g.free > 0);
    const cart = StallView.cart(ui);
    const rows = groups.map((g) => {
      const it = ui.c.get('items', g.item), k = `${g.item}|${g.tier}`, q = Math.min(cart[k] ?? 0, g.free);
      return { cls: q ? 'has' : '', cells: [ui.itemBtn(g.item, 'product', g.tier), h('span', it.name, ' ', Dom.stars(tiers[g.tier].stars)), String(g.free), String(priceOf(g.item, g.tier)), Dom.mini(q, (d) => StallView.setCart(ui, { ...cart, [k]: Math.max(0, Math.min(g.free, q + d)) }), { max: g.free })] };
    });
    const list = Dom.tlist('28px 1fr 44px 56px 84px', ['', 'Product', 'Spare', h('span', Dom.icon('gold', 12), 'each'), 'Qty'], rows, 'Nothing spare to sell. Make more, or take some off the shelf.');
    const lines = groups.map((g) => ({ ...g, qty: Math.min(cart[`${g.item}|${g.tier}`] ?? 0, g.free) })).filter((l) => l.qty > 0);
    const total = Math.round(lines.reduce((s, l) => s + priceOf(l.item, l.tier) * l.qty, 0) * 10) / 10;
    const params = { lines: lines.map(({ item, tier, qty }) => ({ item, tier, qty })) };
    const pv = ui.preview(action, params);
    const panel = h('div.tpanel',
      h('div.kick', 'To sell'),
      h('div.row', { style: { gap: '8px' } },
        Dom.btn('All', () => StallView.setCart(ui, Object.fromEntries(groups.map((g) => [`${g.item}|${g.tier}`, g.free]))), { cls: 'alt.sm', icon: 'bag', disabled: !groups.length, title: 'Sell all spare products' }),
        Dom.btn('', () => StallView.setCart(ui, {}), { cls: 'alt.sm', icon: 'x', title: 'Clear', disabled: !lines.length })),
      h('div.cart', lines.length ? lines.map((l) => { const it = ui.c.get('items', l.item); return h('div.ln.sm', ui.itemBtn(l.item, 'product', l.tier, 18), h('span', it.name), h('span.small.muted', `×${l.qty}`), h('span.v', `${Math.round(priceOf(l.item, l.tier) * l.qty * 10) / 10}`)); })
        : h('div.small.muted', 'Your basket is empty.')),
      h('div.row', h(`span.tot${total ? '.pos' : ''}`, Dom.icon('gold', 26), `+${total}`)),
      h('div.row.end', Dom.btn('Sell', () => ui.act(action, params), { cls: 'gold', icon: 'gold', min: pv.min, disabled: !!pv.reason, title: ui.why(pv.reason) })));
    return [list, panel];
  }
}
