import { describe, it, expect } from 'vitest';
import { gameInDo } from './helpers.js';

const run = (gm, id, params) => gm.ctx.sys.actions.runAction(id, params);

describe('ActionRunner', () => {
  it('needs an activity, and the right location', () => {
    const gm = gameInDo();
    expect(run(gm, 'gather-harvest').ok).toBe(false);
    gm.ctx.sys.actions.startActivity('explore');
    expect(run(gm, 'gather-harvest').reason).toMatch(/go to/);
    expect(run(gm, 'travel', { to: 'loc_market' }).ok).toBe(false);
    const r = run(gm, 'travel', { to: 'loc_gather_area' });
    expect(r).toMatchObject({ ok: true, minutes: 40 });
    expect(run(gm, 'gather-harvest').ok).toBe(true);
  });

  it('spends time and energy, gives XP', () => {
    const gm = gameInDo();
    const s = gm.state;
    gm.ctx.sys.actions.startActivity('explore');
    run(gm, 'travel', { to: 'loc_gather_area' });
    const before = { min: s.calendar.minute, energy: s.player.energy };
    run(gm, 'gather-harvest');
    expect(s.calendar.minute).toBe(before.min + 60);
    expect(s.player.energy).toBe(before.energy - gm.content.num('ENERGY_COST_EXPLORE'));
    expect(s.skills.subXp.foraging).toBe(3);
  });

  it('refuses when energy is too low', () => {
    const gm = gameInDo();
    gm.state.player.energy = 5;
    gm.ctx.sys.actions.startActivity('explore');
    run(gm, 'travel', { to: 'loc_gather_area' });
    expect(run(gm, 'gather-harvest').reason).toMatch(/energy/);
  });

  it('respects opening hours (apothecary opens at 8)', () => {
    const gm = gameInDo();
    gm.ctx.sys.actions.startActivity('sell_to_organization');
    run(gm, 'travel', { to: 'loc_apothecary_guild' });
    expect(gm.state.calendar.minute).toBeLessThan(8 * 60);
    expect(run(gm, 'sell-item', { item: 'salep', qty: 1 }).reason).toMatch(/closed/);
    gm.state.calendar.minute = 9 * 60;
    const r = run(gm, 'sell-item', { item: 'salep', qty: 1 });
    expect(r.ok).toBe(true);
    expect(r.gold).toBeGreaterThan(0);
    expect(gm.state.ledger.lines.at(-1).amount).toBe(r.gold);
  });

  it('buys at the market and writes a ledger line', () => {
    const gm = gameInDo();
    const gold = gm.state.wallet.gold;
    gm.ctx.sys.actions.startActivity('buy');
    run(gm, 'travel', { to: 'loc_market' });
    const r = run(gm, 'buy-item', { item: 'palm_sugar', qty: 2 });
    expect(r.ok).toBe(true);
    expect(gm.state.inventory.count('palm_sugar', 'block')).toBe(2);
    expect(gm.state.wallet.gold).toBeCloseTo(gold + r.gold, 2);
  });

  it('crafts a recipe: uses materials, makes the product with a tier', () => {
    const gm = gameInDo();
    const inv = gm.state.inventory;
    inv.add('tamarind', 'paste', 1);
    inv.add('palm_sugar', 'block', 1);
    gm.ctx.sys.actions.startActivity('craft');
    run(gm, 'travel', { to: 'loc_home_atelier' });
    expect(run(gm, 'concoct', { recipeId: 'kunyit_asam' }).ok).toBe(false);
    const jamu = inv.count('fresh_jamu');
    const r = run(gm, 'brew', { recipeId: 'kunyit_asam' });
    expect(r).toMatchObject({ ok: true, tier: 'Amateur', qty: 6, minutes: 180 });
    expect(inv.count('fresh_jamu')).toBe(jamu + 6);
    expect(inv.count('tamarind')).toBe(0);
  });

  it('gives the plan match bonus once: activity + day + time', () => {
    const gm = gameInDo();
    const s = gm.state;
    s.plan.place({ activityId: 'explore', day: 0, startMin: s.calendar.minute, durationMin: 60 });
    const r = gm.ctx.sys.actions.startActivity('explore');
    const c = gm.content;
    expect(r.bonus).toBe(c.num('PLAN_MATCH_XP_BONUS_ACTIVITY') + c.num('PLAN_MATCH_XP_BONUS_DAY') + c.num('PLAN_MATCH_XP_BONUS_TIME'));
    expect(gm.ctx.sys.actions.startActivity('explore').bonus).toBe(0);
  });

  it('sun drying then grinding makes dried, then powder', () => {
    const gm = gameInDo();
    const inv = gm.state.inventory;
    gm.ctx.sys.actions.startActivity('sun_drying');
    run(gm, 'travel', { to: 'loc_home_drying_yard' });
    expect(run(gm, 'start-batch', { item: 'turmeric', qty: 4 }).ok).toBe(true);
    expect(run(gm, 'collect-batch').ok).toBe(false);
    gm.state.calendar.day += gm.content.num('SUN_DRYING_DAYS');
    gm.state.calendar.minute = 9 * 60;
    expect(run(gm, 'collect-batch').collected).toBe(4);
    gm.ctx.sys.actions.startActivity('grinding');
    run(gm, 'travel', { to: 'loc_home_atelier' });
    expect(run(gm, 'grind', { item: 'turmeric', qty: 4 }).minutes).toBe(60);
    expect(inv.count('turmeric', 'powder')).toBe(4);
  });

  it('a quest: take, hand in, reward and relationship', () => {
    const gm = gameInDo();
    const s = gm.state;
    s.calendar.minute = 9 * 60;
    gm.ctx.sys.actions.startActivity('commission');
    run(gm, 'travel', { to: 'loc_apothecary_guild' });
    expect(run(gm, 'take-quest', { questId: 'ap_q1' }).ok).toBe(true);
    expect(run(gm, 'hand-in-quest', { questId: 'ap_q1' }).ok).toBe(false);
    s.inventory.add('salep', 'product', 3, { tier: 'Standard' });
    const r = run(gm, 'hand-in-quest', { questId: 'ap_q1' });
    expect(r).toMatchObject({ ok: true, gold: 60 });
    expect(s.relations.points.apothecary_guild).toBe(5);
  });

  it('a quest past its deadline fails with a relationship loss', () => {
    const gm = gameInDo();
    const s = gm.state;
    s.quests.push({ id: 'x', entityId: 'merchant_guild', ask: { item: 'salep', qty: 1 }, rewardGold: 1, relationship: 1, dueDay: 0 });
    gm.ctx.sys.time.startDay(1);
    expect(s.quests.length).toBe(0);
    expect(s.relations.points.merchant_guild).toBe(-gm.content.num('QUEST_MISS_RELATIONSHIP_PENALTY'));
  });
});

describe('DoPhase plan changes', () => {
  it('only days that have not started can change', async () => {
    const { MSG } = await import('../src/core/EventBus.js');
    const gm = gameInDo();
    gm.state.calendar.day = 2;
    gm.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'rest', day: 1, startMin: 20 * 60 });
    expect(gm.state.plan.cards.length).toBe(0);
    gm.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'rest', day: 3, startMin: 20 * 60 });
    expect(gm.state.plan.cards.length).toBe(1);
    const uid = gm.state.plan.cards[0].uid;
    gm.bus.emit(MSG.INTENT_MOVE_CARD, { uid, day: 2 });
    expect(gm.state.plan.cards[0].day).toBe(3);
    gm.bus.emit(MSG.INTENT_MOVE_CARD, { uid, day: 4 });
    expect(gm.state.plan.cards[0].day).toBe(4);
  });
});
