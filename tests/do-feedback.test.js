import { describe, it, expect } from 'vitest';
import { Inventory } from '../src/model/Inventory.js';
import { gameInDo } from './helpers.js';

const travel = (gm, place) => gm.sys.actions.run('travel', { place });

describe('bulk trade (one action, many lines)', () => {
  it('buys many materials for one trade time', () => {
    const gm = gameInDo();
    gm.state.gold = 1000;
    travel(gm, 'market');
    const t0 = gm.state.cal.minute;
    const r = gm.sys.actions.run('marketBuy', { lines: [{ item: 'turmeric', variant: 'fresh', qty: 4 }, { item: 'ginger', variant: 'fresh', qty: 3 }] });
    expect(r.ok).toBe(true);
    expect(gm.state.cal.minute - t0).toBe(gm.content.num('TRADE_MIN'));
    expect(Inventory.count(gm.state.inv, 'ginger', 'fresh', '')).toBeGreaterThanOrEqual(3);
  });

  it('refuses an empty list and a list over the gold', () => {
    const gm = gameInDo();
    travel(gm, 'market');
    expect(gm.sys.actions.run('marketBuy', { lines: [] }).reason).toBe('empty');
    gm.state.gold = 1;
    expect(gm.sys.actions.run('marketBuy', { lines: [{ item: 'beeswax', variant: 'block', qty: 50 }] }).reason).toBe('gold');
  });
});

describe('quest board requests (player gives a quest)', () => {
  it('pays now from the Store jar and the items arrive after REQUEST_DAYS', () => {
    const gm = gameInDo();
    gm.state.gold = 500;
    gm.state.cal.minute = 8 * 60;
    travel(gm, 'guild');
    const before = Inventory.count(gm.state.inv, 'turmeric', 'dried', '');
    const r = gm.sys.actions.run('questPost', { item: 'turmeric', variant: 'dried', qty: 5 });
    expect(r.ok).toBe(true);
    expect(gm.state.week.spent.store).toBeGreaterThan(0);
    expect(gm.state.quests.requests.length).toBe(1);
    for (let d = 0; d < gm.content.num('REQUEST_DAYS'); d++) { gm.state.pendingEvent = null; gm.action('sleep'); }
    expect(Inventory.count(gm.state.inv, 'turmeric', 'dried', '')).toBe(before + 5);
    expect(gm.state.quests.requests.length).toBe(0);
  });

  it('limits open requests', () => {
    const gm = gameInDo();
    gm.state.gold = 5000;
    gm.state.cal.minute = 8 * 60;
    travel(gm, 'guild');
    for (let i = 0; i < gm.content.num('REQUEST_MAX_OPEN'); i++) expect(gm.sys.actions.run('questPost', { item: 'ginger', variant: 'fresh', qty: 5 }).ok).toBe(true);
    expect(gm.sys.actions.run('questPost', { item: 'ginger', variant: 'fresh', qty: 5 }).reason).toBe('requests');
  });
});

describe('end exploration', () => {
  it('returns a recap of walks, gathered items, time and XP', () => {
    const gm = gameInDo();
    gm.state.cal.minute = 7 * 60;
    travel(gm, 'outskirt');
    gm.sys.actions.run('exploreWalk');
    gm.sys.actions.run('exploreGather');
    gm.sys.actions.run('exploreWalk');
    gm.sys.actions.run('exploreSkip');
    const r = gm.sys.actions.run('exploreEnd');
    expect(r.ok).toBe(true);
    expect(r.recap.walks).toBe(2);
    expect(r.recap.gathered).toBe(1);
    expect(r.recap.skipped).toBe(1);
    expect(r.recap.items.length).toBeGreaterThan(0);
    expect(r.recap.min).toBeGreaterThan(0);
    expect(gm.state.explore.session).toBe(null);
  });
});

describe('week plan (user rule, 8 Nov 2026)', () => {
  it('cannot change goals in the Do phase', () => {
    const gm = gameInDo();
    const before = [...gm.state.plan.goals];
    expect(gm.sys.plan.setGoal(6, 'explore')).toBe(false);
    expect(gm.state.plan.goals).toEqual(before);
  });
});
