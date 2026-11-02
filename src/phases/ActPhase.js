import { Phase } from './Phase.js';

/** ActPhase: end of month. Pay debt and utilities, invest, book appointments (M5). Then the ending check. */
export class ActPhase extends Phase {
  constructor() {
    super('Act');
  }

  next(ctx) {
    // M0: EndingChecker is a stub. The game ends after JAM_MONTHS months.
    const months = ctx.content.num('JAM_MONTHS');
    return ctx.state.calendar.month >= months ? 'Ending' : 'Plan';
  }

  exit(ctx) {
    super.exit(ctx);
    if (ctx.state.calendar.month < ctx.content.num('JAM_MONTHS')) ctx.state.calendar.nextMonth();
  }
}
