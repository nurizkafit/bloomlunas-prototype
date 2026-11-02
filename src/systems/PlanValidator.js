/**
 * PlanValidator: checks a WeekPlan (SPECS §10, Planner Book plan check).
 * Card problems (bad) and warnings (warn), plan problems, and a simple forecast.
 * Read-only: it never changes GameState. Views may call it for drag previews.
 * Unity: plain C# class.
 */
export class PlanValidator {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #c() { return this.ctx.content; }

  /** Length of a card in minutes. Craft uses the recipe time. @param {any} card */
  duration(card) {
    if (card.activityId === 'craft' && card.recipeId) return this.#c.get('recipes', card.recipeId).timeMin;
    return card.durationMin;
  }

  /** @param {any} card */
  location(card) {
    const a = this.#c.get('activities', card.activityId);
    return card.locationId ?? a.locationIds[0] ?? null;
  }

  /** Why this activity cannot go on this day at all, or null. @param {any} card @param {number} day */
  dayProblem(card, day) {
    const loc = this.location(card);
    if (!loc) return null;
    const l = this.#c.get('locations', loc);
    return l.openHours[day] ? null : `${l.name} is closed on ${DAYS[day]}`;
  }

  /**
   * Check one slot for a drag preview. @param {any} card @param {number} day @param {number} startMin
   * @returns {{lvl:'ok'|'warn'|'bad', msg:string}}
   */
  slotCheck(card, day, startMin) {
    const plan = this.ctx.state.plan;
    const end = startMin + this.duration(card);
    const hit = plan.cards.find((c) => c.uid !== card.uid && c.day === day && c.startMin < end && c.startMin + this.duration(c) > startMin);
    if (hit) return { lvl: 'bad', msg: `Overlaps ${this.#c.get('activities', hit.activityId).name} (${hm(hit.startMin)}–${hm(hit.startMin + this.duration(hit))})` };
    if (end > this.#c.num('NIGHT_END_HOUR') * 60) return { lvl: 'bad', msg: `Ends after ${hm(this.#c.num('NIGHT_END_HOUR') * 60)}` };
    const hours = this.#hours(card, day);
    if (hours && (startMin < hours[0] * 60 || end > hours[1] * 60)) return { lvl: 'warn', msg: `Open ${hm(hours[0] * 60)}–${hm(hours[1] * 60)}` };
    if (end > this.#c.num('DAY_END_HOUR') * 60) return { lvl: 'warn', msg: 'Night work: fatigue risk' };
    return { lvl: 'ok', msg: '' };
  }

  #hours(card, day) {
    const loc = this.location(card);
    return loc ? this.#c.get('locations', loc).openHours[day] : null;
  }

  /** Full check of the current plan. */
  validate() {
    const { state } = this.ctx;
    const c = this.#c;
    const issues = {};
    const add = (uid, lvl, msg) => (issues[uid] = issues[uid] ?? []).push({ lvl, msg });
    const dayEnd = [];
    const products = state.inventory.find((l) => l.variant === 'product' && l.tier !== 'Failed').reduce((n, l) => n + l.qty, 0);
    let stockProducts = products, boughtBefore = false, incomeLo = 0, incomeHi = 0, buyCards = 0;
    const counts = {};
    for (const l of state.inventory.find((x) => x.variant !== 'product')) counts[`${l.item}:${l.variant}`] = (counts[`${l.item}:${l.variant}`] ?? 0) + l.qty;
    const avg = (id) => { const f = c.get('items', id).forecast; return [f.lo, f.hi]; };
    const nightEnd = c.num('NIGHT_END_HOUR') * 60, dayEndMin = c.num('DAY_END_HOUR') * 60;

    for (let d = 0; d < c.num('DAYS_PER_WEEK'); d++) {
      const cards = state.plan.cards.filter((x) => x.day === d).sort((a, b) => a.startMin - b.startMin);
      dayEnd[d] = cards.length ? Math.max(...cards.map((x) => x.startMin + this.duration(x))) : 0;
      for (const card of cards) {
        const a = c.get('activities', card.activityId);
        const start = card.startMin, end = start + this.duration(card);
        const hours = this.#hours(card, d);
        const loc = this.location(card);
        if (end > nightEnd) add(card.uid, 'bad', `Does not fit in the day (ends after ${hm(nightEnd)}).`);
        if (loc && !hours) add(card.uid, 'bad', `${c.get('locations', loc).name} is closed on ${DAYS[d]}.`);
        else if (hours && (start < hours[0] * 60 || end > hours[1] * 60)) add(card.uid, 'bad', `${c.get('locations', loc).name} is open ${hm(hours[0] * 60)}–${hm(hours[1] * 60)}. This card runs ${hm(start)}–${hm(end)}.`);
        const hit = cards.find((o) => o !== card && o.startMin < end && o.startMin + this.duration(o) > start);
        if (hit) add(card.uid, 'bad', `Overlaps ${c.get('activities', hit.activityId).name}.`);
        if (end > dayEndMin && end <= nightEnd && a.id !== 'rest') add(card.uid, 'warn', 'Night work. Fatigue: chance to wake up late tomorrow.');
        if (a.needsAppointment && !state.appointments.some((x) => x.entityId === c.get('locations', loc).entityId && x.absDay === this.#absDay(d))) {
          add(card.uid, 'bad', 'Needs an appointment on this day. Book it in Act.');
        }
        if (a.id === 'buy' || a.id === 'explore') boughtBefore = true;
        if (a.id === 'buy') buyCards += 1;
        if (a.id === 'craft') {
          if (!card.recipeId) add(card.uid, 'bad', 'Pick a recipe.');
          else {
            const r = c.get('recipes', card.recipeId);
            const miss = Object.values(r.slots).flat().filter((s) => (counts[`${s.item}:${s.variant}`] ?? 0) < s.qty);
            if (miss.length) add(card.uid, boughtBefore ? 'warn' : 'bad', `${boughtBefore ? 'Buy or gather before this' : 'Not in stock'}: ${miss.map((s) => `${s.qty} ${c.get('items', s.item).name} (${s.variant})`).join(', ')}.`);
            else for (const s of Object.values(r.slots).flat()) counts[`${s.item}:${s.variant}`] -= s.qty;
            stockProducts += r.output;
          }
        }
        if (a.id === 'open_shop') {
          const cap = Math.floor((this.duration(card) / 60) * this.ctx.stat('CUSTOMERS_PER_HOUR') * c.num('SHOP_BUY_CHANCE'));
          const sold = Math.min(cap, stockProducts);
          stockProducts -= sold;
          const [lo, hi] = avg('fresh_jamu');
          incomeLo += sold * lo * 0.75;
          incomeHi += sold * hi;
          if (!sold) add(card.uid, 'warn', 'No products in stock at this time. Plan a Craft card before it.');
        }
      }
    }
    const plan = [];
    const budget = state.plan.budget;
    const exp = c.num('WEEKLY_EXPENSES');
    if ((budget.exp ?? 0) < exp) plan.push({ lvl: 'bad', tab: 'ledger', msg: `Weekly expenses slot is ${budget.exp ?? 0} G. Living costs are ${exp} G (paid in Check).` });
    if (buyCards && !(budget.buy > 0)) plan.push({ lvl: 'warn', tab: 'ledger', msg: 'You plan to buy, but the Purchases slot is 0 G.' });
    const unassigned = Math.floor(state.wallet.gold) - (budget.exp ?? 0) - (budget.buy ?? 0) - (budget.buf ?? 0);
    if (unassigned > 0) plan.push({ lvl: 'warn', tab: 'ledger', msg: `${unassigned} G has no job. Put it in a slot.` });
    for (let d = 0; d < 6; d++) if (dayEnd[d] > dayEndMin && dayEnd[d + 1] > 0) plan.push({ lvl: 'warn', tab: 'week', msg: `Night work on ${DAYS[d]}: ${DAYS[d + 1]} can start late.` });
    const gold = state.wallet.gold;
    return {
      issues, plan, dayEnd, unassigned,
      incomeLo: Math.round(incomeLo), incomeHi: Math.round(incomeHi),
      endLo: Math.round(gold - (budget.buy ?? 0) - exp + incomeLo), endHi: Math.round(gold - exp + incomeHi),
      bad: Object.values(issues).flat().filter((i) => i.lvl === 'bad').length + plan.filter((i) => i.lvl === 'bad').length,
      warn: Object.values(issues).flat().filter((i) => i.lvl === 'warn').length + plan.filter((i) => i.lvl === 'warn').length
    };
  }

  #absDay(day) {
    const cal = this.ctx.state.calendar;
    return cal.absDay() - cal.day + day;
  }
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** @param {number} min minutes after midnight */
export function hm(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;
}
