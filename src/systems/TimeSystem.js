import { MSG } from '../core/EventBus.js';
import { Calendar } from '../model/Calendar.js';

/**
 * TimeSystem: the day clock and energy. A day runs from DAY_START_HOUR to DAY_END_HOUR.
 * Every action uses minutes and energy. Sleep ends the day. Unity: plain C# service.
 */
export class TimeSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get endMinute() { return this.ctx.content.num('DAY_END_HOUR') * 60; }

  absDay() {
    const { state, content } = this.ctx;
    return Calendar.absDay(state.cal, content.num('WEEKS_PER_MONTH'), content.num('DAYS_PER_WEEK'));
  }

  absWeek() {
    return Calendar.absWeek(this.ctx.state.cal, this.ctx.content.num('WEEKS_PER_MONTH'));
  }

  /** Why the player cannot spend this, or null. @param {number} min @param {number} energy */
  check(min, energy) {
    const { state } = this.ctx;
    if (state.cal.minute + min > this.endMinute) return 'late';
    if (energy > 0 && state.energy < energy) return 'tired';
    return null;
  }

  /** Use time and energy. @param {number} min @param {number} energy @param {boolean} [work] counts as work time */
  spend(min, energy, work = true) {
    const { state } = this.ctx;
    state.energy = Math.max(0, Math.min(state.energyMax, state.energy - energy));
    this.advance(min, false);
    if (work) state.day.workMin += min;
  }

  /** Move the clock. An event may push past the day end: clamp. @param {number} min @param {boolean} [clampToEnd] */
  advance(min, clampToEnd = true) {
    const { state, bus } = this.ctx;
    state.cal.minute = clampToEnd ? Math.min(this.endMinute, state.cal.minute + min) : state.cal.minute + min;
    bus.emit(MSG.CLOCK_CHANGED, { ...state.cal, energy: state.energy });
  }

  /** Is a place open now (and still open after min minutes)? @param {any} place @param {number} [min] */
  isOpen(place, min = 0) {
    const h = place.hours[Calendar.weekday(this.ctx.state.cal)];
    if (!h) return false;
    const m = this.ctx.state.cal.minute;
    return m >= h[0] * 60 && m + min <= h[1] * 60;
  }

  /** Is a place open at arrival? Early arrival waits for opening. @param {any} place @param {number} travelMin */
  openOnArrival(place, travelMin) {
    const h = place.hours[Calendar.weekday(this.ctx.state.cal)];
    if (!h) return false;
    return this.ctx.state.cal.minute + travelMin < h[1] * 60;
  }

  /** Hours of a place today, or null when closed. @param {any} place */
  hoursToday(place) {
    return place.hours[Calendar.weekday(this.ctx.state.cal)];
  }
}
