import { Phase } from './Phase.js';

/**
 * RetroPhase: the end of the jam build. No Good or Bad ending: a look back at the two months
 * (gold and debt over time, goals met, sales, budget habits, notes). Unity: results screen.
 */
export class RetroPhase extends Phase {
  constructor(ctx) { super('retro', ctx); }

  enter() {
    this.ctx.state.finished = true;
  }

  /** All numbers for the retrospective screen. */
  summary() {
    const { state, content } = this.ctx;
    const weeks = state.weeks;
    const goalDays = weeks.reduce((s, w) => s + w.goals.filter(Boolean).length, 0);
    const goalHits = weeks.reduce((s, w) => s + w.goalHits, 0);
    const storeWeeks = weeks.filter((w) => w.storeGoal > 0);
    const startDebt = content.num('DEBT_START');
    return {
      weeks: weeks.length,
      startGold: content.num('GOLD_START'), endGold: state.gold,
      startDebt, endDebt: state.debt.balance, interest: state.debt.interestTotal, fees: state.debt.feesTotal, carried: state.debt.carriedTotal,
      paid: state.debt.months.reduce((s, m) => s + m.paid, 0), missedMonths: state.debt.months.filter((m) => m.shortfall > 0).length,
      goalRate: goalDays ? goalHits / goalDays : 0, goalHits, goalDays,
      storeRate: storeWeeks.length ? storeWeeks.filter((w) => w.sold >= w.storeGoal).length / storeWeeks.length : 0,
      bufferRate: weeks.length ? weeks.filter((w) => w.bufferKept).length / weeks.length : 0,
      sold: weeks.reduce((s, w) => s + w.sold, 0), income: weeks.reduce((s, w) => s + w.incomeTotal, 0), spent: weeks.reduce((s, w) => s + w.spentTotal, 0),
      quests: state.quests.done.length, questsMissed: state.quests.missed.length,
      skills: { ...state.skills }, history: state.history, weekList: weeks, notes: state.notes, months: state.debt.months
    };
  }
}
