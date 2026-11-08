import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { Inventory } from '../../model/Inventory.js';

const h = Dom.h;

/**
 * ItemCardView: the detail card of a material, product or food pack (user feedback D9).
 * Opens from any item icon (UiRoot.itemBtn). Shows what it is, what you hold, the price now,
 * where to get it and what it is used for. Esc or the X closes it.
 */
export class ItemCardView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, eco = ui.sys.economy;
    const { item, variant, tier } = ui.local.card;
    const it = ui.c.get('items', item);
    const tiers = ui.num('QUALITY_TIERS');
    const prod = it.kind === 'product';
    const close = () => ui.set({ card: null });
    const held = prod
      ? Object.keys(tiers).map((t) => ({ t, q: Inventory.count(st.inv, item, 'product', t) })).filter((x) => x.q > 0)
      : it.variants.map((v) => ({ v, q: Inventory.count(st.inv, item, v, '') }));
    const kick = prod ? `Product${tier ? ` · ${tiers[tier].name}` : ''}` : it.kind === 'food' ? 'Food' : `Material${variant ? ` · ${variant}` : ''}`;

    const rows = [];
    if (prod) {
      const tr = tier ?? ui.sys.skills.tier();
      rows.push(h('div.ln.sm', Dom.icon('gold', 18), 'Value now', h('span.v', `${Math.round(eco.productValue(item, tr) * 10) / 10}`)));
      rows.push(h('div.ln.sm', Dom.icon(st.market.trend[item] === 'high' ? 'trend_up' : st.market.trend[item] === 'low' ? 'trend_down' : 'trend_flat', 18), 'Demand this week', h('span.v', st.market.trend[item] ?? '-')));
      const r = ui.c.all('recipes').find((x) => x.product === item);
      if (r) rows.push(h('div.ln.sm', Dom.icon('cauldron', 18), `Made from (×${r.outputPerBatch})`, h('span.v.row', { style: { gap: '6px' } }, r.inputs.map((i) => h('span.row', { style: { gap: '2px' } }, ui.itemBtn(i.item, i.variant, null, 18), `${i.qty}`)))));
      rows.push(h('div.ln.sm', Dom.icon('store', 18), 'Sell at', h('span.v.row', { style: { gap: '6px' } }, Dom.icon('store', 18), Dom.icon('market', 18), Dom.icon('guild', 18))));
    } else if (it.kind === 'food') {
      rows.push(h('div.ln.sm', Dom.icon('gold', 18), 'Price', h('span.v', String(ui.num('FOOD_PRICE')))));
      rows.push(h('div.ln.sm', Dom.icon('energy', 18), 'Energy when eaten', h('span.v', `+${ui.num('MEAL_ENERGY')}`)));
    } else {
      const v = variant ?? it.variants[0];
      rows.push(h('div.ln.sm', Dom.icon('gold', 18), `Market price (${v})`, h('span.v', `${eco.buyPrice(item, v)}`)));
      const spots = ui.c.all('spots').filter((s) => s.loot.some((l) => l.item === item));
      const get = [h('span.qchip', { title: 'Market stall' }, Dom.icon('market', 16)), h('span.qchip', { title: 'Guild lots' }, Dom.icon('guild', 16))];
      if (spots.length) get.push(h('span.qchip', { title: spots.map((s) => s.name).join(', ') }, Dom.icon('outskirt', 16), String(spots.length)));
      if (it.variants.includes('dried')) get.push(h('span.qchip', { title: 'Dry fresh herbs on the rack' }, Dom.icon('rack', 16)));
      if (it.variants.includes('powder')) get.push(h('span.qchip', { title: 'Grind dried herbs' }, Dom.icon('grinder', 16)));
      rows.push(h('div.ln.sm', Dom.icon('cart', 18), 'Get it at', h('span.v.row', { style: { gap: '4px' } }, get)));
      const uses = ui.c.all('recipes').filter((r) => r.inputs.some((i) => i.item === item));
      rows.push(h('div.ln.sm', Dom.icon('cauldron', 18), 'Used in', h('span.v.row', { style: { gap: '4px' } }, uses.length ? uses.map((r) => ui.itemBtn(r.product, null, null, 18)) : '—')));
    }

    return h('div.veil', { onclick: (e) => { if (e.target === e.currentTarget) close(); } },
      Dom.rattan('card.icard',
        h('button.iconbtn.close', { title: 'Close', onclick: close, html: Icons.svg('x', 16) }),
        h('div.row', { style: { gap: '16px', width: '100%' } },
          Dom.medal(Icons.forItem(it, variant), 72),
          h('div', { style: { textAlign: 'left' } }, h('div.kick', kick), h('h3', it.name), tier ? Dom.stars(tiers[tier].stars) : null)),
        h('p', { style: { textAlign: 'left', width: '100%' } }, it.text ?? ''),
        h('div.chipline', { style: { width: '100%' } }, h('span.small.muted', 'You hold'),
          held.length ? held.map((x) => h('span.qchip', { title: x.v ?? tiers[x.t].name }, x.v ? Dom.icon(Icons.forItem(it, x.v), 16) : Dom.stars(tiers[x.t].stars), String(x.q))) : h('span.small', '0')),
        h('div', { style: { width: '100%' } }, rows)));
  }
}
