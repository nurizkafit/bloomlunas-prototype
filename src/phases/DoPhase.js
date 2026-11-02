import { Phase } from './Phase.js';

/** DoPhase: During the week. Player starts activities and runs actions; events fire (M3, M4). */
export class DoPhase extends Phase {
  constructor() {
    super('Do');
  }

  next(ctx) {
    return 'Check';
  }
}
