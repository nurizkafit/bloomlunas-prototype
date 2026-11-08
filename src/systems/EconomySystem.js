import { Inventory } from '../model/Inventory.js';

/**
 * EconomySystem: weekly prices and demand trend, market and guild trade, the shelf and the store.
 * Price rule: each week rolls a hidden real price per item inside its forecast range.
 * Material price = real x variant mult. Product price = real x tier mult (x price level at the store).
 * Unity: plain C# service.
 */
export class EconomySystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #n() { return (k) => this.ctx.content.num(k) + (this.ctx.state.boosts[k] ?? 0); }

  /** Plan phase: roll this week's prices and the product trends. */
  rollWeek() {
    const { state, content, rng } = this.ctx;
    const m = state.market;
    m.prevPrices = { ...m.prices };
    const weights = content.num('TREND_WEIGHTS');
    for (const it of content.all('items')) {
      const [lo, hi] = it.forecast;
      m.prices[it.id] = Math.round(rng.range(lo, hi) * 10) / 10;
      if (it.kind === 'product') m.trend[it.id] = rng.weighted(Object.keys(weights), (k) => weights[k]);
    }
  }

  /** Market price of one unit for the player to buy. @param {string} item @param {string} variant */
  buyPrice(item, variant) {
    const it = this.ctx.content.get('items', item);
    return round1(this.ctx.state.market.prices[item] * (it.variantPriceMult[variant] ?? 1));
  }

  /** Real value of one product unit of a tier. @param {string} item @param {string} tier */
  productValue(item, tier) {
    const t = this.ctx.content.num('QUALITY_TIERS')[tier] ?? { mult: 1 };
    return this.ctx.state.market.prices[item] * t.mult;
  }

  /** Store price of one unit at a price level. @param {string} item @param {string} tier @param {string} level */
  shelfPrice(item, tier, level) {
    return round1(this.productValue(item, tier) * this.ctx.content.num('PRICE_LEVELS')[level].mult);
  }

  marketSellPrice(item, tier) { return round1(this.productValue(item, tier) * this.ctx.content.num('MARKET_BUY_FROM_PLAYER')); }
  wholesaleSellPrice(item, tier) { return round1(this.productValue(item, tier) * this.ctx.content.num('WHOLESALE_SELL_RATIO')); }
  wholesaleLotPrice(item, variant) { return round1(this.buyPrice(item, variant) * this.ctx.content.num('WHOLESALE_LOT') * this.ctx.content.num('WHOLESALE_BUY_RATIO')); }

  /** Buy materials or food. @param {string} item @param {string} variant @param {number} qty @param {number} unit price per unit */
  buy(item, variant, qty, unit, label) {
    const { state, sys, content } = this.ctx;
    const cost = round1(unit * qty);
    if (cost > state.gold) return { ok: false, reason: 'gold' };
    const kind = content.get('items', item).kind;
    sys.ledger.add(-cost, label, kind === 'food' ? 'personal' : 'store');
    Inventory.add(state.inv, item, variant, qty);
    return { ok: true, cost };
  }

  /** Check a buy list: not empty, enough gold. @param {any[]} lines @param {(l:any)=>number} costOf */
  checkLines(lines, costOf) {
    const ok = lines.filter((l) => (l.qty ?? l.lots) > 0);
    if (!ok.length) return 'empty';
    return ok.reduce((s, l) => s + costOf(l), 0) > this.ctx.state.gold + 1e-9 ? 'gold' : null;
  }

  /** Buy many lines at once. @param {{item:string, variant:string, qty:number, unit:number, label:string}[]} lines */
  buyLines(lines) {
    let cost = 0;
    for (const l of lines.filter((x) => x.qty > 0)) {
      const r = this.buy(l.item, l.variant, l.qty, l.unit, l.label);
      if (!r.ok) return r;
      cost += r.cost;
    }
    return { ok: true, cost: round1(cost) };
  }

  /** Check a sell list against free stock. @param {{item:string, tier:string, qty:number}[]} lines */
  checkSell(lines) {
    const ok = lines.filter((l) => l.qty > 0);
    if (!ok.length) return 'empty';
    return ok.some((l) => this.freeStock(l.item, l.tier) < l.qty) ? 'stock' : null;
  }

  /** Sell many lines at once. */
  sellLines(lines) {
    let income = 0;
    for (const l of lines.filter((x) => x.qty > 0)) {
      const r = this.sell(l.item, l.tier, l.qty, l.unit, l.cat, l.label);
      if (!r.ok) return r;
      income += r.income;
    }
    return { ok: true, income: round1(income) };
  }

  /** Sell products from stock (not from the shelf). @param {string} item @param {string} tier @param {number} qty @param {number} unit @param {string} cat */
  sell(item, tier, qty, unit, cat, label) {
    const { state } = this.ctx;
    if (this.freeStock(item, tier) < qty) return { ok: false, reason: 'stock' };
    Inventory.add(state.inv, item, 'product', -qty, tier);
    const income = round1(unit * qty);
    this.ctx.sys.ledger.add(income, label, cat);
    state.week.sold[item] = (state.week.sold[item] ?? 0) + qty;
    return { ok: true, income };
  }

  /** Units of a product group in stock and not on the shelf. @param {string} item @param {string} tier */
  freeStock(item, tier) {
    const { state } = this.ctx;
    const onShelf = state.shelf.reduce((s, x) => s + (x && x.item === item && x.tier === tier ? x.qty : 0), 0);
    return Inventory.count(state.inv, item, 'product', tier) - onShelf;
  }

  /** Put a product group in a shelf slot (qty 0 clears it). @param {{slot:number, item?:string, tier?:string, qty:number, level?:string}} p */
  stockShelf(p) {
    const { state } = this.ctx;
    const cur = state.shelf[p.slot];
    if (!p.qty) { state.shelf[p.slot] = null; return { ok: true }; }
    const item = p.item ?? cur?.item, tier = p.tier ?? cur?.tier, level = p.level ?? cur?.level ?? 'fair';
    if (!item) return { ok: false, reason: 'item' };
    const free = this.freeStock(item, tier) + (cur && cur.item === item && cur.tier === tier ? cur.qty : 0);
    const qty = Math.min(p.qty, free, this.#n('SHELF_SLOT_MAX'));
    if (qty <= 0) return { ok: false, reason: 'stock' };
    state.shelf[p.slot] = { item, tier, qty, level };
    return { ok: true, qty };
  }

  shelfUnits() {
    return this.ctx.state.shelf.reduce((s, x) => s + (x?.qty ?? 0), 0);
  }

  /** Customers in one hour (before the buy roll). */
  customersThisHour() {
    const { state, rng, sys } = this.ctx;
    const base = this.#n('CUSTOMERS_PER_HOUR');
    const skill = 1 + (sys.skills.level('sun') - 1) * this.ctx.content.num('SUN_CUSTOMER_BONUS');
    const demand = sys.time.absDay() <= state.market.demandUntil ? state.market.demandMod : 1;
    const mean = base * skill * demand;
    return Math.max(0, Math.round(mean + rng.range(-1, 1)));
  }

  /** Serve one hour at the open store. Returns the hour result. */
  serveHour() {
    const { state, content, rng } = this.ctx;
    const levels = content.num('PRICE_LEVELS'), trend = content.num('TREND_DEMAND');
    const n = this.customersThisHour();
    const hour = { customers: n, sold: [], income: 0 };
    for (let i = 0; i < n; i++) {
      const slots = state.shelf.map((s, idx) => ({ s, idx })).filter((x) => x.s && x.s.qty > 0);
      if (!slots.length) break;
      const pick = rng.weighted(slots, (x) => trend[state.market.trend[x.s.item]] ?? 1);
      const chance = Math.min(1, content.num('SHOP_BUY_CHANCE') * levels[pick.s.level].demand);
      if (!rng.chance(chance)) continue;
      const s = pick.s;
      const price = this.shelfPrice(s.item, s.tier, s.level);
      s.qty -= 1;
      Inventory.add(state.inv, s.item, 'product', -1, s.tier);
      if (!s.qty) state.shelf[pick.idx] = null;
      hour.sold.push({ item: s.item, tier: s.tier, price, slot: pick.idx });
      hour.income = round1(hour.income + price);
      state.week.sold[s.item] = (state.week.sold[s.item] ?? 0) + 1;
    }
    if (hour.income) this.ctx.sys.ledger.add(hour.income, 'Store sales', 'store');
    return hour;
  }
}

/** @param {number} n */
export function round1(n) {
  return Math.round(n * 10) / 10;
}
