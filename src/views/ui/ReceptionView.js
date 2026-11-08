import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';
import { StallView } from './StallView.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/**
 * ReceptionView: the Guild receptionist desk. Wholesale lots (bulk basket), sell products (better ratio),
 * one service. Compact lists (Interface Reference) and a jar badge on every cost.
 */
export class ReceptionView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, L = ui.local;
    const mode = L.pick.mode ?? 'lots';
    const tabs = StallView.tabs(ui, mode, [['lots', 'cart', 'Bulk lots'], ['sell', 'gold', 'Sell'], ['service', 'lesson', 'Lessons']]);
    const eco = ui.sys.economy;
    const [list, panel] = mode === 'sell' ? StallView.sellParts(ui, 'wholesaleSell', (it, t) => eco.wholesaleSellPrice(it, t)) : mode === 'service' ? this.#service() : this.#lots();
    return PlaceView.win(ui, 'desk', 'Guild desk', [h('div.col', tabs, list), panel], [], 'cols-7-5');
  }

  #lots() {
    const ui = this.ui, st = ui.st, eco = ui.sys.economy;
    const lot = ui.num('WHOLESALE_LOT');
    const mats = ui.c.all('items').filter((i) => i.kind === 'material');
    const need = Object.fromEntries(ui.sys.plan.materials().map((m) => [`${m.item}|${m.buyVariant}`, m.buy]));
    const cart = StallView.cart(ui);
    const rows = mats.map((m) => {
      const v = m.variants[0], k = `${m.id}|${v}`, q = cart[k] ?? 0;
      return {
        cls: q ? 'has' : '',
        cells: [ui.itemBtn(m.id, v), h('span', m.name, h('small.muted', ` ×${lot}`)), String(eco.wholesaleLotPrice(m.id, v)), String(Inventory.count(st.inv, m.id, v, '')),
          need[k] ? h('b', { style: { color: 'var(--red)' } }, String(need[k])) : '·',
          Dom.mini(q, (d) => StallView.setCart(ui, { ...cart, [k]: Math.max(0, q + d) }))]
      };
    });
    const list = Dom.tlist('28px 1fr 60px 40px 40px 84px', ['', `Lot (×${lot})`, h('span', Dom.icon('gold', 12), 'lot'), 'Have', 'Plan', 'Lots'], rows);
    const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([k, lots]) => { const [item, variant] = k.split('|'); return { item, variant, lots, qty: lots * lot, cost: eco.wholesaleLotPrice(item, variant) * lots }; });
    const fill = () => StallView.setCart(ui, Object.fromEntries(Object.entries(need).filter(([, n]) => n > 0).map(([k, n]) => [k, Math.ceil(n / lot)])));
    const panel = StallView.buyPanel(ui, lines, 'wholesaleBuy', { lines: lines.map(({ item, variant, lots }) => ({ item, variant, lots })) }, fill, Object.values(need).some((n) => n > 0));
    return [list, panel];
  }

  #service() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const svc = ui.c.all('services').filter((s) => s.inDo);
    const used = (id) => st.servicesBought.some((b) => b.id === id && b.day === ui.sys.time.absDay());
    const sel = svc.find((s) => s.id === L.pick.svc) ?? svc[0];
    const list = Dom.tlist('28px 1fr 64px', ['', 'Lesson', h('span', Dom.icon('gold', 12), 'price')], svc.map((s) => ({
      on: s === sel, onclick: () => ui.set({ pick: { mode: 'service', svc: s.id } }),
      cells: [Dom.icon(s.id === 'svc_lesson' ? 'lesson' : 'trade', 20), s.name, String(s.price)]
    })));
    if (!sel) return [list, h('div')];
    const pv = ui.preview('service', { id: sel.id });
    const panel = h('div.tpanel',
      h('div.kick', 'Lesson'),
      h('div.row', { style: { gap: '12px' } }, Dom.medal(sel.id === 'svc_lesson' ? 'lesson' : 'trade', 48), h('div', { style: { fontFamily: 'var(--head)', fontSize: '20px' } }, sel.name)),
      h('p.small', sel.text),
      h('div.costrow', { style: { justifyContent: 'flex-start' } }, h('span', Dom.icon('clock', 16), Dom.mins(pv.min)), h('span', Dom.icon('energy', 16), String(pv.energy))),
      h('div.row', h('span.tot.neg', Dom.icon('gold', 26), `-${sel.price}`), h('span.spacer'), ui.jarTag('store', sel.price)),
      h('div.row.end', Dom.btn(used(sel.id) ? 'Taken today' : 'Book', () => ui.act('service', { id: sel.id }), { cls: 'gold', icon: 'lesson', disabled: !!pv.reason || used(sel.id), title: ui.why(pv.reason) })),
      h('div.small.muted', 'Shop upgrades are booked at month end.'));
    return [list, panel];
  }
}
