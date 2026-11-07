import { Inventory } from '../model/Inventory.js';

/**
 * Bot: plays the jam build headless for balance runs. It follows the daily goal of each day,
 * buys what the store plan needs, crafts, stocks the shelf at a fair price and opens the store.
 * It is a simple, fair player, not an optimal one.
 */
export class Bot {
  /** @param {import('../core/GameManager.js').GameManager} gm */
  constructor(gm) {
    this.gm = gm;
    this.s = gm.sys;
  }

  get st() { return this.gm.state; }

  /** Play until the retrospective (or maxWeeks). @param {number} [maxWeeks] */
  play(maxWeeks = 99) {
    let guard = 0;
    while (this.st.phase !== 'retro' && guard++ < 5000) {
      const p = this.st.phase;
      if (p === 'plan') this.plan();
      else if (p === 'do') this.day();
      else if (p === 'check') this.gm.finishCheck({ ids: [] });
      else if (p === 'act') this.act();
      if (this.st.weeks.length >= maxWeeks && this.st.phase === 'plan') break;
    }
  }

  plan() {
    const p = this.st.plan;
    p.products = { kunyit_asam: 24, beras_kencur: 18, turmeric_salep: 8, lemongrass_balm: 8 };
    p.goals = ['trade', 'craft', 'store', 'explore', 'craft', 'store', 'store'];
    this.gm.lockPlan();
  }

  #do(id, params) { return this.gm.action(id, params); }

  day() {
    const st = this.st;
    if (st.pendingEvent) {
      const ev = this.gm.content.get('events', st.pendingEvent);
      const i = ev.responses.findIndex((r) => this.s.events.canPick(r));
      this.#do('respondEvent', { index: Math.max(0, i) });
    }
    this.eat();
    const goal = st.plan.goals[st.cal.day - 1];
    if (goal === 'trade') this.trade();
    else if (goal === 'craft') this.craft();
    else if (goal === 'store') { this.craft(); this.store(); }
    else if (goal === 'explore') this.explore();
    this.eat();
    if (st.place !== 'home') this.#do('travel', { place: 'home' });
    this.collect();
    this.eat();
    this.#do('sleep');
  }

  eat() {
    if (Inventory.count(this.st.inv, 'meal', 'pack', '') > 0 && this.st.day.meals < 3 && this.st.energy < 85) this.#do('eat');
  }

  trade() {
    const st = this.st, n = (k) => this.gm.content.num(k);
    if (!this.#do('travel', { place: 'market' }).ok) return;
    this.#waitOpen('market');
    const food = Inventory.count(st.inv, 'meal', 'pack', '');
    if (food < 14) this.#do('buyFood', { qty: 14 - food });
    let budget = st.plan.budget.store;
    for (const m of this.s.plan.materials()) {
      if (!m.buy) continue;
      const qty = Math.min(m.buy, Math.floor(budget / m.unit));
      if (qty > 0 && this.#do('marketBuy', { item: m.item, variant: m.buyVariant, qty }).ok) budget -= qty * m.unit;
    }
    if (this.#do('travel', { place: 'guild' }).ok) {
      this.#waitOpen('guild');
      for (const id of [...st.quests.board]) if (st.quests.active.length < n('QUEST_MAX_ACTIVE')) this.#do('questTake', { id });
      for (const a of [...st.quests.active]) this.#do('questHandIn', { id: a.id });
    }
  }

  #waitOpen(id) {
    const pl = this.gm.content.get('places', id);
    const h = this.s.time.hoursToday(pl);
    while (h && this.st.cal.minute < h[0] * 60 && this.#do('shortBreak').ok) { /* wait */ }
  }

  collect() {
    this.#do('dryCollect');
    for (const it of ['turmeric', 'kencur', 'ginger']) {
      const q = Inventory.count(this.st.inv, it, 'dried', '');
      if (q > 0) this.#do('grind', { item: it, qty: Math.min(q, 6) });
    }
  }

  craft() {
    const st = this.st;
    if (st.place !== 'home') this.#do('travel', { place: 'home' });
    this.collect();
    for (const r of this.gm.content.all('recipes')) {
      const b = this.s.production.maxBatches(r);
      if (b > 0) this.#do('craft', { recipe: r.id, batches: Math.min(b, 4) });
    }
    const fresh = Inventory.count(st.inv, 'turmeric', 'fresh', '');
    const free = this.s.production.rackCapacity() - this.s.production.rackUsed();
    if (fresh > 4 && free > 0) this.#do('dryStart', { item: 'turmeric', qty: Math.min(fresh - 4, free) });
    const lg = Inventory.count(st.inv, 'lemongrass', 'fresh', '');
    const free2 = this.s.production.rackCapacity() - this.s.production.rackUsed();
    if (lg > 0 && free2 > 0) this.#do('dryStart', { item: 'lemongrass', qty: Math.min(lg, free2) });
  }

  store() {
    const st = this.st;
    if (st.place !== 'home') this.#do('travel', { place: 'home' });
    let slot = 0;
    for (const s of Inventory.list(st.inv).filter((x) => x.variant === 'product')) {
      let free = this.s.economy.freeStock(s.item, s.tier);
      while (free > 0 && slot < st.shelf.length) {
        if (st.shelf[slot]) { slot++; continue; }
        const r = this.#do('stockShelf', { slot, item: s.item, tier: s.tier, qty: free, level: 'fair' });
        free -= r.qty ?? free;
        slot++;
      }
    }
    while (st.cal.minute < 9 * 60 && this.#do('shortBreak').ok) { /* wait for store hours */ }
    if (!this.#do('storeOpen').ok) return;
    while (this.#do('storeHour').ok) { /* serve */ }
    this.#do('storeClose');
  }

  explore() {
    if (!this.#do('travel', { place: 'outskirt' }).ok) return;
    for (let i = 0; i < 6; i++) {
      if (!this.#do('exploreWalk').ok) break;
      if (!this.#do('exploreGather').ok) this.#do('exploreSkip');
      if (this.st.cal.minute > 16 * 60) break;
    }
  }

  act() {
    const due = this.s.debt.minPayment();
    this.s.debt.payUtilities();
    this.s.debt.pay(Math.min(due, Math.max(0, this.st.gold - 30)));
    this.gm.finishAct();
  }
}
