import { describe, it, expect } from 'vitest';
import { GameManager } from '../src/core/GameManager.js';
import { MSG } from '../src/core/EventBus.js';
import { newContent } from './helpers.js';

function inPlan() {
  const gm = new GameManager(newContent());
  let last = null;
  gm.bus.on(MSG.PLAN_VALIDATED, (r) => { last = r; });
  gm.start();
  return { gm, v: gm.ctx.sys.plan, place: (c) => gm.bus.emit(MSG.INTENT_PLACE_CARD, c), last: () => last };
}

describe('PlanValidator', () => {
  it('a shop card in opening hours has no problem', () => {
    const { gm, place, last } = inPlan();
    place({ activityId: 'open_shop', day: 0, startMin: 9 * 60, durationMin: 180 });
    const card = gm.state.plan.cards[0];
    expect(last().issues[card.uid]).toBeUndefined();
  });

  it('closed day and outside hours are problems', () => {
    const { gm, place, last } = inPlan();
    place({ activityId: 'open_shop', day: 6, startMin: 9 * 60 });
    place({ activityId: 'visit', day: 0, startMin: 15 * 60, locationId: 'loc_market' });
    const [a, b] = gm.state.plan.cards;
    expect(last().issues[a.uid][0].msg).toMatch(/closed on Sun/);
    expect(last().issues[b.uid][0].msg).toMatch(/closed for all of this slot/);
  });

  it('3-hour slots: 7 slots from 06:00 to 03:00; cards start on a slot edge', () => {
    const { v } = inPlan();
    expect(v.slots().map((m) => m / 60)).toEqual([6, 9, 12, 15, 18, 21, 24]);
    expect(v.slotCheck({ activityId: 'explore', durationMin: 180 }, 1, 7 * 60).msg).toMatch(/slot edge/);
    expect(v.duration({ activityId: 'visit', durationMin: 60 })).toBe(180);
  });

  it('overlap is refused in slotCheck and reported in validate', () => {
    const { gm, v, place, last } = inPlan();
    place({ activityId: 'explore', day: 1, startMin: 9 * 60, durationMin: 360 });
    expect(v.slotCheck({ activityId: 'explore', durationMin: 180 }, 1, 12 * 60).lvl).toBe('bad');
    expect(v.slotCheck({ activityId: 'explore', durationMin: 180 }, 1, 6 * 60).lvl).toBe('ok');
    place({ activityId: 'explore', day: 1, startMin: 12 * 60 });
    expect(last().bad).toBeGreaterThan(0);
  });

  it('night slots 18-24 are fine; 00-03 midnight is a warning; past 03:00 is a problem; sleep is not a card', () => {
    const { gm, v } = inPlan();
    const craft = { activityId: 'grinding', durationMin: 180 };
    expect(v.slotCheck(craft, 2, 21 * 60).lvl).toBe('ok');
    expect(v.slotCheck(craft, 2, 24 * 60).lvl).toBe('warn');
    expect(v.slotCheck({ activityId: 'grinding', durationMin: 360 }, 2, 24 * 60).lvl).toBe('bad');
    expect(gm.content.get('activities', 'rest').plannable).toBe(false);
  });

  it('craft without materials: problem; with a buy card before it: warning', () => {
    const { gm, place, last } = inPlan();
    place({ activityId: 'craft', day: 0, startMin: 9 * 60, recipeId: 'beras_kencur' });
    const craft = gm.state.plan.cards[0];
    expect(last().issues[craft.uid][0].lvl).toBe('bad');
    gm.bus.emit(MSG.INTENT_MOVE_CARD, { uid: craft.uid, day: 2, startMin: 12 * 60 });
    place({ activityId: 'visit', day: 2, startMin: 6 * 60, locationId: 'loc_market' });
    expect(last().issues[craft.uid][0].lvl).toBe('warn');
  });

  it('craft length comes from the recipe, rounded up to whole slots', () => {
    const { v } = inPlan();
    expect(v.duration({ activityId: 'craft', recipeId: 'turmeric_salep', durationMin: 60 })).toBe(360);
    expect(v.duration({ activityId: 'craft', recipeId: 'kunyit_asam', durationMin: 60 })).toBe(180);
  });

  it('budget: expenses slot below living cost is a problem; free gold is a warning', () => {
    const { gm, last } = inPlan();
    gm.bus.emit(MSG.INTENT_SET_BUDGET, { slot: 'exp', amount: 10 });
    expect(last().plan.some((p) => p.lvl === 'bad' && /Weekly expenses/.test(p.msg))).toBe(true);
    expect(last().plan.some((p) => p.lvl === 'warn' && /no job/.test(p.msg))).toBe(true);
  });

  it('remove and lock', () => {
    const { gm, place } = inPlan();
    place({ activityId: 'grinding', day: 0, startMin: 18 * 60 });
    gm.bus.emit(MSG.INTENT_REMOVE_CARD, { uid: gm.state.plan.cards[0].uid });
    expect(gm.state.plan.cards.length).toBe(0);
    gm.bus.emit(MSG.INTENT_LOCK_PLAN);
    place({ activityId: 'grinding', day: 0, startMin: 18 * 60 });
    expect(gm.state.plan.cards.length).toBe(0);
  });
});
