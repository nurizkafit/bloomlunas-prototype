/** Ledger: every gold line, written at once when it happens. Check sums the week. Unity: [Serializable] class. */
export class Ledger {
  constructor() {
    /** @type {{month:number, week:number, day:number, minute:number, label:string, amount:number, kind:string}[]} */
    this.lines = [];
  }

  /** @param {{month:number, week:number, day:number, minute:number}} when @param {string} label @param {number} amount @param {string} kind */
  add(when, label, amount, kind) {
    this.lines.push({ month: when.month, week: when.week, day: when.day, minute: when.minute, label, amount, kind });
  }

  /** @param {number} month @param {number} week */
  week(month, week) {
    const lines = this.lines.filter((l) => l.month === month && l.week === week);
    const income = lines.filter((l) => l.amount > 0).reduce((n, l) => n + l.amount, 0);
    const expenses = lines.filter((l) => l.amount < 0).reduce((n, l) => n - l.amount, 0);
    return { lines, income, expenses, net: income - expenses };
  }
}
