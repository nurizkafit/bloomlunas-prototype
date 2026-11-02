/**
 * EventBus: typed publish and subscribe between logic and view.
 * Views send `intent.*`. Logic sends `*.changed`, `phase.*` and results.
 * Unity: C# events or ScriptableObject event channels.
 */

/** All message names (SPECS.md §7). Use these constants, not string literals. */
export const MSG = Object.freeze({
  INTENT_NEXT_PHASE: 'intent.nextPhase',
  INTENT_PLACE_CARD: 'intent.placeCard',
  INTENT_MOVE_CARD: 'intent.moveCard',
  INTENT_REMOVE_CARD: 'intent.removeCard',
  INTENT_SET_BUDGET: 'intent.setBudget',
  INTENT_LOCK_PLAN: 'intent.lockPlan',
  INTENT_START_ACTIVITY: 'intent.startActivity',
  INTENT_RUN_ACTION: 'intent.runAction',
  INTENT_RESPOND_EVENT: 'intent.respondEvent',
  INTENT_WRITE_NOTE: 'intent.writeNote',
  INTENT_PAY_DEBT: 'intent.payDebt',
  INTENT_PAY_UTILITIES: 'intent.payUtilities',
  INTENT_INVEST: 'intent.invest',
  INTENT_BOOK_APPOINTMENT: 'intent.bookAppointment',
  PHASE_ENTERED: 'phase.entered',
  PHASE_EXITED: 'phase.exited',
  CLOCK_CHANGED: 'clock.changed',
  LEDGER_CHANGED: 'ledger.changed',
  INVENTORY_CHANGED: 'inventory.changed',
  SKILL_CHANGED: 'skill.changed',
  DEBT_CHANGED: 'debt.changed',
  RELATIONSHIP_CHANGED: 'relationship.changed',
  ACTION_STARTED: 'action.started',
  ACTION_COMPLETED: 'action.completed',
  ACTION_REFUSED: 'action.refused',
  EVENT_FIRED: 'event.fired',
  EVENT_RESOLVED: 'event.resolved',
  PLAN_VALIDATED: 'plan.validated',
  GAME_ENDED: 'game.ended'
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
    return () => this.off(name, fn);
  }

  /** @param {string} name @param {Function} fn */
  off(name, fn) {
    this.handlers.get(name)?.delete(fn);
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
