import { Phase } from './Phase.js';

/**
 * ActPhase: month end. Payment (debt, utilities), Appointment (book one guild service for next month), Recap.
 * finish() closes the month: unpaid bills -> debt, interest, late fee. A missed payment carries over.
 */
export class ActPhase extends Phase {
  constructor(ctx) { super('act', ctx); }

  enter() {
    const { state, sys } = this.ctx;
    const weeks = state.weeks.filter((w) => w.month === state.cal.month);
    state.actSummary = {
      month: state.cal.month, startDebt: state.debt.balance, minPayment: sys.debt.minPayment(),
      income: Math.round(weeks.reduce((s, w) => s + w.incomeTotal, 0)), spent: Math.round(weeks.reduce((s, w) => s + w.spentTotal, 0)),
      goalHits: weeks.reduce((s, w) => s + w.goalHits, 0), goalDays: weeks.length * 7, sold: weeks.reduce((s, w) => s + w.sold, 0), booked: null, closed: null
    };
  }

  /** @param {string} id */
  book(id) {
    const { state, content, sys } = this.ctx;
    const s = content.find('services', id);
    if (!s?.inAct || state.actSummary.booked || state.gold < s.price) return false;
    sys.ledger.add(-s.price, `Appointment: ${s.name}`, 'store');
    for (const e of s.effects) if (e.type === 'stat') state.pendingBoosts[e.target] = (state.pendingBoosts[e.target] ?? 0) + e.amount;
    state.actSummary.booked = id;
    state.servicesBought.push({ id, day: sys.time.absDay() });
    return true;
  }

  close() {
    const { state, sys } = this.ctx;
    const summary = sys.debt.closeMonth();
    for (const [k, v] of Object.entries(state.pendingBoosts)) state.boosts[k] = (state.boosts[k] ?? 0) + v;
    state.pendingBoosts = {};
    state.actSummary.closed = summary;
    state.months.push({ ...state.actSummary });
    return summary;
  }
}
