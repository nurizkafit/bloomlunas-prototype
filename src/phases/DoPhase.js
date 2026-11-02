import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';

/** DoPhase: the week, Monday to Sunday. Player starts activities and runs actions. Sleep on Sunday ends the week. Plan changes only for days not started. Events fire from the week queue (EventSystem). */
export class DoPhase extends Phase {
  constructor() {
    super('Do');
  }

  enter(ctx) {
    super.enter(ctx);
    ctx.state.weekStart = { waste: ctx.state.stats.waste, made: { ...ctx.state.stats.made }, sold: ctx.state.stats.sold, pathXp: { ...ctx.state.skills.pathXp }, subXp: { ...ctx.state.skills.subXp } };
    ctx.state.weekActual = {};
    ctx.state.weekPlanned = ctx.state.plan.cards.reduce((m, c) => { m[c.activityId] = (m[c.activityId] ?? 0) + ctx.sys.plan.duration(c); return m; }, {});
    ctx.sys.events.buildWeekQueue();
    ctx.sys.time.startDay(0);
    this.listen(ctx, MSG.INTENT_START_ACTIVITY, ({ activityId }) => ctx.sys.actions.startActivity(activityId));
    this.listen(ctx, MSG.INTENT_RUN_ACTION, ({ actionId, params }) => ctx.sys.actions.runAction(actionId, params));
    this.listen(ctx, MSG.INTENT_RESPOND_EVENT, ({ eventId, responseIndex }) => ctx.sys.events.respond(eventId, responseIndex));
    // Change the plan only for days that have not started (SPECS §5).
    const future = (day) => day > ctx.state.calendar.day;
    const refresh = () => ctx.bus.emit(MSG.PLAN_VALIDATED, ctx.sys.plan.validate());
    this.listen(ctx, MSG.INTENT_PLACE_CARD, (card) => {
      const a = ctx.content.get('activities', card.activityId);
      if (a.plannable && future(card.day)) { ctx.state.plan.place({ durationMin: a.planDurationMin, ...card }); refresh(); }
    });
    this.listen(ctx, MSG.INTENT_MOVE_CARD, ({ uid, ...changes }) => {
      const c = ctx.state.plan.cards.find((x) => x.uid === uid);
      if (c && future(c.day) && future(changes.day ?? c.day)) { ctx.state.plan.change(uid, changes); refresh(); }
    });
    this.listen(ctx, MSG.INTENT_REMOVE_CARD, ({ uid }) => {
      const c = ctx.state.plan.cards.find((x) => x.uid === uid);
      if (c && future(c.day)) { ctx.state.plan.remove(uid); refresh(); }
    });
  }

  next(ctx) {
    return 'Check';
  }
}
