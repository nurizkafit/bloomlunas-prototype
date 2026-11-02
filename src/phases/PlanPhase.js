import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';

/** PlanPhase: start of week. Real prices are rolled (hidden). Player places activity cards and locks the plan (view in M2). */
export class PlanPhase extends Phase {
  constructor() {
    super('Plan');
  }

  enter(ctx) {
    super.enter(ctx);
    ctx.sys.economy.rollWeeklyPrices();
    ctx.state.plan.clear();
    this.listen(ctx, MSG.INTENT_PLACE_CARD, (card) => ctx.state.plan.place(card));
    this.listen(ctx, MSG.INTENT_LOCK_PLAN, () => { ctx.state.plan.locked = true; });
  }

  next(ctx) {
    return 'Do';
  }
}
