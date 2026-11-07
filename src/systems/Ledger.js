import { MSG } from '../core/EventBus.js';
import { Calendar } from '../model/Calendar.js';

/**
 * Ledger: every gold change goes through here. It writes a ledger line and the week totals
 * (spent per budget jar, income per source). Unity: plain C# service.
 */
export class Ledger {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /**
   * @param {number} amount + income, - cost
   * @param {string} label
   * @param {string} cat cost: 'store' | 'personal' | 'bills'; income: 'store' | 'market' | 'guild' | 'quest' | 'other'
   */
  add(amount, label, cat) {
    const { state, content, bus } = this.ctx;
    amount = Math.round(amount * 100) / 100;
    if (!amount) return;
    state.gold = Math.round((state.gold + amount) * 100) / 100;
    const absDay = Calendar.absDay(state.cal, content.num('WEEKS_PER_MONTH'), content.num('DAYS_PER_WEEK'));
    const line = { absDay, day: state.cal.day, minute: state.cal.minute, label, amount, cat };
    state.ledger.push(line);
    if (state.ledger.length > 800) state.ledger.shift();
    state.week.lines.push(line);
    if (amount < 0) state.week.spent[cat] = (state.week.spent[cat] ?? 0) - amount;
    else state.week.income[cat] = (state.week.income[cat] ?? 0) + amount;
    bus.emit(MSG.LEDGER_CHANGED, line);
  }
}
