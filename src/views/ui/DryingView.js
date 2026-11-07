import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { PlaceView } from './PlaceView.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/** DryingView: the Drying rack. Fresh herbs dry in DRYING_DAYS days. Each cell is one unit. */
export class DryingView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, L = ui.local, prod = ui.sys.production;
    const today = ui.sys.time.absDay();
    const cap = prod.rackCapacity(), used = prod.rackUsed();
    const cells = [];
    for (const b of st.rack) for (let i = 0; i < b.qty; i++) cells.push(b);
    const fresh = ui.c.all('items').filter((i) => i.variants.includes('dried')).map((it) => ({ it, q: Inventory.count(st.inv, it.id, 'fresh', '') }));
    const sel = fresh.find((f) => f.it.id === L.pick.item) ?? fresh.find((f) => f.q > 0) ?? fresh[0];
    const max = Math.min(sel.q, cap - used);
    const qty = Math.max(0, Math.min(L.pick.qty ?? max, max));
    const ready = st.rack.filter((b) => b.readyDay <= today);
    const pvS = ui.preview('dryStart', { item: sel.it.id, qty });
    const pvC = ui.preview('dryCollect');
    const rack = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      h('div.shelf', { style: { gridTemplateColumns: 'repeat(5, 1fr)' } }, Array.from({ length: cap }, (_, i) => {
        const b = cells[i];
        if (!b) return h('div.slot.empty', { style: { height: '64px' } });
        const left = b.readyDay - today;
        const it = ui.c.get('items', b.item);
        return h('div.slot', { style: { height: '64px' }, title: it.name }, Dom.icon(left <= 0 ? 'dried' : it.icon, 26), h('span.q', left <= 0 ? '✓' : `${left}d`));
      })),
      h('div.row', Dom.chip('rack', `${used}/${cap}`), Dom.chip('clock', `${ui.num('DRYING_DAYS')}d`), h('span.spacer'),
        Dom.btn('Collect', () => ui.act('dryCollect'), { cls: 'sm', icon: 'dried', disabled: !!pvC.reason || !ready.length, min: ui.num('DRYING_TASK_MIN') })));
    const pick = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
      h('div.kick', 'Fresh'),
      ...fresh.map((f) => h(`button.pick${f === sel ? '.on' : ''}`, { onclick: () => ui.set({ pick: { item: f.it.id } }), disabled: !f.q },
        Dom.medal(f.it.icon, 36), h('span.t', f.it.name), h('span.r', Dom.icon(f.it.icon, 16), String(f.q), Dom.icon('next', 14), Dom.icon('dried', 16)))),
      h('div.row', { style: { marginTop: '8px' } }, Dom.stepper(qty, (d) => ui.set({ pick: { ...L.pick, item: sel.it.id, qty: Math.max(0, qty + d) } }), { max, big: true })));
    return PlaceView.win(ui, 'rack', 'Drying rack', [rack, pick],
      [Dom.btn('Start drying', () => ui.act('dryStart', { item: sel.it.id, qty }), { cls: 'gold', icon: 'rack', min: pvS.min, energy: pvS.energy, disabled: !!pvS.reason || qty <= 0, title: ui.why(pvS.reason) })], 'cols-6-6');
  }
}
