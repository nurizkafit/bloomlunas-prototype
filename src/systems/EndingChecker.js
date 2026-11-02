import { MSG } from '../core/EventBus.js';

/**
 * EndingChecker: checks EndingData rules after the month closes (Act).
 * Rules (docs endings/all-endings.md): debt_paid = debt is 0 on or before DEADLINE_MONTHS (Good);
 * bankrupt_or_deadline = debt passed DEBT_LIMIT, or debt > 0 after DEADLINE_MONTHS (Bad).
 * Unity: plain C# service.
 */
export class EndingChecker {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** @returns {string|null} ending id */
  check() {
    const { state, content } = this.ctx;
    const month = state.calendar.month, debt = state.debt.balance, deadline = content.num('DEADLINE_MONTHS');
    const rules = {
      debt_paid: () => debt <= 0 && month <= deadline,
      bankrupt_or_deadline: () => state.debt.bankrupt || (month >= deadline && debt > 0)
    };
    for (const e of content.all('endings')) {
      const rule = rules[e.rule];
      if (!rule) throw new Error(`EndingChecker: unknown rule ${e.rule}`);
      if (rule()) {
        state.endingId = e.id;
        this.ctx.bus.emit(MSG.GAME_ENDED, { endingId: e.id });
        return e.id;
      }
    }
    return null;
  }
}
