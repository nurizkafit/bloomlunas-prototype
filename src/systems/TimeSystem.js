import { MSG } from '../core/EventBus.js';

/**
 * TimeSystem: the clock moves only when an action runs (SPECS §5).
 * Energy, fatigue (low energy at sleep, or work or sleep after DAY_END_HOUR = midnight), late wake-up, day end, week end.
 * Unity: plain C# service owned by GameManager.
 */
export class TimeSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #c() { return this.ctx.content; }

  /** Real minutes for an action: fatigue makes work slower. @param {number} base */
  effectiveMinutes(base) {
    const p = this.ctx.state.player;
    return p.fatigued ? Math.round(base * (1 + this.#c.num('FATIGUE_EFFICIENCY_PENALTY'))) : base;
  }

  /** True if an action of this length ends before NIGHT_END_HOUR. @param {number} minutes */
  fits(minutes) {
    return this.ctx.state.calendar.minute + minutes <= this.#c.num('NIGHT_END_HOUR') * 60;
  }

  /** @param {number} minutes */
  advance(minutes) {
    const { state, bus } = this.ctx;
    state.calendar.minute += minutes;
    if (state.calendar.minute > this.#c.num('DAY_END_HOUR') * 60) state.player.workedLate = true;
    bus.emit(MSG.CLOCK_CHANGED, state.calendar.snapshot());
  }

  /** @param {number} amount */
  spendEnergy(amount) {
    const p = this.ctx.state.player;
    p.energy = Math.max(0, p.energy - amount);
  }

  /** Sleep: fatigue check, energy back, day ends. On the last day the week ends. */
  sleep() {
    const { state } = this.ctx;
    const p = state.player;
    p.fatigued = p.energy < this.#c.num('FATIGUE_THRESHOLD') || p.workedLate || state.calendar.minute > this.#c.num('DAY_END_HOUR') * 60;
    p.energy = Math.min(this.#c.num('ENERGY_MAX'), p.energy + this.#c.num('ENERGY_REST_RECOVERY'));
    p.dayOver = true;
    if (state.calendar.day >= this.#c.num('DAYS_PER_WEEK') - 1) p.weekOver = true;
    else this.startDay(state.calendar.day + 1);
  }

  /** Start a day: wake up (late if fatigued and unlucky), then the daily ticks. @param {number} day 0 = Monday */
  startDay(day) {
    const { state, rng, sys } = this.ctx;
    const p = state.player;
    state.calendar.day = day;
    state.calendar.minute = this.#c.num('DAY_START_HOUR') * 60;
    p.lateWake = p.fatigued && rng.chance(this.#c.num('LATE_WAKE_CHANCE'));
    if (p.lateWake) state.calendar.minute += this.#c.num('LATE_WAKE_DELAY_MIN');
    p.workedLate = false;
    p.meals = [];
    p.dayOver = false;
    p.weekOver = false;
    p.activityId = null;
    p.location = 'loc_home';
    sys.production.onDayStart();
    sys.economy.onDayStart();
    this.ctx.bus.emit(MSG.CLOCK_CHANGED, state.calendar.snapshot());
    sys.events?.tick();
  }
}
