import { Phase } from './Phase.js';

/** EndingPhase: Shows the ending text (M5). */
export class EndingPhase extends Phase {
  constructor() {
    super('Ending');
  }

  next(ctx) {
    return null;
  }
}
