import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';

/**
 * CheckPhase: end of week. Pays WEEKLY_EXPENSES (the part gold cannot cover becomes debt) and writes the week report:
 * income, expenses, XP per path, plan vs actual minutes per activity, events, lost cards. intent.writeNote saves a note for the next Plan. Goes to Act after the last week of the month.
 */
export class CheckPhase extends Phase {
  constructor() {
    super('Check');
  }

  enter(ctx) {
    super.enter(ctx);
    const { state, content, sys } = ctx;
    const cost = content.num('WEEKLY_EXPENSES');
    const paid = Math.min(cost, Math.max(0, state.wallet.gold));
    if (paid) sys.effects.apply([{ type: 'gold', amount: -paid, label: 'Weekly expenses' }], 'expenses');
    sys.debt.addUnpaid(cost - paid, 'Weekly expenses');
    const { month, week } = state.calendar;
    state.priceHistory = state.priceHistory ?? [];
    state.priceHistory.push({ month, week, prices: { ...state.prices } });
    const w = state.ledger.week(month, week);
    const made = {};
    for (const [t, n] of Object.entries(state.stats.made)) {
      const d = n - (state.weekStart?.made?.[t] ?? 0);
      if (d) made[t] = d;
    }
    state.weekReports = state.weekReports ?? [];
    state.weekReports.push({
      month, week,
      income: round2(w.income), expenses: round2(w.expenses), net: round2(w.net),
      gold: state.wallet.gold, debt: state.debt.balance,
      sold: state.stats.sold - (state.weekStart?.sold ?? 0),
      waste: state.stats.waste - (state.weekStart?.waste ?? 0),
      made, unpaid: cost - paid,
      doNet: round2(w.lines.filter((l) => l.kind !== 'expenses').reduce((n, l) => n + l.amount, 0)),
      living: paid,
      xp: Object.fromEntries(Object.entries(state.skills.pathXp).map(([k, v]) => [k, v - (state.weekStart?.pathXp?.[k] ?? 0)]).filter(([, v]) => v)),
      subXp: Object.fromEntries(Object.entries(state.skills.subXp).map(([k, v]) => [k, v - (state.weekStart?.subXp?.[k] ?? 0)]).filter(([, v]) => v)),
      planned: { ...(state.weekPlanned ?? {}) },
      actual: { ...(state.weekActual ?? {}) },
      events: [...(state.weekEvents ?? [])],
      lost: (state.lostCards ?? []).filter((c) => c.month === month && c.week === week).map((c) => c.activityId)
    });
    this.listen(ctx, MSG.INTENT_WRITE_NOTE, ({ text }) => {
      const t = String(text ?? '').trim();
      if (!t) return;
      state.notes = state.notes ?? [];
      state.notes.push({ month, week, text: t });
    });
  }

  next(ctx) {
    return ctx.state.calendar.isLastWeekOfMonth() ? 'Act' : 'Plan';
  }

  exit(ctx) {
    super.exit(ctx);
    if (!ctx.state.calendar.isLastWeekOfMonth()) ctx.state.calendar.nextWeek();
  }
}

/** @param {number} n */
function round2(n) {
  return Math.round(n * 100) / 100;
}
