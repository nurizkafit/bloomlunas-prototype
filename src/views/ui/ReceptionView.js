import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';
import { StallView } from './StallView.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/** ReceptionView: the Guild receptionist desk. Wholesale lots (buy), sell products (better ratio), one service. */
export class ReceptionView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, L = ui.local;
    const mode = L.pick.mode ?? 'lots';
    const tabs = h('div.row', { style: { gap: '8px', marginBottom: '8px' } }, [['lots', 'cart', 'Lots'], ['sell', 'gold', 'Sell'], ['service', 'lesson', 'Service']].map(([id, ic, t]) =>
      Dom.btn(t, () => ui.set({ pick: { mode: id } }), { cls: mode === id ? 'sm' : 'alt.sm', icon: ic })));
    const eco = ui.sys.economy;
    const [list, detail, foot] = mode === 'sell' ? StallView.sellParts(ui, 'guild', 'wholesaleSell', (it, t) => eco.wholesaleSellPrice(it, t)) : mode === 'service' ? this.#service() : this.#lots();
    return PlaceView.win(ui, 'desk', 'Guild receptionist', [h('div', { style: { display: 'flex', flexDirection: 'column', minHeight: 0 } }, tabs, list), detail], foot);
  }

  #lots() {
    const ui = this.ui, st = ui.st, L = ui.local, eco = ui.sys.economy;
    const lot = ui.num('WHOLESALE_LOT');
    const mats = ui.c.all('items').filter((i) => i.kind === 'material');
    const sel = mats.find((m) => m.id === L.pick.item) ?? mats[0];
    const v = sel.variants[0];
    const lp = eco.wholesaleLotPrice(sel.id, v);
    const lots = Math.max(1, L.pick.lots ?? 1);
    const list = h('div.scroll', { style: { flex: 1 } }, mats.map((m) => h(`button.pick${m === sel ? '.on' : ''}`, { onclick: () => ui.set({ pick: { mode: 'lots', item: m.id } }) },
      Dom.medal(m.icon, 36), h('span.t', m.name), h('span.r', `×${lot}`, Dom.icon('gold', 14), String(eco.wholesaleLotPrice(m.id, m.variants[0]))))));
    const pv = ui.preview('wholesaleBuy', { item: sel.id, variant: v, lots });
    const detail = StallView.detail(ui, sel.icon, `${sel.name} ×${lot * lots}`, Inventory.count(st.inv, sel.id, v, ''), lots, (d) => ui.set({ pick: { mode: 'lots', item: sel.id, lots: Math.max(1, lots + d) } }), Math.max(1, Math.floor(st.gold / lp)), -Math.round(lp * lots));
    return [list, detail, [Dom.btn('Buy lot', () => ui.act('wholesaleBuy', { item: sel.id, variant: v, lots }), { cls: 'gold', icon: 'cart', min: pv.min, disabled: !!pv.reason || lp * lots > st.gold, title: ui.why(pv.reason) })]];
  }

  #service() {
    const ui = this.ui, st = ui.st;
    const svc = ui.c.all('services').filter((s) => s.inDo);
    const used = (id) => st.servicesBought.some((b) => b.id === id && b.day === ui.sys.time.absDay());
    const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, svc.map((s) => {
      const pv = ui.preview('service', { id: s.id });
      return Dom.slim('', h('div.row', { style: { padding: '8px', width: '100%' } }, Dom.medal(s.id === 'svc_lesson' ? 'lesson' : 'trade', 48), h('div', h('div.t', { style: { fontFamily: 'var(--head)', fontSize: '17px' } }, s.name), h('div.small', s.text)), h('span.spacer'),
        Dom.btn(`${s.price}`, () => ui.act('service', { id: s.id }), { cls: 'sm', icon: 'gold', disabled: !!pv.reason || used(s.id), title: ui.why(pv.reason) })));
    }));
    return [list, h('div.bigicon', Dom.medal('guild', 96), h('div.small.muted', { style: { marginTop: '8px' } }, 'Monthly upgrades: book at month end.')), []];
  }
}
