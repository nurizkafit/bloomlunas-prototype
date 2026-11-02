import { MSG } from '../core/EventBus.js';

/**
 * EventSystem: the week event queue (SPECS §3, docs events/how-events-work.md).
 * Scheduled events come from their trigger (week, day, hour). Random events: rng.int(EVENTS_PER_WEEK_MIN, _MAX)
 * picks from data/events (type random), each at a random day (Mon–Sat) and hour in the day.
 * An event fires when the clock passes its time. While it waits for an answer, actions are refused.
 * The answer applies its EffectData list. Planned cards that overlap the time the event used are lost.
 * Unity: plain C# service.
 */
export class EventSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #c() { return this.ctx.content; }

  /** Build the queue for the current week (Do enter). */
  buildWeekQueue() {
    const { state, rng } = this.ctx;
    const cal = state.calendar, base = cal.absDay() - cal.day;
    const all = this.#c.all('events');
    const queue = [];
    for (const e of all.filter((x) => x.type === 'scheduled' && x.trigger.week === cal.week && (x.trigger.month ?? cal.month) === cal.month)) {
      queue.push({ eventId: e.id, absDay: base + e.trigger.day, minute: e.trigger.hour * 60 });
    }
    const random = all.filter((x) => x.type === 'random');
    const n = random.length ? rng.int(this.#c.num('EVENTS_PER_WEEK_MIN'), this.#c.num('EVENTS_PER_WEEK_MAX')) : 0;
    const start = this.#c.num('DAY_START_HOUR') + 1, end = this.#c.num('DAY_END_HOUR') - 1;
    for (let i = 0; i < n; i++) {
      const e = pickWeighted(random, rng);
      queue.push({ eventId: e.id, absDay: base + rng.int(0, 5), minute: rng.int(start, end) * 60 });
    }
    queue.sort((a, b) => a.absDay - b.absDay || a.minute - b.minute);
    state.eventQueue = queue;
    state.pendingEvent = null;
    state.weekEvents = [];
    state.lostCards = state.lostCards ?? [];
    return queue;
  }

  /** Scheduled events of this week, for the Plan view (they show in the Public Schedule). */
  scheduledThisWeek() {
    const cal = this.ctx.state.calendar;
    return this.#c.all('events').filter((x) => x.type === 'scheduled' && x.trigger.week === cal.week && (x.trigger.month ?? cal.month) === cal.month);
  }

  /** Fire the next due event, if any. Call after each action and at day start. */
  tick() {
    const { state, bus } = this.ctx;
    if (state.pendingEvent || !state.eventQueue?.length || state.player.weekOver) return null;
    const now = state.calendar.absDay(), min = state.calendar.minute;
    const next = state.eventQueue[0];
    if (next.absDay > now || (next.absDay === now && next.minute > min)) return null;
    state.eventQueue.shift();
    state.pendingEvent = { ...next, firedAt: { absDay: now, minute: min } };
    const event = this.#c.get('events', next.eventId);
    bus.emit(MSG.EVENT_FIRED, { event, pending: state.pendingEvent });
    return event;
  }

  /** Why this response cannot be picked now, or null. @param {any} response */
  blocked(response) {
    const r = response.requires;
    if (!r) return null;
    const { state } = this.ctx;
    if (r.gold && state.wallet.gold < r.gold) return `needs ${r.gold} G`;
    if (r.item && state.inventory.count(r.item) < (r.qty ?? 1)) return `needs ${r.qty ?? 1} ${this.#c.get('items', r.item).name}`;
    return null;
  }

  /** @param {string} eventId @param {number} responseIndex */
  respond(eventId, responseIndex) {
    const { state, bus } = this.ctx;
    const p = state.pendingEvent;
    if (!p || p.eventId !== eventId) return { ok: false, reason: 'no such event' };
    const event = this.#c.get('events', eventId);
    const response = event.responses[responseIndex];
    if (!response) return { ok: false, reason: 'no such response' };
    const why = this.blocked(response);
    if (why) return { ok: false, reason: why };
    const start = state.calendar.minute;
    this.ctx.sys.effects.apply(response.effects, `event:${eventId}`);
    const lost = this.#loseCards(start, state.calendar.minute);
    state.pendingEvent = null;
    const out = { ok: true, eventId, responseIndex, label: response.label, lost: lost.map((c) => c.activityId) };
    state.weekEvents.push({ eventId, title: event.title, response: response.label, day: state.calendar.day, lost: out.lost });
    bus.emit(MSG.EVENT_RESOLVED, out);
    this.tick();
    return out;
  }

  /** Planned cards for today that overlap [from, to) are lost (the event used their time). */
  #loseCards(from, to) {
    const { state } = this.ctx;
    if (to <= from) return [];
    const plan = state.plan, dur = (c) => this.ctx.sys.plan.duration(c);
    const lost = plan.cards.filter((c) => !c.used && c.day === state.calendar.day && c.startMin < to && c.startMin + dur(c) > from);
    for (const c of lost) { plan.remove(c.uid); state.lostCards.push({ ...c, week: state.calendar.week, month: state.calendar.month }); }
    return lost;
  }
}

/** All random events have weight trigger.chance. */
function pickWeighted(list, rng) {
  const total = list.reduce((n, e) => n + (e.trigger.chance ?? 1), 0);
  let r = rng.next() * total;
  for (const e of list) { r -= e.trigger.chance ?? 1; if (r < 0) return e; }
  return list.at(-1);
}
