/**
 * Phase: base class of the phase machine (State pattern). enter() runs once when the phase starts.
 * A loaded save resumes a phase without enter(). Unity: C# abstract class.
 */
export class Phase {
  /** @param {string} name @param {any} ctx */
  constructor(name, ctx) {
    this.name = name;
    this.ctx = ctx;
  }

  enter() {}
}
