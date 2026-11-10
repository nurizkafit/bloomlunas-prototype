/**
 * EventBus: publish and subscribe between logic and view.
 * Views send `intent.*`. Logic sends `*.changed`, `phase.*` and results.
 * Unity: C# events or ScriptableObject event channels.
 */

/** All message names (SPECS.md §6). Use these constants, not string literals. */
export const MSG = Object.freeze({
  INTENT_SET_GOAL: 'intent.setGoal',
  INTENT_SET_PRODUCT: 'intent.setProduct',
  INTENT_SET_BUDGET: 'intent.setBudget',
  INTENT_LOCK_PLAN: 'intent.lockPlan',
  INTENT_ACTION: 'intent.action',
  INTENT_RESPOND_EVENT: 'intent.respondEvent',
  INTENT_WRITE_NOTE: 'intent.writeNote',
  INTENT_FINISH_CHECK: 'intent.finishCheck',
  INTENT_PAY_DEBT: 'intent.payDebt',
  INTENT_PAY_UTILITIES: 'intent.payUtilities',
  INTENT_BOOK_SERVICE: 'intent.bookService',
  INTENT_FINISH_ACT: 'intent.finishAct',
  INTENT_TUTORIAL_SEEN: 'intent.tutorialSeen',
  INTENT_READ_NOTICES: 'intent.readNotices',
  PHASE_ENTERED: 'phase.entered',
  PHASE_EXITED: 'phase.exited',
  STATE_CHANGED: 'state.changed',
  CLOCK_CHANGED: 'clock.changed',
  LEDGER_CHANGED: 'ledger.changed',
  ACTION_DONE: 'action.done',
  ACTION_REFUSED: 'action.refused',
  DAY_STARTED: 'day.started',
  DAY_ENDED: 'day.ended',
  EVENT_FIRED: 'event.fired',
  EVENT_RESOLVED: 'event.resolved',
  PLAN_VALIDATED: 'plan.validated',
  NOTICE_ADDED: 'notice.added',
  GAME_FINISHED: 'game.finished'
});

const KNOWN = new Set(Object.values(MSG));

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.handlers = new Map();
  }

  /** @param {string} name @param {(payload:any)=>void} fn @returns {()=>void} unsubscribe */
  on(name, fn) {
    this.#check(name);
    if (!this.handlers.has(name)) this.handlers.set(name, new Set());
    this.handlers.get(name).add(fn);
    return () => this.handlers.get(name)?.delete(fn);
  }

  /** @param {string} name @param {any} [payload] */
  emit(name, payload) {
    this.#check(name);
    for (const fn of [...(this.handlers.get(name) ?? [])]) fn(payload);
  }

  #check(name) {
    if (!KNOWN.has(name)) throw new Error(`Unknown EventBus message: ${name}`);
  }
}
