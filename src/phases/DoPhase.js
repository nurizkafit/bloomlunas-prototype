import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';

/** DoPhase: the week, Monday to Sunday. Player starts activities and runs actions. Sleep on Sunday ends the week. Events in M4. */
export class DoPhase extends Phase {
  constructor() {
    super('Do');
  }

  enter(ctx) {
    super.enter(ctx);
    ctx.state.weekStart = { waste: ctx.state.stats.waste, made: { ...ctx.state.stats.made }, sold: ctx.state.stats.sold };
    ctx.sys.time.startDay(0);
    this.listen(ctx, MSG.INTENT_START_ACTIVITY, ({ activityId }) => ctx.sys.actions.startActivity(activityId));
    this.listen(ctx, MSG.INTENT_RUN_ACTION, ({ actionId, params }) => ctx.sys.actions.runAction(actionId, params));
  }

  next(ctx) {
    return 'Check';
  }
}
