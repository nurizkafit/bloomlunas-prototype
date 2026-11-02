import { MSG } from './EventBus.js';

/**
 * PhaseMachine: holds the current phase and runs enter, update and exit.
 * Order on advance: finish() (end rules), next() (picks the next phase name), exit() (clean up). Unity: plain C# State pattern.
 */
export class PhaseMachine {
  /**
   * @param {import('./EventBus.js').EventBus} bus
   * @param {Record<string, import('../phases/Phase.js').Phase>} phases name -> phase
   * @param {any} ctx shared context passed to each phase (state, content, bus, systems)
   */
  constructor(bus, phases, ctx) {
    this.bus = bus;
    this.phases = phases;
    this.ctx = ctx;
    /** @type {import('../phases/Phase.js').Phase | null} */
    this.current = null;
  }

  /** @param {string} name */
  start(name) {
    this.#enter(name);
  }

  /** Leave the current phase and enter the one it names. Returns the new phase name, or null at the end. */
  advance() {
    const cur = this.current;
    if (!cur) throw new Error('PhaseMachine has not started');
    cur.finish(this.ctx);
    const nextName = cur.next(this.ctx);
    cur.exit(this.ctx);
    this.bus.emit(MSG.PHASE_EXITED, { phase: cur.name, next: nextName, calendar: this.ctx.state.calendar.snapshot() });
    if (!nextName) { this.current = null; return null; }
    this.#enter(nextName);
    return nextName;
  }

  /** @param {number} dt seconds */
  update(dt) {
    this.current?.update(this.ctx, dt);
  }

  #enter(name) {
    const phase = this.phases[name];
    if (!phase) throw new Error(`Unknown phase ${name}`);
    this.current = phase;
    phase.enter(this.ctx);
    this.bus.emit(MSG.PHASE_ENTERED, { phase: name, calendar: this.ctx.state.calendar.snapshot() });
  }
}
