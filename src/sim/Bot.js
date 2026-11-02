import { MSG } from '../core/EventBus.js';

/**
 * Bot: plays the game with no view, through the EventBus intents only (like a view would).
 * M1 profile "fixed": one simple routine per weekday. M6 adds more profiles.
 *   Mon, Wed, Sat: buy at the market (it opens 6-12). Tue, Thu, Fri: explore and gather. Fri: then craft and go to the apothecary (it opens at 8): sell, quests.
 *   Every day: eat in each meal window, craft what the stock allows, dry and grind spare turmeric, open the shop,
 *   small rests until sleep time, then sleep.
 * Unity: not ported (test tool).
 */
export class Bot {
  /** @param {import('../core/GameManager.js').GameManager} gm */
  constructor(gm) {
    this.gm = gm;
    this.bus = gm.bus;
    this.state = gm.state;
    this.content = gm.content;
    this.last = null;
    this.refusals = [];
    this.bus.on(MSG.ACTION_COMPLETED, (r) => { this.last = r; });
    this.bus.on(MSG.ACTION_REFUSED, (r) => { this.last = { ok: false, ...r }; this.refusals.push(r); });
    // Events: pick the first response the bot can pay for.
    this.bus.on(MSG.EVENT_FIRED, ({ event }) => {
      const i = event.responses.findIndex((r) => !gm.ctx.sys.events.blocked(r));
      this.bus.emit(MSG.INTENT_RESPOND_EVENT, { eventId: event.id, responseIndex: Math.max(0, i) });
    });
  }

  /** Play from Plan week 1 until an ending, or until `months` months are closed. @param {number} [months] */
  playToEnd(months = Infinity) {
    this.gm.start();
    let guard = 0;
    while (this.gm.machine.current && this.gm.machine.current.name !== 'Ending' && guard++ < 5000) {
      if (this.gm.machine.current.name === 'Plan' && this.state.calendar.month > months) break;
      const phase = this.gm.machine.current.name;
      if (phase === 'Plan') this.plan();
      if (phase === 'Do') this.playWeek();
      if (phase === 'Act') this.act();
      this.bus.emit(MSG.INTENT_NEXT_PHASE);
    }
  }

  plan() {
    const start = this.content.num('DAY_START_HOUR') * 60;
    for (let day = 0; day < this.content.num('DAYS_PER_WEEK'); day++) {
      const first = this.#marketDay(day) ? 'buy' : day >= 1 && day <= 4 ? 'explore' : null;
      const slot = this.content.num('PLAN_SLOT_HOURS') * 60;
      if (first) this.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: first, day, startMin: start, durationMin: slot });
      this.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'craft', day, startMin: start + slot, durationMin: slot, recipeId: 'kunyit_asam' });
      this.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'open_shop', day, startMin: start + 3 * slot, durationMin: 2 * slot });
      this.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'rest', day, startMin: start + 5 * slot, durationMin: slot });
    }
    this.bus.emit(MSG.INTENT_LOCK_PLAN);
  }

  playWeek() {
    let guard = 0;
    while (!this.state.player.weekOver && guard++ < 50) this.playDay();
  }

  act() {
    this.bus.emit(MSG.INTENT_PAY_UTILITIES);
    this.bus.emit(MSG.INTENT_PAY_DEBT, { amount: this.state.wallet.gold });
  }

  // ---- one day ----

  playDay() {
    const day = this.state.calendar.day;
    this.#eat();
    if (this.#marketDay(day)) this.#buy();
    else if (day === 1 || day === 3 || day === 4) this.#explore();
    this.#eat();
    this.#craft();
    if (day === 4) this.#apothecary();
    this.#eat();
    this.#dryAndGrind();
    this.#eat();
    this.#shop();
    this.#eat();
    this.#sleep();
  }

  /** Eat if a meal window is open and this meal is not eaten yet. */
  #eat() {
    const meal = this.gm.ctx.sys.actions.mealNow();
    if (meal && !(this.state.player.meals ?? []).includes(meal)) this.#run('eat');
  }

  #marketDay(day) {
    return !!this.content.get('locations', 'loc_market').openHours[day];
  }

  #start(activityId) {
    this.bus.emit(MSG.INTENT_START_ACTIVITY, { activityId });
  }

  /** @returns {boolean} ok */
  #run(actionId, params = {}) {
    this.bus.emit(MSG.INTENT_RUN_ACTION, { actionId, params });
    return !!this.last?.ok;
  }

  #go(activityId, to) {
    this.#start(activityId);
    return this.#run('travel', { to });
  }

  #energyFor(key) {
    return this.state.player.energy >= this.content.num(key);
  }

  #have(item, variant) {
    return this.state.inventory.count(item, variant);
  }

  #buy() {
    this.#go('buy', 'loc_market');
    const wants = [['turmeric', 'fresh', 4], ['tamarind', 'paste', 1], ['palm_sugar', 'block', 1], ['coconut_oil', 'oil', 1], ['beeswax', 'block', 1]];
    for (const [item, variant, target] of wants) {
      const need = target - this.#have(item, variant);
      if (need > 0 && this.state.wallet.gold > 30) this.#run('buy-item', { item, variant, qty: need });
    }
  }

  #explore() {
    this.#go('explore', 'loc_gather_area');
    for (let i = 0; i < 2 && this.#energyFor('ENERGY_COST_EXPLORE'); i++) this.#run('gather-harvest');
  }

  #apothecary() {
    this.#go('commission', 'loc_apothecary_guild');
    for (const q of [...this.state.quests]) this.#run('hand-in-quest', { questId: q.id });
    if (!this.state.quests.length) this.#run('take-quest', { questId: 'ap_q1' });
    this.#start('sell_to_organization');
    for (const variant of ['dried', 'powder']) {
      const n = this.#have('turmeric', variant);
      if (n) this.#run('sell-item', { item: 'turmeric', variant, qty: n });
    }
  }

  #craft() {
    const recipes = ['kunyit_asam', 'turmeric_salep', 'lemongrass_balm', 'beras_kencur'];
    const can = recipes.filter((id) => !this.gm.ctx.sys.production.missing(this.content.get('recipes', id)));
    if (!can.length) return;
    this.#go('craft', 'loc_home_atelier');
    for (const id of can) {
      const r = this.content.get('recipes', id);
      if (this.gm.ctx.sys.production.missing(r) || !this.#energyFor('ENERGY_COST_DEFAULT')) continue;
      this.#run(r.action, { recipeId: id });
    }
  }

  #dryAndGrind() {
    const today = this.state.calendar.absDay();
    if (this.state.batches.some((b) => b.readyDay <= today) || this.#have('turmeric', 'fresh') >= 2) {
      this.#go('sun_drying', 'loc_home_drying_yard');
      if (this.state.batches.some((b) => b.readyDay <= today)) this.#run('collect-batch');
      const spare = this.#have('turmeric', 'fresh');
      if (spare >= 2) this.#run('start-batch', { item: 'turmeric', qty: spare });
    }
    const dried = this.#have('turmeric', 'dried');
    if (dried) {
      this.#go('grinding', 'loc_home_atelier');
      this.#run('grind', { item: 'turmeric', qty: dried });
    }
  }

  #shop() {
    const products = () => this.state.inventory.find((l) => l.variant === 'product').length;
    if (!products() || !this.content.get('locations', 'loc_home_shop').openHours[this.state.calendar.day]) return;
    this.#go('open_shop', 'loc_home_shop');
    let guard = 0;
    while (products() && this.#energyFor('ENERGY_COST_DEFAULT') && guard++ < 24) {
      if (!this.#run('serve-customer')) break;
    }
  }

  /** Go home; small rests until sleep time (SLEEP_EARLIEST_HOUR), eat dinner if open, then sleep. */
  #sleep() {
    this.#go('rest', 'loc_home');
    let guard = 0;
    while (this.state.calendar.minute < this.content.num('SLEEP_EARLIEST_HOUR') * 60 && guard++ < 40) {
      this.#eat();
      if (this.state.calendar.minute >= this.content.num('SLEEP_EARLIEST_HOUR') * 60) break;
      if (!this.#run('small-rest')) break;
    }
    this.#eat();
    this.#run('sleep');
  }
}
