import { Phase } from './Phase.js';
import { GameState } from '../model/GameState.js';

/**
 * PlanPhase: the Journal opens on the Plan page. New prices and trends, a new quest board,
 * a suggested plan. The player sets daily goals, the store plan and the budget jars, then locks the plan.
 */
export class PlanPhase extends Phase {
  constructor(ctx) { super('plan', ctx); }

  enter() {
    const { state, content, sys } = this.ctx;
    const days = content.num('DAYS_PER_WEEK');
    sys.economy.rollWeek();
    sys.quests.rollBoard();
    state.plan = { ...GameState.freshPlan(days), products: { ...(state.plan?.products ?? {}) } };
    state.week = GameState.freshWeek(days);
    state.week.startGold = state.gold;
    state.place = 'home';
    state.cal.day = 1;
    state.cal.minute = content.num('DAY_START_HOUR') * 60;
    sys.plan.suggest();
  }
}
