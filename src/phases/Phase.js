/**
 * Phase: base class for one step of the loop. Unity: abstract C# class (State pattern).
 */
export class Phase {
  /** @param {string} name */
  constructor(name) {
    this.name = name;
    /** @type {(()=>void)[]} */
    this.subs = [];
  }

  /** Listen to a message only while this phase is active. @param {any} ctx @param {string} msg @param {(p:any)=>void} fn */
  listen(ctx, msg, fn) {
    this.subs.push(ctx.bus.on(msg, fn));
  }

  /** End-of-phase rules (payments, month close). Runs before next() and exit(). @param {any} ctx */
  finish(ctx) {}

  /** @param {any} ctx */
  enter(ctx) {
    ctx.log(`enter ${this.name} · ${ctx.state.calendar.label()}`);
  }

  /** @param {any} ctx @param {number} dt */
  update(ctx, dt) {}

  /** @param {any} ctx */
  exit(ctx) {
    for (const off of this.subs) off();
    this.subs = [];
    ctx.log(`exit  ${this.name}`);
  }

  /** Name of the next phase, or null when the game ends. @param {any} ctx @returns {string|null} */
  next(ctx) {
    throw new Error(`${this.name}.next() is not implemented`);
  }
}
