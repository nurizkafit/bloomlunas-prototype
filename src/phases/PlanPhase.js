import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';

/**
 * PlanPhase: start of week. Real prices are rolled (hidden). The player places activity cards,
 * sets budget slots and locks the plan. Each change runs PlanValidator and sends plan.validated.
 * intent.moveCard carries { uid, ...changes } (day, startMin, durationMin, locationId, recipeId).
 */
export class PlanPhase extends Phase {
  constructor() {
    super('Plan');
  }

  enter(ctx) {
    super.enter(ctx);
    const { state, content, sys } = ctx;
    ctx.sys.economy.rollWeeklyPrices();
    state.plan.clear();
    state.plan.budget = { exp: Math.min(content.num('WEEKLY_EXPENSES'), Math.max(0, Math.floor(state.wallet.gold))), buy: 0, buf: 0 };
    const changed = () => ctx.bus.emit(MSG.PLAN_VALIDATED, sys.plan.validate());
    this.listen(ctx, MSG.INTENT_PLACE_CARD, (card) => {
      if (state.plan.locked) return;
      const a = content.get('activities', card.activityId);
      if (!a.plannable) return;
      state.plan.place({ durationMin: a.planDurationMin, ...card });
      changed();
    });
    this.listen(ctx, MSG.INTENT_MOVE_CARD, ({ uid, ...changes }) => { if (!state.plan.locked) { state.plan.change(uid, changes); changed(); } });
    this.listen(ctx, MSG.INTENT_REMOVE_CARD, ({ uid }) => { if (!state.plan.locked) { state.plan.remove(uid); changed(); } });
    this.listen(ctx, MSG.INTENT_SET_BUDGET, ({ slot, amount }) => { state.plan.budget[slot] = Math.max(0, amount); changed(); });
    this.listen(ctx, MSG.INTENT_LOCK_PLAN, () => { state.plan.locked = true; changed(); });
    changed();
  }

  next(ctx) {
    return 'Do';
  }

  exit(ctx) {
    ctx.state.plan.locked = true;
    super.exit(ctx);
  }
}
