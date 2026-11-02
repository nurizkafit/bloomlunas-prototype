/** Calendar: month, week, day and minute of the game. Unity: [Serializable] class. */
export class Calendar {
  /** @param {number} weeksPerMonth */
  constructor(weeksPerMonth) {
    this.weeksPerMonth = weeksPerMonth;
    this.month = 1;
    this.week = 1;
    this.day = 0;
    this.minute = 0;
  }

  isLastWeekOfMonth() {
    return this.week >= this.weeksPerMonth;
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

  label() {
    return `Month ${this.month} · Week ${this.week}`;
  }

  snapshot() {
    return { month: this.month, week: this.week, day: this.day, minute: this.minute };
  }
}
