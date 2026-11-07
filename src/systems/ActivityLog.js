/**
 * ActivityLog: the Log activity list in the Journal (last 600 lines). Unity: plain C# service.
 */
export class ActivityLog {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** @param {string} station @param {string} text @param {string} [icon] */
  add(station, text, icon) {
    const { state, sys } = this.ctx;
    state.log.push({ day: sys.time.absDay(), minute: state.cal.minute, station, text, icon: icon ?? station });
    if (state.log.length > 600) state.log.shift();
  }
}
