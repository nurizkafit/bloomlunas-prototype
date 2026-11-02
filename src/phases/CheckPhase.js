import { Phase } from './Phase.js';

/** CheckPhase: end of week. Sum the week, pay weekly expenses, write a note (M4). Goes to Act after the last week of the month. */
export class CheckPhase extends Phase {
  constructor() {
    super('Check');
  }

  next(ctx) {
    return ctx.state.calendar.isLastWeekOfMonth() ? 'Act' : 'Plan';
  }

  exit(ctx) {
    super.exit(ctx);
    if (!ctx.state.calendar.isLastWeekOfMonth()) ctx.state.calendar.nextWeek();
  }
}
