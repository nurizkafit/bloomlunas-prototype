import { MSG } from '../core/EventBus.js';
import { Inventory } from '../model/Inventory.js';

/**
 * EventSystem: one event card at most per day, at the day start.
 * Scheduled events fire on their week and day. Else a random event fires with EVENT_CHANCE_PER_DAY.
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
    let ev = all.find((e) => e.type === 'scheduled' && e.trigger.week === week && e.trigger.day === day && !state.firedEvents.includes(e.id));
    if (!ev && rng.chance(content.num('EVENT_CHANCE_PER_DAY'))) {
      const pool = all.filter((e) => e.type === 'random' && state.firedEvents.filter((x) => x === e.id).length < 2);
      if (pool.length) ev = rng.pick(pool);
    }
    if (!ev) return null;
    state.pendingEvent = ev.id;
    state.firedEvents.push(ev.id);
    bus.emit(MSG.EVENT_FIRED, ev);
    return ev;
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
