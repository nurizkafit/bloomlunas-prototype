/**
 * Calendar: month, week (1..WEEKS_PER_MONTH), day (1..DAYS_PER_WEEK) and minute of the day.
 * Static helpers over the plain `state.cal` object, so the state stays plain JSON for saves.
 * Unity: [Serializable] class with the same fields.
 */
export class Calendar {
  /** @param {number} startMinute */
  static create(startMinute) {
    return { month: 1, week: 1, day: 1, minute: startMinute };
  }

  /** Week number from the game start (1..). @param {{month:number, week:number}} c @param {number} weeksPerMonth */
  static absWeek(c, weeksPerMonth) {
    return (c.month - 1) * weeksPerMonth + c.week;
  }

  /** Day number from the game start (1..). @param {{month:number, week:number, day:number}} c @param {number} wpm @param {number} dpw */
  static absDay(c, wpm, dpw) {
    return (Calendar.absWeek(c, wpm) - 1) * dpw + c.day;
  }

  /** Weekday index 0 = Mon .. 6 = Sun. @param {{day:number}} c */
  static weekday(c) {
    return (c.day - 1) % 7;
  }

  /** "08:30" @param {number} minute */
  static clock(minute) {
    const h = Math.floor(minute / 60), m = minute % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
