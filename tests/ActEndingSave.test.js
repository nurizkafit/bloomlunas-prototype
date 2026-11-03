import { describe, it, expect } from 'vitest';
import { GameManager } from '../src/core/GameManager.js';
import { SaveSystem } from '../src/core/SaveSystem.js';
import { MSG } from '../src/core/EventBus.js';
import { newContent } from './helpers.js';

/** Step a game to the Act phase of month 1. */
function toAct(content = newContent(), opts = {}) {
  const gm = new GameManager(content, opts);
  gm.start();
  while (gm.machine.current.name !== 'Act') { gm.state.pendingEvent = null; gm.bus.emit(MSG.INTENT_NEXT_PHASE); }
  return gm;
}

describe('ActPhase', () => {
  it('pay debt and utilities, invest once, book one appointment for next month', () => {
    const gm = toAct();
    const s = gm.state;
    s.wallet.gold = 1000;
    gm.bus.emit(MSG.INTENT_PAY_UTILITIES);
    gm.bus.emit(MSG.INTENT_PAY_DEBT, { amount: 300 });
    gm.bus.emit(MSG.INTENT_INVEST, { investmentId: 'shop_shelf' });
    gm.bus.emit(MSG.INTENT_INVEST, { investmentId: 'shop_shelf' });
    expect(s.investments).toEqual(['shop_shelf']);
    expect(gm.ctx.stat('CUSTOMERS_PER_HOUR')).toBe(gm.content.num('CUSTOMERS_PER_HOUR') + 1);
    gm.bus.emit(MSG.INTENT_BOOK_APPOINTMENT, { entityId: 'apothecary_guild', serviceId: 'appraisal', week: 1, day: 1, hour: 9 });
    gm.bus.emit(MSG.INTENT_BOOK_APPOINTMENT, { entityId: 'apothecary_guild', serviceId: 'appraisal', week: 2, day: 1, hour: 9 });
    expect(s.appointments.length).toBe(1);
    const daysPerMonth = gm.content.num('WEEKS_PER_MONTH') * gm.content.num('DAYS_PER_WEEK');
    expect(s.appointments[0].absDay).toBe(daysPerMonth + 1);
    gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    expect(gm.machine.current.name).toBe('Plan');
    expect(s.calendar.month).toBe(2);
    expect(s.monthReports.at(-1).fees).toBe(0);
  });

  it('an appointment at a closed hour is refused', () => {
    const gm = toAct();
    gm.bus.emit(MSG.INTENT_BOOK_APPOINTMENT, { entityId: 'apothecary_guild', serviceId: 'appraisal', week: 1, day: 6, hour: 9 });
    expect(gm.state.appointments.length).toBe(0);
  });
});

describe('EndingChecker', () => {
  it('Good: debt is 0', () => {
    const gm = toAct();
    gm.state.wallet.gold = 10000;
    gm.bus.emit(MSG.INTENT_PAY_UTILITIES);
    gm.bus.emit(MSG.INTENT_PAY_DEBT, { amount: 10000 });
    let ended = null;
    gm.bus.on(MSG.GAME_ENDED, (e) => { ended = e.endingId; });
    gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    expect(ended).toBe('good');
    expect(gm.machine.current.name).toBe('Ending');
  });

  it('Bad: debt passes DEBT_LIMIT', () => {
    const gm = toAct();
    gm.state.debt.balance = gm.content.num('DEBT_LIMIT') + 1;
    gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    expect(gm.state.endingId).toBe('bad');
  });

  it('Bad: debt > 0 at DEADLINE_MONTHS', () => {
    const c = newContent();
    c.balance.DEADLINE_MONTHS = { value: 1 };
    const gm = toAct(c);
    gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    expect(gm.state.endingId).toBe('bad');
  });
});

describe('SaveSystem', () => {
  it('saves at each phase end and a new game continues from the next phase', () => {
    const store = new Map();
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
    const content = newContent();
    const save = new SaveSystem(storage);
    const gm = new GameManager(content);
    save.attach(gm);
    gm.start();
    gm.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'processing', day: 0, startMin: 18 * 60 });
    gm.bus.emit(MSG.INTENT_NEXT_PHASE); // Plan -> Do (saved, next = Do)
    gm.state.wallet.gold = 123;
    gm.state.pendingEvent = null;
    gm.bus.emit(MSG.INTENT_NEXT_PHASE); // Do -> Check (saved, next = Check)
    const data = save.read();
    expect(data.nextPhase).toBe('Check');
    const gm2 = new GameManager(content, { save: data });
    gm2.start();
    expect(gm2.machine.current.name).toBe('Check');
    expect(gm2.state.wallet.gold).toBe(123 - content.num('WEEKLY_EXPENSES'));
    expect(gm2.state.plan.cards.length).toBe(1);
    expect(gm2.state.inventory.count('turmeric', 'fresh')).toBe(gm.state.inventory.count('turmeric', 'fresh'));
    expect(typeof gm2.state.inventory.take).toBe('function');
    save.clear();
    expect(save.read()).toBeNull();
  });
});
