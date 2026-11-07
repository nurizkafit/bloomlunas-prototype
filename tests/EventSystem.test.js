import { describe, it, expect } from 'vitest';
import { GameManager } from '../src/core/GameManager.js';
import { MSG } from '../src/core/EventBus.js';
import { newContent, gameInDo } from './helpers.js';

describe('EventSystem', () => {
  it('builds a queue with scheduled events of the week and EVENTS_PER_WEEK random ones', () => {
    const c = newContent();
    const gm = gameInDo(c);
    const q = gm.state.eventQueue;
    const randomN = q.filter((e) => c.get('events', e.eventId).type === 'random').length;
    expect(randomN).toBeGreaterThanOrEqual(c.num('EVENTS_PER_WEEK_MIN'));
    expect(randomN).toBeLessThanOrEqual(c.num('EVENTS_PER_WEEK_MAX'));
    gm.state.calendar.week = 2;
    const q2 = gm.ctx.sys.events.buildWeekQueue();
    expect(q2.some((e) => e.eventId === 'festival')).toBe(true);
  });

  it('fires when the clock passes the event time, blocks actions, and the answer applies effects', () => {
    const gm = gameInDo();
    const s = gm.state;
    s.eventQueue = [{ eventId: 'tool_breaks', absDay: 0, minute: 7 * 60 }];
    let fired = null;
    gm.bus.on(MSG.EVENT_FIRED, (e) => { fired = e; });
    gm.ctx.sys.actions.startActivity('explore');
    gm.ctx.sys.actions.runAction('travel', { to: 'loc_gather_area' });
    expect(fired).toBeNull();
    gm.ctx.sys.actions.runAction('gather-harvest');
    expect(fired.event.id).toBe('tool_breaks');
    expect(gm.ctx.sys.actions.runAction('gather-harvest').reason).toMatch(/event/);
    const gold = s.wallet.gold;
    gm.bus.emit(MSG.INTENT_RESPOND_EVENT, { eventId: 'tool_breaks', responseIndex: 0 });
    expect(s.wallet.gold).toBe(gold - 25);
    expect(s.pendingEvent).toBeNull();
    expect(gm.ctx.sys.actions.runAction('gather-harvest').ok).toBe(true);
  });

  it('a response that needs gold or stock is refused without it', () => {
    const gm = gameInDo();
    gm.state.wallet.gold = 5;
    gm.state.pendingEvent = { eventId: 'family_request' };
    expect(gm.ctx.sys.events.respond('family_request', 0).ok).toBe(false);
    expect(gm.ctx.sys.events.respond('family_request', 2).ok).toBe(true);
  });

  it('time used by an event removes planned cards it overlaps', () => {
    const c = newContent();
    const gm = new GameManager(c);
    gm.start();
    gm.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'open_shop', day: 0, startMin: 9 * 60, durationMin: 240 });
    gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    const s = gm.state;
    s.calendar.minute = 8 * 60;
    s.pendingEvent = { eventId: 'tool_breaks' };
    s.weekEvents = [];
    gm.ctx.sys.events.respond('tool_breaks', 1); // fix it yourself: 180 min
    expect(s.plan.cards.length).toBe(0);
    expect(s.lostCards.at(-1).activityId).toBe('open_shop');
  });
});

describe('CheckPhase recap', () => {
  it('ledger total in Check = sum of the Do ledger lines; the note is saved', () => {
    const gm = gameInDo();
    const a = gm.ctx.sys.actions;
    a.startActivity('open_shop');
    a.runAction('travel', { to: 'loc_home_shop' });
    gm.state.calendar.minute = 9 * 60;
    a.runAction('restock-shelf', { item: 'fresh_jamu', ratio: 1 });
    a.runAction('serve-customer');
    a.runAction('serve-customer');
    a.startActivity('visit');
    a.runAction('travel', { to: 'loc_market' });
    gm.state.calendar.minute = 9 * 60;
    a.runAction('buy-item', { item: 'rice', qty: 2 });
    const doLines = gm.state.ledger.lines.filter((l) => l.week === 1).reduce((n, l) => n + l.amount, 0);
    gm.state.pendingEvent = null;
    gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    const w = gm.state.weekReports.at(-1);
    expect(w.doNet).toBeCloseTo(doLines, 2);
    expect(w.net).toBeCloseTo(doLines - gm.content.num('WEEKLY_EXPENSES'), 2);
    expect(w.actual.open_shop).toBeGreaterThan(0);
    gm.bus.emit(MSG.INTENT_WRITE_NOTE, { text: 'Buy rice earlier.' });
    expect(gm.state.notes.at(-1)).toMatchObject({ week: 1, text: 'Buy rice earlier.' });
  });
});
