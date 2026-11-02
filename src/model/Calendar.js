/** Calendar: month, week, day (0 = Monday) and minute of the day (minutes after midnight). Unity: [Serializable] class. */
export class Calendar {
  /** @param {number} weeksPerMonth @param {number} daysPerWeek */
  constructor(weeksPerMonth, daysPerWeek = 7) {
    this.weeksPerMonth = weeksPerMonth;
    this.daysPerWeek = daysPerWeek;
    this.month = 1;
    this.week = 1;
    this.day = 0;
    this.minute = 0;
  }

  isLastWeekOfMonth() {
    return this.week >= this.weeksPerMonth;
  }

  /** Day count from the start of the game (0 = month 1, week 1, Monday). Used for age and deadlines. */
  absDay() {
    return ((this.month - 1) * this.weeksPerMonth + (this.week - 1)) * this.daysPerWeek + this.day;
  }

  nextWeek() {
    this.week += 1;
    this.day = 0;
  }

  nextMonth() {
    this.month += 1;
    this.week = 1;
    this.day = 0;
  }

  clock() {
    const h = Math.floor(this.minute / 60), m = Math.round(this.minute % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  label() {
    return `Month ${this.month} · Week ${this.week}`;
  }

  snapshot() {
    return { month: this.month, week: this.week, day: this.day, minute: this.minute };
  }
}
