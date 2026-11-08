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
    // Icons always carry a name (user feedback 8 Nov 2026: no icon without text).
    const chip = (icon, label, title) => h('span.qchip.named', { title: title ?? label }, Dom.icon(icon, 16), label);
    const itemChip = (id, v, extra) => { const x = ui.c.get('items', id); return h('span.qchip.named', ui.itemBtn(id, v, null, 18), `${x.name}${v && v !== 'product' && x.kind !== 'product' ? ` (${v})` : ''}`, extra ? h('b', extra) : null); };
    const block = (icon, label, chips) => [h('div.ln.sm.lab', Dom.icon(icon, 18), label), h('div.chipline.sub', chips)];
    if (prod) {
      const tr = tier ?? ui.sys.skills.tier();
      rows.push(h('div.ln.sm', Dom.icon('gold', 18), 'Worth now', h('span.v', `${Math.round(eco.productValue(item, tr) * 10) / 10}`)));
      rows.push(h('div.ln.sm', Dom.icon(st.market.trend[item] === 'high' ? 'trend_up' : st.market.trend[item] === 'low' ? 'trend_down' : 'trend_flat', 18), 'Wanted this week', h('span.v', st.market.trend[item] ?? '-')));
      const r = ui.c.all('recipes').find((x) => x.product === item);
      if (r) rows.push(...block('cauldron', `Made from (one batch makes ${r.outputPerBatch})`, r.inputs.map((i) => itemChip(i.item, i.variant, `×${i.qty}`))));
      rows.push(...block('store', 'Where to sell it', [chip('store', 'Your shop'), chip('market', 'Market stall'), chip('guild', 'Guild Hall')]));
    } else if (it.kind === 'food') {
      rows.push(h('div.ln.sm', Dom.icon('gold', 18), 'Price', h('span.v', String(ui.num('FOOD_PRICE')))));
      rows.push(h('div.ln.sm', Dom.icon('energy', 18), 'Energy when eaten', h('span.v', `+${ui.num('MEAL_ENERGY')}`)));
    } else {
      const v = variant ?? it.variants[0];
      rows.push(h('div.ln.sm', Dom.icon('gold', 18), `Market price (${v})`, h('span.v', `${eco.buyPrice(item, v)}`)));
      const spots = ui.c.all('spots').filter((s) => s.loot.some((l) => l.item === item));
      const get = [chip('market', 'Market stall'), chip('guild', 'Guild bulk lots')];
      if (spots.length) get.push(chip('outskirt', `Outskirt (${spots.length} ${spots.length > 1 ? 'spots' : 'spot'})`, spots.map((s) => s.name).join(', ')));
      if (it.variants.includes('dried')) get.push(chip('rack', 'Drying rack', 'Dry fresh herbs on the rack'));
      if (it.variants.includes('powder')) get.push(chip('grinder', 'Grinder', 'Grind dried herbs'));
      rows.push(...block('cart', 'Where to get it', get));
      const uses = ui.c.all('recipes').filter((r) => r.inputs.some((i) => i.item === item));
      rows.push(...block('cauldron', 'Used in', uses.length ? uses.map((r) => itemChip(r.product, null)) : [h('span.small.muted', '—')]));
    }

    return h('div.veil', { onclick: (e) => { if (e.target === e.currentTarget) close(); } },
      Dom.rattan('card.icard',
        h('button.iconbtn.close', { title: 'Close', onclick: close, html: Icons.svg('x', 16) }),
        h('div.row', { style: { gap: '16px', width: '100%' } },
          Dom.medal(Icons.forItem(it, variant), 72),
          h('div', { style: { textAlign: 'left' } }, h('div.kick', kick), h('h3', it.name), tier ? Dom.stars(tiers[tier].stars) : null)),
        h('p', { style: { textAlign: 'left', width: '100%' } }, it.text ?? ''),
        h('div.chipline', { style: { width: '100%' } }, h('span.small.muted', 'You have'),
          held.length ? held.map((x) => h('span.qchip', { title: x.v ?? tiers[x.t].name }, x.v ? Dom.icon(Icons.forItem(it, x.v), 16) : Dom.stars(tiers[x.t].stars), h('span.small', x.v ?? tiers[x.t].name), String(x.q))) : h('span.small', '0')),
        h('div', { style: { width: '100%' } }, rows)));
  }
}
