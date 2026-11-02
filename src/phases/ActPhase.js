import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';

/**
 * ActPhase: end of month. Player pays debt and utilities (view, investment and appointments in M5).
 * finish(): riba interest, hidden fee, unpaid utilities to debt, bankrupt check.
 * Then Ending if bankrupt or after JAM_MONTHS (EndingChecker in M5), else next month.
 */
export class ActPhase extends Phase {
  constructor() {
    super('Act');
  }

  enter(ctx) {
    super.enter(ctx);
    this.listen(ctx, MSG.INTENT_PAY_DEBT, ({ amount }) => ctx.sys.debt.pay(amount));
    this.listen(ctx, MSG.INTENT_PAY_UTILITIES, () => ctx.sys.debt.payUtilities());
  }

  finish(ctx) {
    const summary = ctx.sys.debt.closeMonth();
    ctx.state.monthReports = ctx.state.monthReports ?? [];
    ctx.state.monthReports.push({ month: ctx.state.calendar.month, ...summary, gold: ctx.state.wallet.gold });
  }

  next(ctx) {
    if (ctx.state.debt.bankrupt) return 'Ending';
    return ctx.state.calendar.month >= ctx.content.num('JAM_MONTHS') ? 'Ending' : 'Plan';
  }

  exit(ctx) {
    super.exit(ctx);
    if (!ctx.state.debt.bankrupt && ctx.state.calendar.month < ctx.content.num('JAM_MONTHS')) ctx.state.calendar.nextMonth();
  }
}
