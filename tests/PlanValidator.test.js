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
    place({ activityId: 'open_shop', day: 0, startMin: 8 * 60, durationMin: 240 });
    const card = gm.state.plan.cards[0];
    expect(last().issues[card.uid]).toBeUndefined();
  });

  it('closed day and outside hours are problems', () => {
    const { gm, place, last } = inPlan();
    place({ activityId: 'open_shop', day: 6, startMin: 8 * 60 });
    place({ activityId: 'buy', day: 0, startMin: 13 * 60, locationId: 'loc_market' });
    const [a, b] = gm.state.plan.cards;
    expect(last().issues[a.uid][0].msg).toMatch(/closed on Sun/);
    expect(last().issues[b.uid][0].msg).toMatch(/open 06:00–12:00/);
  });

  it('overlap is refused in slotCheck and reported in validate', () => {
    const { gm, v, place, last } = inPlan();
    place({ activityId: 'explore', day: 1, startMin: 7 * 60 });
    expect(v.slotCheck({ activityId: 'rest', durationMin: 60 }, 1, 8 * 60).lvl).toBe('bad');
    expect(v.slotCheck({ activityId: 'rest', durationMin: 60 }, 1, 10 * 60).lvl).toBe('ok');
    place({ activityId: 'rest', day: 1, startMin: 8 * 60 });
    expect(last().bad).toBeGreaterThan(0);
  });

  it('night work is a warning; past the night limit is a problem', () => {
    const { v } = inPlan();
    expect(v.slotCheck({ activityId: 'rest', durationMin: 120 }, 2, 20 * 60).lvl).toBe('warn');
    expect(v.slotCheck({ activityId: 'rest', durationMin: 120 }, 2, 22 * 60).lvl).toBe('bad');
  });

  it('craft without materials: problem; with a buy card before it: warning', () => {
    const { gm, place, last } = inPlan();
    place({ activityId: 'craft', day: 0, startMin: 8 * 60, recipeId: 'beras_kencur' });
    const craft = gm.state.plan.cards[0];
    expect(last().issues[craft.uid][0].lvl).toBe('bad');
    gm.bus.emit(MSG.INTENT_MOVE_CARD, { uid: craft.uid, day: 2, startMin: 13 * 60 });
    place({ activityId: 'buy', day: 2, startMin: 7 * 60, locationId: 'loc_market' });
    expect(last().issues[craft.uid][0].lvl).toBe('warn');
  });

  it('craft length comes from the recipe', () => {
    const { v } = inPlan();
    expect(v.duration({ activityId: 'craft', recipeId: 'turmeric_salep', durationMin: 60 })).toBe(240);
  });

  it('budget: expenses slot below living cost is a problem; free gold is a warning', () => {
    const { gm, last } = inPlan();
    gm.bus.emit(MSG.INTENT_SET_BUDGET, { slot: 'exp', amount: 10 });
    expect(last().plan.some((p) => p.lvl === 'bad' && /Weekly expenses/.test(p.msg))).toBe(true);
    expect(last().plan.some((p) => p.lvl === 'warn' && /no job/.test(p.msg))).toBe(true);
  });

  it('remove and lock', () => {
    const { gm, place } = inPlan();
    place({ activityId: 'rest', day: 0, startMin: 20 * 60 });
    gm.bus.emit(MSG.INTENT_REMOVE_CARD, { uid: gm.state.plan.cards[0].uid });
    expect(gm.state.plan.cards.length).toBe(0);
    gm.bus.emit(MSG.INTENT_LOCK_PLAN);
    place({ activityId: 'rest', day: 0, startMin: 20 * 60 });
    expect(gm.state.plan.cards.length).toBe(0);
  });
});
