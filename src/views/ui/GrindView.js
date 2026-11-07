import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/** GrindView: the Grinding table. Dried roots become powder. Time and energy per unit. */
export class GrindView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const items = ui.c.all('items').filter((i) => i.variants.includes('powder')).map((it) => ({ it, q: Inventory.count(st.inv, it.id, 'dried', ''), p: Inventory.count(st.inv, it.id, 'powder', '') }));
    const sel = items.find((x) => x.it.id === L.pick.item) ?? items.find((x) => x.q > 0) ?? items[0];
    const qty = Math.max(0, Math.min(L.pick.qty ?? sel.q, sel.q));
    const pv = ui.preview('grind', { item: sel.it.id, qty });
    const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, h('div.kick', 'Dried'),
      ...items.map((x) => h(`button.pick${x === sel ? '.on' : ''}`, { onclick: () => ui.set({ pick: { item: x.it.id } }), disabled: !x.q },
        Dom.medal(x.it.icon, 36), h('span.t', x.it.name), h('span.r', Dom.icon('dried', 16), String(x.q), Dom.icon('powder', 16), String(x.p)))));
    const detail = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' } },
      h('div.row', { style: { gap: '16px' } }, Dom.medal('dried', 72), Dom.icon('next', 28), Dom.medal('powder', 72)),
      Dom.stepper(qty, (d) => ui.set({ pick: { item: sel.it.id, qty: Math.max(0, qty + d) } }), { max: sel.q, big: true }),
      h('div.costrow', h('span', Dom.icon('powder', 18), `+${qty}`), h('span', Dom.icon('clock', 18), Dom.mins(pv.min)), h('span', Dom.icon('energy', 18), String(pv.energy))));
    return PlaceView.win(ui, 'grinder', 'Grinding table', [list, detail],
      [Dom.btn('Grind', () => ui.act('grind', { item: sel.it.id, qty }), { cls: 'gold', icon: 'grinder', min: pv.min, energy: pv.energy, disabled: !!pv.reason, title: ui.why(pv.reason) })]);
  }
}
