import { MSG } from '../core/EventBus.js';

/**
 * EconomySystem: hidden real price in the forecast range (rolled each week), quality and relationship
 * price multipliers, shop customers, buy and sell, quest deadlines, missed appointments (SPECS §5).
 * Unity: plain C# service.
 */
export class EconomySystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #c() { return this.ctx.content; }

  rollWeeklyPrices() {
    const { state, rng } = this.ctx;
    for (const item of this.#c.all('items')) {
      if (!item.forecast) continue;
      state.prices[item.id] = Math.round(rng.range(item.forecast.lo, item.forecast.hi) * 100) / 100;
    }
  }

  /** Real price of one unit (before quality, relation and seller ratio). @param {string} itemId @param {string} variant */
  realPrice(itemId, variant) {
    const item = this.#c.get('items', itemId);
    const base = this.ctx.state.prices[itemId] ?? (item.forecast.lo + item.forecast.hi) / 2;
    const mult = item.kind === 'product' ? 1 : item.variants.find((v) => v.id === variant)?.priceMult ?? 1;
    return base * mult;
  }

  /** Relationship bonus as a ratio (level x RELATIONSHIP_PRICE_MODIFIER). @param {string} entityId */
  relationBonus(entityId) {
    const level = this.ctx.state.relations.level(entityId, this.#c.num('RELATIONSHIP_POINTS_PER_LEVEL'));
    return Math.max(0, level) * this.#c.num('RELATIONSHIP_PRICE_MODIFIER');
  }

  /** Price a guild pays the player for one unit of a lot. @param {string} entityId @param {{item:string, variant:string, tier:string|null}} lot */
  guildBuysAt(entityId, lot) {
    const q = lot.tier ? this.ctx.sys.quality.priceMult(lot.tier) : 1;
    return round2(this.realPrice(lot.item, lot.variant) * q * this.#c.num('GUILD_BUY_RATIO') * (1 + this.relationBonus(entityId)));
  }

  /** Price the player pays per unit. @param {any} location @param {string} itemId @param {string} variant */
  sellerAsks(location, itemId, variant) {
    const real = this.realPrice(itemId, variant);
    if (location.sells) return round2(real * this.#c.num('MARKET_SELL_RATIO'));
    return round2(real * this.#c.num('GUILD_SELL_RATIO') * (1 - this.relationBonus(location.entityId)));
  }

  /** Items a location sells to the player. @param {any} location @returns {string[]} */
  sellsList(location) {
    if (location.sells) return location.sells;
    const e = location.entityId ? this.#c.get('entities', location.entityId) : null;
    return e?.sells ?? [];
  }

  /** Price multiplier of a packed lot (container x label; [Proposal], Scene & Flow 7 Nov 2026). @param {string|null|undefined} pack */
  packMult(pack) {
    if (!pack) return 1;
    const [container, label] = pack.split('+');
    const c = this.#c.num('PACK_CONTAINERS')[container];
    return (c?.priceMult ?? 1) * (label ? this.#c.num('PACK_LABEL').priceMult : 1);
  }

  /** Buy chance for a shelf price ratio ([Proposal]): a higher price means fewer buyers. @param {number} ratio */
  buyChance(ratio) {
    const [lo, hi] = this.#c.num('SHOP_BUY_CHANCE_CLAMP');
    const k = 1 - (ratio - 1) * this.#c.num('SHOP_PRICE_ELASTICITY');
    return Math.min(hi, Math.max(lo, this.#c.num('SHOP_BUY_CHANCE') * k));
  }

  /** Shelf slots ([Proposal], SHELF_SLOTS): state.shelf = array of {item, tier, pack, qty, ratio} or null. */
  slots() {
    const s = this.ctx.state, n = this.#c.num('SHELF_SLOTS');
    if (!Array.isArray(s.shelf)) s.shelf = [];
    while (s.shelf.length < n) s.shelf.push(null);
    return s.shelf;
  }

  /** Units on the shelf. @param {string} [item] */
  shelfQty(item) {
    return this.slots().reduce((n, x) => n + (x && (!item || x.item === item) ? x.qty : 0), 0);
  }

  /** Products the player has, grouped by item, tier and pack (one shelf slot holds one group). */
  productGroups() {
    const g = new Map();
    for (const l of this.ctx.state.inventory.find((l) => l.variant === 'product' && !l.spoiled && l.tier !== 'Failed')) {
      const k = `${l.item}|${l.tier}|${l.pack ?? ''}`;
      const e = g.get(k) ?? { key: k, item: l.item, tier: l.tier, pack: l.pack ?? null, qty: 0 };
      e.qty += l.qty;
      g.set(k, e);
    }
    return [...g.values()];
  }

  /** Units of a group not yet on the shelf (other slots than skip). */
  freeQty(item, tier, pack, skip = -1) {
    const have = this.ctx.state.inventory.find((l) => l.variant === 'product' && !l.spoiled && l.item === item && l.tier === tier && (l.pack ?? null) === (pack ?? null)).reduce((n, l) => n + l.qty, 0);
    const used = this.slots().reduce((n, x, i) => n + (x && i !== skip && x.item === item && x.tier === tier && (x.pack ?? null) === (pack ?? null) ? x.qty : 0), 0);
    return Math.max(0, have - used);
  }

  /** Shop price of one unit of a slot. @param {{item:string, tier:string, pack:string|null, ratio:number}} sl */
  slotPrice(sl) {
    return round2(this.realPrice(sl.item, 'product') * this.ctx.sys.quality.priceMult(sl.tier) * this.#c.num('SHOP_PRICE_RATIO') * sl.ratio * this.packMult(sl.pack));
  }

  /** Why the store run must stop now, or null (user decision 7 Nov 2026: stop when the stock is gone or at closing time). */
  storeStop() {
    const { state, content } = this.ctx;
    if (!this.shelfQty()) return 'sold out';
    const h = content.get('locations', 'loc_home_shop').openHours?.[state.calendar.day];
    const hour = content.get('actions', 'serve-customer').timeMin;
    if (!h || state.calendar.minute + hour > h[1] * 60) return 'closing time';
    if (!this.ctx.sys.time.fits(hour)) return 'closing time';
    return null;
  }

  /** One hour of shop: customers come, some buy one product each from a shelf slot, at the slot price. */
  serveCustomers() {
    const { state, rng } = this.ctx;
    const n = this.ctx.stat('CUSTOMERS_PER_HOUR');
    const shelf = this.slots();
    let sold = 0, gold = 0;
    const items = {};
    for (let i = 0; i < n; i++) {
      const full = shelf.map((x, k) => (x && x.qty > 0 ? k : -1)).filter((k) => k >= 0);
      if (!full.length) break;
      const k = rng.pick(full), sl = shelf[k];
      if (!rng.chance(this.buyChance(sl.ratio))) continue;
      const got = state.inventory.take(sl.item, 'product', 1, { tier: sl.tier, pack: sl.pack ?? null });
      if (!got) { sl.qty = 0; continue; }
      const price = this.slotPrice(sl);
      sl.qty -= 1;
      if (!sl.qty) shelf[k] = null;
      sold += 1;
      gold += price;
      items[sl.item] = (items[sl.item] ?? 0) + 1;
    }
    state.stats.sold += sold;
    if (sold) this.ctx.bus.emit(MSG.INVENTORY_CHANGED, {});
    return { customers: n, sold, gold: round2(gold), items };
  }

  /** Quests past the deadline fail; appointments not kept are missed. */
  onDayStart() {
    const { state } = this.ctx;
    if (state.store?.open) state.store.open = false;
    const today = state.calendar.absDay();
    for (const q of state.quests.filter((q) => q.dueDay < today)) {
      this.ctx.sys.effects.apply([{ type: 'relation', target: q.entityId, amount: -this.#c.num('QUEST_MISS_RELATIONSHIP_PENALTY') }], 'quest missed');
      q.failed = true;
    }
    state.quests = state.quests.filter((q) => !q.failed);
    for (const a of state.appointments.filter((a) => !a.done && !a.missed && a.absDay < today)) {
      a.missed = true;
      this.ctx.sys.effects.apply([{ type: 'relation', target: a.entityId, amount: -this.#c.num('APPOINTMENT_MISS_RELATIONSHIP_PENALTY') }], 'appointment missed');
    }
  }
}

/** @param {number} n */
function round2(n) {
  return Math.round(n * 100) / 100;
}
