import { Phase } from './Phase.js';

/** PlanPhase: Start of week. Player places activity cards and sets budget slots (M2). */
export class PlanPhase extends Phase {
  constructor() {
    super('Plan');
  }

  next(ctx) {
    return 'Do';
  }
}
