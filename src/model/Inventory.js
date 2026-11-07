/**
 * Inventory: stock as lots. A lot = same item, variant, quality tier and birth day.
 * Materials have a variant (fresh, dried, powder, ...). Products have variant "product" and a quality tier.
 * A lot that is older than its shelf life becomes spoiled (materials) or waste (products).
 * Products can be packed (Packing step, [Proposal]): pack = container id, with "+label" when labelled; null = not packed.
 * Unity: [Serializable] class with List<Lot>.
 */
export class Inventory {
  constructor() {
    /** @type {{item:string, variant:string, qty:number, tier:string|null, born:number, spoiled:boolean, pack?:string|null}[]} */
    this.lots = [];
  }

  /** @param {string} item @param {string} variant @param {number} qty @param {{tier?:string|null, born?:number, spoiled?:boolean, pack?:string|null}} [o] */
  add(item, variant, qty, o = {}) {
    if (qty <= 0) return;
    const tier = o.tier ?? null, born = o.born ?? 0, spoiled = o.spoiled ?? false, pack = o.pack ?? null;
    const lot = this.lots.find((l) => l.item === item && l.variant === variant && l.tier === tier && l.born === born && l.spoiled === spoiled && (l.pack ?? null) === pack);
    if (lot) lot.qty += qty;
    else this.lots.push({ item, variant, qty, tier, born, spoiled, pack });
  }

  /** @param {(lot:any)=>boolean} [filter] */
  find(filter = () => true) {
    return this.lots.filter((l) => l.qty > 0 && filter(l));
  }

  /** @param {string} item @param {string} [variant] @param {{includeSpoiled?:boolean, tier?:string}} [o] */
  count(item, variant, o = {}) {
    return this.find((l) => l.item === item && (!variant || l.variant === variant) && (o.includeSpoiled || !l.spoiled) && (!o.tier || l.tier === o.tier))
      .reduce((n, l) => n + l.qty, 0);
  }

  /**
   * Take qty units. o.born and o.spoiled (when set) take only that lot (Crafting lot pick). o.pack (when set) takes only lots with that pack (null = not packed). Good lots first, oldest first. Spoiled lots are used only when includeSpoiled is set.
   * @returns {{item:string, variant:string, qty:number, tier:string|null, born:number, spoiled:boolean}[] | null} taken parts, or null if not enough
   */
  take(item, variant, qty, o = {}) {
    const lots = this.find((l) => l.item === item && (!variant || l.variant === variant) && (o.includeSpoiled || !l.spoiled) && (!o.tier || l.tier === o.tier) && (o.pack === undefined || (l.pack ?? null) === o.pack) && (o.born === undefined || l.born === o.born) && (o.spoiled === undefined || l.spoiled === o.spoiled))
      .sort((a, b) => Number(a.spoiled) - Number(b.spoiled) || a.born - b.born);
    if (lots.reduce((n, l) => n + l.qty, 0) < qty) return null;
    const taken = [];
    let left = qty;
    for (const l of lots) {
      if (left <= 0) break;
      const n = Math.min(l.qty, left);
      l.qty -= n;
      left -= n;
      taken.push({ ...l, qty: n });
    }
    this.lots = this.lots.filter((l) => l.qty > 0);
    return taken;
  }
}
