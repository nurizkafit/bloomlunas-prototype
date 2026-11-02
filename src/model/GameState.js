import { Calendar } from './Calendar.js';

/**
 * GameState: all saved data. M0 holds only the calendar; M1 adds wallet, inventory, debt, skills,
 * relationships, plan and ledger. Unity: [Serializable] class saved as JSON.
 */
export class GameState {
  /** @param {import('../core/ContentDB.js').ContentDB} content */
  static create(content) {
    const s = new GameState();
    s.calendar = new Calendar(content.num('WEEKS_PER_MONTH'));
    return s;
  }
}
