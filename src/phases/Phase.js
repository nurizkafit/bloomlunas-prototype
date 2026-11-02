/**
 * Phase: base class for one step of the loop. Unity: abstract C# class (State pattern).
 */
export class Phase {
  /** @param {string} name */
  constructor(name) {
    this.name = name;
  }

  /** @param {any} ctx */
  enter(ctx) {
    ctx.log(`enter ${this.name} · ${ctx.state.calendar.label()}`);
  }

  /** @param {any} ctx @param {number} dt */
  update(ctx, dt) {}

  /** @param {any} ctx */
  exit(ctx) {
    ctx.log(`exit  ${this.name}`);
  }

  /** Name of the next phase, or null when the game ends. @param {any} ctx @returns {string|null} */
  next(ctx) {
    throw new Error(`${this.name}.next() is not implemented`);
  }
}
