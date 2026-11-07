/**
 * StoreSystem: the Open shop flow. Open (one energy cost) -> serve one hour at a time
 * until sold out or closing time (the view replays the hours) -> close with the Shop result.
 * Unity: plain C# service.
 */
export class StoreSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  inHours() {
    const [o, c] = this.ctx.content.num('STORE_OPEN_HOURS');
    const m = this.ctx.state.cal.minute;
    return m >= o * 60 && m + 60 <= c * 60;
  }

  open() {
    const { state } = this.ctx;
    state.store.open = true;
    state.store.result = { start: state.cal.minute, hours: [], customers: 0, sold: {}, income: 0, end: null, reason: null };
  }

  /** 'soldOut' | 'closing' | null */
  stopReason() {
    if (!this.ctx.sys.economy.shelfUnits()) return 'soldOut';
    if (!this.inHours()) return 'closing';
    if (this.ctx.sys.time.check(60, 0)) return 'closing';
    return null;
  }

  hour() {
    const { state } = this.ctx;
    const h = this.ctx.sys.economy.serveHour();
    const r = state.store.result;
    r.hours.push(h);
    r.customers += h.customers;
    r.income = Math.round((r.income + h.income) * 10) / 10;
    for (const s of h.sold) r.sold[s.item] = (r.sold[s.item] ?? 0) + 1;
    return { hour: h, stop: null };
  }

  close() {
    const { state } = this.ctx;
    if (!state.store.open) return { result: null };
    state.store.open = false;
    const r = state.store.result;
    r.end = state.cal.minute;
    r.reason = this.ctx.sys.economy.shelfUnits() ? 'closing' : 'soldOut';
    r.unsold = this.ctx.sys.economy.shelfUnits();
    return { result: r };
  }
}
