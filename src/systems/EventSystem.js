import { MSG } from '../core/EventBus.js';
import { Inventory } from '../model/Inventory.js';

/**
 * EventSystem: one event card at most per day, at the day start.
 * Scheduled events fire on their week and day. Random events (user feedback 8 Nov 2026): at the first day start of
 * a week, pick EVENTS_PER_WEEK (min..max) random days, never two days in a row and never on a scheduled event day.
 * A random event never repeats the last random event.
 * Unity: plain C# service.
 */
export class EventSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Day start. */
  roll() {
    const { state, content, rng, sys, bus } = this.ctx;
    const week = sys.time.absWeek(), day = state.cal.day;
    const all = content.all('events');
    if (!Array.isArray(state.week.eventDays)) state.week.eventDays = this.planDays(week);
    let ev = all.find((e) => e.type === 'scheduled' && e.trigger.week === week && e.trigger.day === day && !state.firedEvents.includes(e.id));
    if (!ev && state.week.eventDays.includes(day)) {
      const last = state.lastRandomEvent ?? null;
      const max = content.num('EVENT_REPEAT_MAX');
      let pool = all.filter((e) => e.type === 'random' && e.id !== last && state.firedEvents.filter((x) => x === e.id).length < max);
      if (!pool.length) pool = all.filter((e) => e.type === 'random' && e.id !== last);
      if (pool.length) { ev = rng.pick(pool); state.lastRandomEvent = ev.id; }
    }
    if (!ev) return null;
    state.pendingEvent = ev.id;
    state.firedEvents.push(ev.id);
    bus.emit(MSG.EVENT_FIRED, ev);
    return ev;
  }

  /**
   * Random event days of a week: a count from EVENTS_PER_WEEK [min, max], days apart (no two in a row),
   * not on a scheduled event day. @param {number} week @returns {number[]}
   */
  planDays(week) {
    const { content, rng } = this.ctx;
    const days = content.num('DAYS_PER_WEEK');
    const [lo, hi] = content.num('EVENTS_PER_WEEK');
    const fixed = content.all('events').filter((e) => e.type === 'scheduled' && e.trigger.week === week).map((e) => e.trigger.day);
    const want = rng.int(lo, hi), out = [];
    for (let tries = 0; out.length < want && tries < 50; tries++) {
      const d = rng.int(1, days);
      if (fixed.includes(d) || out.some((x) => Math.abs(x - d) <= 1) || fixed.some((x) => Math.abs(x - d) <= 1)) continue;
      out.push(d);
    }
    return out.sort((a, b) => a - b);
  }

  /** Can the player pick this response? @param {any} r */
  canPick(r) {
    if (!r.requires) return true;
    const { content, sys, state } = this.ctx;
    const item = content.get('items', r.requires.item);
    const have = item.kind === 'product'
      ? Object.keys(content.num('QUALITY_TIERS')).reduce((s, t) => s + Math.max(0, sys.economy.freeStock(item.id, t)), 0)
      : Inventory.count(state.inv, item.id, item.variants[0]);
    return have >= r.requires.qty;
  }

  /** @param {number} index */
  respond(index) {
    const { state, content, sys, bus } = this.ctx;
    const ev = state.pendingEvent && content.get('events', state.pendingEvent);
    if (!ev) return { ok: false, reason: 'none' };
    const r = ev.responses[index];
    if (!r || !this.canPick(r)) return { ok: false, reason: 'requires' };
    sys.effects.apply(r.effects, ev.title);
    state.pendingEvent = null;
    sys.log.add('event', `${ev.title}: ${r.label}`, ev.icon);
    bus.emit(MSG.EVENT_RESOLVED, { event: ev, response: r });
    return { ok: true };
  }
}
