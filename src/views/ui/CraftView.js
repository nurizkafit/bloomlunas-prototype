import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { PlaceView } from './PlaceView.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/**
 * CraftView: one Crafting menu. Pick a recipe and a batch count (user decision: recipe + quantity only;
 * materials, method and packing come from the recipe).
 */
export class CraftView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const recipes = ui.c.all('recipes');
    const r = ui.c.find('recipes', L.pick.recipe) ?? recipes.find((x) => ui.sys.production.maxBatches(x) > 0) ?? recipes[0];
    const maxB = ui.num('CRAFT_MAX_BATCHES');
    const can = ui.sys.production.maxBatches(r);
    const b = Math.max(1, Math.min(L.pick.batches ?? Math.max(1, can), maxB));
    const pv = ui.preview('craft', { recipe: r.id, batches: b });
    const tiers = ui.num('QUALITY_TIERS');
    const tier = ui.sys.skills.tier();
    const prod = ui.c.get('items', r.product);
    const list = Dom.tlist('28px 1fr 40px 44px 48px', ['', 'Recipe', '', 'Out', 'Can'], recipes.map((x) => {
      const p = ui.c.get('items', x.product), n = ui.sys.production.maxBatches(x);
      return { on: x.id === r.id, onclick: () => ui.set({ pick: { recipe: x.id } }),
        cells: [ui.itemBtn(x.product, 'product', tier), p.name, Dom.icon(x.method === 'brew' ? 'cauldron' : 'salep', 16), `×${x.outputPerBatch}`, n ? h('span.badge.ok', String(n)) : Dom.icon('lock', 14)] };
    }));
    const detail = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' } },
      h('div.row', { style: { gap: '16px' } }, Dom.medal(prod.icon, 88), h('div', h('div.kick', r.method), h('div', { style: { fontFamily: 'var(--head)', fontSize: '24px' } }, prod.name), h('div.row', Dom.stars(tiers[tier].stars), h('span.small', tiers[tier].name)))),
      h('div.chipline', { style: { justifyContent: 'center' } }, r.inputs.map((i) => {
        const it = ui.c.get('items', i.item), have = Inventory.count(st.inv, i.item, i.variant, ''), need = i.qty * b;
        return h(`span.qchip${have >= need ? '.ok' : '.miss'}`, { title: `${it.name} (${i.variant})` }, ui.itemBtn(i.item, i.variant, null, 18), `${have}/${need}`);
      })),
      Dom.stepper(b, (d) => ui.set({ pick: { ...L.pick, recipe: r.id, batches: b + d } }), { min: 1, max: maxB, big: true }),
      h('div.dots', Array.from({ length: maxB }, (_, i) => h(`i${i < b ? (i < can ? '.ok' : '.no') : ''}`))),
      h('div.costrow', h('span', Dom.icon(prod.icon, 18), `+${r.outputPerBatch * b}`), h('span', Dom.icon('clock', 18), Dom.mins(pv.min)), h('span', Dom.icon('energy', 18), String(pv.energy))));
    return PlaceView.win(ui, 'cauldron', 'Crafting', [h('div.col', list), detail],
      [Dom.btn('Craft', () => ui.act('craft', { recipe: r.id, batches: b }), { cls: 'gold', icon: 'cauldron', min: pv.min, energy: pv.energy, disabled: !!pv.reason, title: ui.why(pv.reason) })]);
  }
}
