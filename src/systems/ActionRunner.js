import { MSG } from '../core/EventBus.js';

/**
 * ActionRunner: the player starts an activity, then runs its actions one at a time (SPECS §4, §5).
 * Rule checks (activity, location, opening hours, energy, night limit, kind rules), then time, energy,
 * effects, ledger lines and XP. Plan match bonus when an activity starts.
 * Each action kind has a handler: prepare(params) -> { minutes } | { error }, then apply() -> result.
 * Unity: plain C# service; kinds map to small command classes.
 */
export class ActionRunner {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #c() { return this.ctx.content; }
  get #s() { return this.ctx.state; }

  /** Start an activity (null = stop the current one). Gives the plan match bonus once per planned card. @param {string|null} activityId */
  startActivity(activityId) {
    const p = this.#s.player;
    if (p.dayOver || p.weekOver) return this.#refuse(null, 'the day is over');
    if (!activityId) { p.activityId = null; this.ctx.bus.emit(MSG.ACTION_STARTED, { activityId: null, bonus: 0 }); return { ok: true, activityId: null, bonus: 0 }; }
    const activity = this.#c.get('activities', activityId);
    p.activityId = activityId;
    const bonus = this.#planBonus(activity);
    this.ctx.bus.emit(MSG.ACTION_STARTED, { activityId, bonus });
    return { ok: true, activityId, bonus };
  }

  #planBonus(activity) {
    const { calendar, plan } = this.#s;
    const cards = plan.cards.filter((c) => !c.used && c.activityId === activity.id);
    if (!cards.length) return 0;
    const inTime = (c) => c.day === calendar.day && calendar.minute >= c.startMin && calendar.minute < c.startMin + c.durationMin;
    const card = cards.find(inTime) ?? cards.find((c) => c.day === calendar.day) ?? cards[0];
    card.used = true;
    let xp = this.#c.num('PLAN_MATCH_XP_BONUS_ACTIVITY');
    if (card.day === calendar.day) xp += this.#c.num('PLAN_MATCH_XP_BONUS_DAY');
    if (inTime(card)) xp += this.#c.num('PLAN_MATCH_XP_BONUS_TIME');
    if (activity.skillPath) this.ctx.sys.effects.apply([{ type: 'xp', target: activity.skillPath, amount: xp }], 'plan match');
    return activity.skillPath ? xp : 0;
  }

  /** @param {string} actionId @param {Record<string, any>} [params] */
  runAction(actionId, params = {}) {
    const s = this.#s, p = s.player;
    if (p.dayOver || p.weekOver) return this.#refuse(actionId, 'the day is over');
    if (s.pendingEvent) return this.#refuse(actionId, 'answer the event first');
    if (!p.activityId) return this.#refuse(actionId, 'start an activity first');
    const activity = this.#c.get('activities', p.activityId);
    if (!activity.actionIds.includes(actionId)) return this.#refuse(actionId, `${actionId} is not part of ${activity.id}`);
    const action = this.#c.get('actions', actionId);
    const isTravel = action.kind === 'travel', isSleep = action.kind === 'sleep';
    if (!isTravel && activity.locationIds.length && !activity.locationIds.includes(p.location)) {
      return this.#refuse(actionId, `go to ${activity.locationIds.join(' or ')} first`);
    }
    const energy = action.energyKey ? this.#c.num(action.energyKey) : 0;
    if (p.energy < energy) return this.#refuse(actionId, 'not enough energy: rest');

    const handler = this[`kind_${action.kind}`];
    if (!handler) throw new Error(`ActionRunner: no handler for kind ${action.kind}`);
    const prep = handler.call(this, action, params, activity);
    if (prep.error) return this.#refuse(actionId, prep.error);

    const minutes = isSleep ? 0 : this.ctx.sys.time.effectiveMinutes(prep.minutes);
    if (!isTravel && !isSleep && !this.ctx.sys.time.fits(minutes)) return this.#refuse(actionId, 'too late: the night limit is near');
    if (!isTravel && !isSleep && !this.#isOpen(p.location, minutes)) return this.#refuse(actionId, `${p.location} is closed`);

    const result = prep.apply();
    if (!isSleep) {
      this.ctx.sys.time.spendEnergy(energy);
      this.ctx.sys.time.advance(minutes);
    }
    if (action.xp?.amount) this.ctx.sys.effects.apply([{ type: 'xp', target: [action.xp.path, action.xp.sub].filter(Boolean).join('.'), amount: action.xp.amount }], actionId);
    if (!isSleep) {
      s.weekActual = s.weekActual ?? {};
      s.weekActual[activity.id] = (s.weekActual[activity.id] ?? 0) + minutes;
    }
    const out = { ok: true, actionId, minutes, energy: isSleep ? 0 : energy, ...result };
    this.ctx.bus.emit(MSG.ACTION_COMPLETED, out);
    this.ctx.sys.events?.tick();
    return out;
  }

  /** True if the location is open from now until now + minutes. */
  #isOpen(locationId, minutes) {
    const loc = this.#c.get('locations', locationId);
    const hours = loc.openHours?.[this.#s.calendar.day];
    if (!hours) return false;
    const now = this.#s.calendar.minute;
    return now >= hours[0] * 60 && now + minutes <= hours[1] * 60;
  }

  /** Walk minutes between two locations (data/locations/_walk.json). */
  walkMinutes(from, to) {
    if (from === to) return 0;
    const w = this.#c.get('locations', '_walk');
    const home = (id) => w.homeGroup.includes(id);
    if (home(from) && home(to)) return w.withinHome;
    if (home(from)) return w.fromHome[to];
    if (home(to)) return w.fromHome[from];
    return w.betweenTown;
  }

  #gold(amount, label) {
    this.ctx.sys.effects.apply([{ type: 'gold', amount, label }], 'action');
  }

  #refuse(actionId, reason) {
    this.ctx.bus.emit(MSG.ACTION_REFUSED, { actionId, reason });
    return { ok: false, actionId, reason };
  }

  #entityAtLocation() {
    const loc = this.#c.get('locations', this.#s.player.location);
    return { loc, entityId: loc.entityId };
  }

  // ---- kind handlers --------------------------------------------------------------------------

  kind_travel(action, { to }, activity) {
    if (!to) return { error: 'travel needs a destination' };
    if (activity.locationIds.length && !activity.locationIds.includes(to)) return { error: `${activity.id} is not at ${to}` };
    const minutes = this.walkMinutes(this.#s.player.location, to);
    return { minutes, apply: () => { this.#s.player.location = to; return { to }; } };
  }

  kind_timeOnly(action) {
    return { minutes: action.timeMin, apply: () => ({}) };
  }

  kind_serveCustomers(action) {
    return {
      minutes: action.timeMin,
      apply: () => {
        const r = this.ctx.sys.economy.serveCustomers();
        if (r.gold) this.#gold(r.gold, `Shop sales (${r.sold})`);
        return r;
      }
    };
  }

  kind_sellItem(action, { item, variant, tier, qty = 1 }) {
    const { loc, entityId } = this.#entityAtLocation();
    const entity = entityId ? this.#c.get('entities', entityId) : null;
    if (!entity?.buys?.includes(item)) return { error: `${loc.id} does not buy ${item}` };
    const v = variant ?? (this.#c.get('items', item).kind === 'product' ? 'product' : null);
    if (this.#s.inventory.count(item, v, { tier }) < qty) return { error: `not enough ${item}` };
    return {
      minutes: action.timeMin,
      apply: () => {
        const taken = this.#s.inventory.take(item, v, qty, { tier });
        const gold = round2(taken.reduce((n, l) => n + l.qty * this.ctx.sys.economy.guildBuysAt(entityId, l), 0));
        this.#gold(gold, `Sell ${qty} ${item} to ${entityId}`);
        this.#s.stats.sold += qty;
        return { item, qty, gold };
      }
    };
  }

  kind_buyItem(action, { item, variant, qty = 1 }) {
    const { loc } = this.#entityAtLocation();
    if (!this.ctx.sys.economy.sellsList(loc).includes(item)) return { error: `${loc.id} does not sell ${item}` };
    const data = this.#c.get('items', item);
    const v = variant ?? data.variants[0].id;
    const unit = this.ctx.sys.economy.sellerAsks(loc, item, v);
    const cost = round2(unit * qty);
    if (!this.#s.wallet.canPay(cost)) return { error: 'not enough gold' };
    return {
      minutes: action.timeMin,
      apply: () => {
        this.#gold(-cost, `Buy ${qty} ${item}`);
        this.#s.inventory.add(item, v, qty, { born: this.#s.calendar.absDay() });
        return { item, variant: v, qty, gold: -cost };
      }
    };
  }

  kind_craft(action, { recipeId }) {
    const recipe = recipeId && this.#c.get('recipes', recipeId);
    if (!recipe) return { error: 'pick a recipe' };
    if (recipe.action !== action.id) return { error: `${recipeId} is made with ${recipe.action}` };
    const miss = this.ctx.sys.production.missing(recipe);
    if (miss) return { error: miss };
    return { minutes: recipe.timeMin, apply: () => this.ctx.sys.production.craft(recipe) };
  }

  kind_startBatch(action, { item, qty }) {
    const err = this.ctx.sys.production.cannotStartBatch(item, qty);
    if (err) return { error: err };
    return { minutes: action.timeMin, apply: () => this.ctx.sys.production.startBatch(item, qty) };
  }

  kind_collectBatch(action) {
    const today = this.#s.calendar.absDay();
    if (!this.#s.batches.some((b) => b.readyDay <= today)) return { error: 'no batch is ready' };
    return { minutes: action.timeMin, apply: () => this.ctx.sys.production.collectBatch() };
  }

  kind_grind(action, { item, qty }) {
    const err = this.ctx.sys.production.cannotGrind(item, qty);
    if (err) return { error: err };
    return { minutes: action.timeMin * qty, apply: () => this.ctx.sys.production.grind(item, qty) };
  }

  kind_gather(action) {
    return {
      minutes: action.timeMin,
      apply: () => {
        const got = [];
        for (const y of action.yields) {
          const n = this.ctx.rng.int(y.min, y.max);
          if (n) {
            this.#s.inventory.add(y.item, y.variant, n, { born: this.#s.calendar.absDay() });
            got.push({ item: y.item, qty: n });
          }
        }
        return { got };
      }
    };
  }

  kind_takeQuest(action, { questId }) {
    const { entityId } = this.#entityAtLocation();
    const q = entityId && this.#c.get('entities', entityId).questBoard?.find((x) => x.id === questId);
    if (!q) return { error: `no quest ${questId} here` };
    if (this.#s.quests.some((x) => x.id === questId)) return { error: 'quest already taken' };
    return {
      minutes: action.timeMin,
      apply: () => {
        const days = q.deadlineDays ?? this.#c.num('QUEST_DEADLINE_DAYS');
        this.#s.quests.push({ id: q.id, entityId, ask: q.ask, rewardGold: q.rewardGold, relationship: q.relationship, dueDay: this.#s.calendar.absDay() + days });
        return { questId };
      }
    };
  }

  kind_handInQuest(action, { questId }) {
    const q = this.#s.quests.find((x) => x.id === questId);
    if (!q) return { error: `quest ${questId} is not active` };
    if (q.entityId !== this.#entityAtLocation().entityId) return { error: `hand in at ${q.entityId}` };
    const ok = (l) => l.item === q.ask.item && !l.spoiled && l.tier !== 'Failed';
    if (this.#s.inventory.find(ok).reduce((n, l) => n + l.qty, 0) < q.ask.qty) return { error: `need ${q.ask.qty} ${q.ask.item}` };
    return {
      minutes: action.timeMin,
      apply: () => {
        this.#s.inventory.take(q.ask.item, null, q.ask.qty);
        this.#gold(q.rewardGold, `Quest ${q.id}`);
        this.ctx.sys.effects.apply([{ type: 'relation', target: q.entityId, amount: q.relationship }], 'quest');
        this.#s.quests = this.#s.quests.filter((x) => x !== q);
        this.#s.questsDone.push(q.id);
        return { questId, gold: q.rewardGold };
      }
    };
  }

  kind_service(action, { serviceId }) {
    const { entityId } = this.#entityAtLocation();
    const today = this.#s.calendar.absDay();
    const appt = this.#s.appointments.find((a) => !a.done && a.entityId === entityId && a.serviceId === serviceId && a.absDay === today);
    if (!appt) return { error: 'no appointment today' };
    const svc = this.#c.get('entities', entityId).services.find((x) => x.id === serviceId);
    if (!this.#s.wallet.canPay(svc.cost)) return { error: 'not enough gold' };
    return {
      minutes: action.timeMin,
      apply: () => {
        const late = this.#s.calendar.minute > appt.minute;
        this.#gold(-svc.cost, `Service ${svc.name}`);
        this.ctx.sys.effects.apply(svc.effects, 'service');
        if (late) this.ctx.sys.effects.apply([{ type: 'relation', target: entityId, amount: -this.#c.num('APPOINTMENT_MISS_RELATIONSHIP_PENALTY') }], 'late');
        appt.done = true;
        return { serviceId, late };
      }
    };
  }

  kind_sleep() {
    return { minutes: 0, apply: () => { this.ctx.sys.time.sleep(); return {}; } };
  }

  kind_eventResponse() {
    return { error: 'events come in M4' };
  }
}

/** @param {number} n */
function round2(n) {
  return Math.round(n * 100) / 100;
}
