import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';

/**
 * ActPhase: end of month (docs loop/act.md). The player pays debt and utilities, may buy 1 investment
 * (Upgrade) and book 1 service appointment for next month.
 * finish(): DebtSystem.closeMonth (interest, hidden fee, unpaid to debt, bankrupt check), then EndingChecker.
 * next(): Ending if an ending rule is met, else Plan of the next month.
 */
export class ActPhase extends Phase {
  constructor() {
    super('Act');
  }

  enter(ctx) {
    super.enter(ctx);
    const { state, content, sys } = ctx;
    state.actThisMonth = { invested: null, booked: null };
    this.listen(ctx, MSG.INTENT_PAY_DEBT, ({ amount }) => sys.debt.pay(amount));
    this.listen(ctx, MSG.INTENT_PAY_UTILITIES, () => sys.debt.payUtilities());
    this.listen(ctx, MSG.INTENT_INVEST, ({ investmentId }) => this.invest(ctx, investmentId));
    this.listen(ctx, MSG.INTENT_BOOK_APPOINTMENT, (p) => this.book(ctx, p));
    void content;
  }

  /** Buy one investment. Refused if already bought this month, owned (once), or not enough gold. */
  invest(ctx, investmentId) {
    const { state, content, sys } = ctx;
    const inv = content.get('investments', investmentId);
    state.investments = state.investments ?? [];
    if (state.actThisMonth.invested) return { ok: false, reason: 'one investment per month' };
    if (inv.once && state.investments.includes(inv.id)) return { ok: false, reason: 'already owned' };
    if (!state.wallet.canPay(inv.price)) return { ok: false, reason: 'not enough gold' };
    sys.effects.apply([{ type: 'gold', amount: -inv.price, label: `Investment: ${inv.name}` }, ...inv.effects], 'investment');
    state.investments.push(inv.id);
    state.actThisMonth.invested = inv.id;
    return { ok: true };
  }

  /** Book one service appointment for next month. p = { entityId, serviceId, week, day, hour } */
  book(ctx, p) {
    const { state, content } = ctx;
    if (state.actThisMonth.booked) return { ok: false, reason: 'one appointment per month' };
    const entity = content.get('entities', p.entityId);
    if (!entity.services?.some((s) => s.id === p.serviceId)) return { ok: false, reason: 'no such service' };
    const loc = content.all('locations').find((l) => l.entityId === p.entityId);
    const h = loc?.openHours?.[p.day];
    if (!h || p.hour < h[0] || p.hour + 1 > h[1]) return { ok: false, reason: 'closed at that time' };
    const cal = state.calendar, daysPerMonth = cal.weeksPerMonth * cal.daysPerWeek;
    const absDay = cal.month * daysPerMonth + (p.week - 1) * cal.daysPerWeek + p.day;
    const appt = { entityId: p.entityId, serviceId: p.serviceId, absDay, minute: p.hour * 60, done: false };
    state.appointments.push(appt);
    state.actThisMonth.booked = appt;
    return { ok: true, appt };
  }

  finish(ctx) {
    const { state, sys } = ctx;
    const summary = sys.debt.closeMonth();
    state.monthReports = state.monthReports ?? [];
    state.monthReports.push({ month: state.calendar.month, ...summary, gold: state.wallet.gold });
    sys.endings.check();
  }

  next(ctx) {
    return ctx.state.endingId ? 'Ending' : 'Plan';
  }

  exit(ctx) {
    super.exit(ctx);
    if (!ctx.state.endingId) ctx.state.calendar.nextMonth();
  }
}
