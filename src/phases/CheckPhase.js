import { Phase } from './Phase.js';

/**
 * CheckPhase: the weekly recap in the Journal. Pays the weekly living cost (unpaid -> debt),
 * sums the week (goals, store goal, budget vs actual, income and costs, XP), the player writes a note.
 */
export class CheckPhase extends Phase {
  constructor(ctx) { super('check', ctx); }

  enter() {
    const { state, content, sys } = this.ctx;
    const living = content.num('WEEKLY_EXPENSES');
    const paid = Math.min(living, Math.max(0, state.gold));
    if (paid) sys.ledger.add(-paid, 'Living cost', 'bills');
    if (paid < living) sys.debt.addUnpaid(living - paid, 'Living cost');
    const w = state.week;
    const sold = Object.values(w.sold).reduce((s, q) => s + q, 0);
    const income = Object.values(w.income).reduce((s, q) => s + q, 0);
    const spent = Object.values(w.spent).reduce((s, q) => s + q, 0);
    state.checkSummary = {
      absWeek: sys.time.absWeek(), month: state.cal.month, week: state.cal.week,
      goals: [...state.plan.goals], goalsMet: [...w.goalsMet], goalHits: w.goalsMet.filter(Boolean).length,
      storeGoal: sys.plan.storeGoal(), sold, soldBy: { ...w.sold },
      budget: { ...state.plan.budget }, spent: { ...w.spent }, income: { ...w.income }, incomeTotal: Math.round(income), spentTotal: Math.round(spent),
      startGold: w.startGold, endGold: state.gold, xp: { ...w.xp }, unpaidLiving: Math.max(0, living - paid),
      bufferKept: state.gold >= state.plan.budget.buffer, debt: state.debt.balance
    };
  }
}
