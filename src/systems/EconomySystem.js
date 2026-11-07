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

  /** Units on the shelf (state.shelf: item -> {qty, ratio}). @param {string} [item] */
  shelfQty(item) {
    const sh = this.ctx.state.shelf ?? {};
    return item ? sh[item]?.qty ?? 0 : Object.values(sh).reduce((n, x) => n + x.qty, 0);
  }

  /** One hour of shop: customers come, some buy one product each from the shelf, at the shelf price. */
  serveCustomers() {
    const { state, rng } = this.ctx;
    const n = this.ctx.stat('CUSTOMERS_PER_HOUR');
    const shelf = state.shelf ?? {};
    let sold = 0, gold = 0;
    for (let i = 0; i < n; i++) {
      const lots = state.inventory.find((l) => l.variant === 'product' && !l.spoiled && l.tier !== 'Failed' && (shelf[l.item]?.qty ?? 0) > 0);
      if (!lots.length) break;
      const lot = rng.pick(lots), sh = shelf[lot.item];
      if (!rng.chance(this.buyChance(sh.ratio))) continue;
      const price = round2(this.realPrice(lot.item, 'product') * this.ctx.sys.quality.priceMult(lot.tier) * this.#c.num('SHOP_PRICE_RATIO') * sh.ratio * this.packMult(lot.pack));
      state.inventory.take(lot.item, 'product', 1, { tier: lot.tier, pack: lot.pack ?? null });
      sh.qty -= 1;
      sold += 1;
      gold += price;
    }
    state.stats.sold += sold;
    if (sold) this.ctx.bus.emit(MSG.INVENTORY_CHANGED, {});
    return { customers: n, sold, gold: round2(gold) };
  }

  /** Quests past the deadline fail; appointments not kept are missed. */
  onDayStart() {
    const { state } = this.ctx;
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
