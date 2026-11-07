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

  it('walks 0 min between stations in the same building (interior)', () => {
    const gm = gameInDo(), w = (a, b) => gm.ctx.sys.actions.walkMinutes(a, b);
    expect(w('loc_home', 'loc_home_atelier')).toBe(0);
    expect(w('loc_home_atelier', 'loc_home_shop')).toBe(0);
    expect(w('loc_home_shop', 'loc_home_drying_yard')).toBe(5);
    expect(w('loc_home', 'loc_market')).toBe(20);
    gm.ctx.sys.actions.startActivity('craft');
    expect(run(gm, 'travel', { to: 'loc_home_atelier' })).toMatchObject({ ok: true, minutes: 0 });
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
    gm.ctx.sys.actions.startActivity('visit');
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
    gm.ctx.sys.actions.startActivity('visit');
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

  it('processing: start and collect drying at the yard, then grind at the atelier', () => {
    const gm = gameInDo();
    const inv = gm.state.inventory;
    gm.ctx.sys.actions.startActivity('processing');
    run(gm, 'travel', { to: 'loc_home_drying_yard' });
    expect(run(gm, 'grind', { item: 'turmeric', qty: 1 }).ok).toBe(false); // grind is only at the atelier
    expect(run(gm, 'start-batch', { item: 'turmeric', qty: 4 }).ok).toBe(true);
    expect(run(gm, 'collect-batch').ok).toBe(false);
    gm.state.calendar.day += gm.content.num('SUN_DRYING_DAYS');
    gm.state.calendar.minute = 9 * 60;
    expect(run(gm, 'collect-batch').collected).toBe(4);
    run(gm, 'travel', { to: 'loc_home_atelier' });
    expect(run(gm, 'collect-batch').ok).toBe(false); // drying is only at the yard
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
    gm.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'processing', day: 1, startMin: 18 * 60 });
    expect(gm.state.plan.cards.length).toBe(0);
    gm.bus.emit(MSG.INTENT_PLACE_CARD, { activityId: 'processing', day: 3, startMin: 18 * 60 });
    expect(gm.state.plan.cards.length).toBe(1);
    const uid = gm.state.plan.cards[0].uid;
    gm.bus.emit(MSG.INTENT_MOVE_CARD, { uid, day: 2 });
    expect(gm.state.plan.cards[0].day).toBe(3);
    gm.bus.emit(MSG.INTENT_MOVE_CARD, { uid, day: 4 });
    expect(gm.state.plan.cards[0].day).toBe(4);
  });
});

describe('Small rest, meals and sleep (Prototype Iteration rules)', () => {
  it('small rest: any time, no activity needed, 30 min, +energy up to max', () => {
    const gm = gameInDo(), s = gm.state, c = gm.content;
    s.player.energy = 50;
    const r = run(gm, 'small-rest');
    expect(r).toMatchObject({ ok: true, minutes: c.num('SMALL_REST_MIN') });
    expect(s.player.energy).toBe(50 + c.num('SMALL_REST_ENERGY'));
    expect(s.calendar.minute).toBe(c.num('DAY_START_HOUR') * 60 + c.num('SMALL_REST_MIN'));
    run(gm, 'small-rest');
    expect(s.player.energy).toBe(c.num('ENERGY_MAX'));
  });

  it('meals: only in their window, once a day each; free', () => {
    const gm = gameInDo(), s = gm.state, c = gm.content;
    s.player.energy = 40;
    const gold = s.wallet.gold;
    expect(run(gm, 'eat')).toMatchObject({ ok: true, meal: 'breakfast' });
    expect(s.player.energy).toBe(40 + c.num('MEAL_ENERGY'));
    expect(run(gm, 'eat').reason).toMatch(/already ate breakfast/);
    s.calendar.minute = 10 * 60;
    expect(run(gm, 'eat').reason).toMatch(/no meal now/);
    s.calendar.minute = 12 * 60;
    expect(run(gm, 'eat')).toMatchObject({ ok: true, meal: 'lunch' });
    expect(s.wallet.gold).toBe(gold);
  });

  it('sleep: refused before SLEEP_EARLIEST_HOUR; after midnight gives fatigue', () => {
    const gm = gameInDo(), s = gm.state, c = gm.content;
    gm.ctx.sys.actions.startActivity('rest');
    expect(run(gm, 'sleep').reason).toMatch(/sleep starts at 18:00/);
    s.calendar.minute = 24 * 60 + 30;
    s.player.energy = 100;
    expect(run(gm, 'sleep').ok).toBe(true);
    expect(s.player.fatigued).toBe(true);
    expect(c.num('LATE_WAKE_DELAY_MIN')).toBe(180);
  });
});

describe('Shelf stocking, price and packing (Scene & Flow, [Proposal])', () => {
  it('serving needs a stocked shelf; a high price lowers the buy chance; packing adds value and costs gold', () => {
    const gm = gameInDo();
    const a = gm.ctx.sys.actions, eco = gm.ctx.sys.economy, s = gm.state;
    a.startActivity('open_shop');
    a.runAction('travel', { to: 'loc_home_shop' });
    s.calendar.minute = 9 * 60;
    expect(a.runAction('serve-customer').ok).toBe(false);
    expect(a.runAction('restock-shelf', { item: 'fresh_jamu', ratio: 0.5 }).ok).toBe(false);
    const st = a.runAction('restock-shelf', { item: 'fresh_jamu', qty: 2, ratio: 1.4 });
    expect(st.qty).toBe(2);
    expect(eco.buyChance(1.4)).toBeLessThan(eco.buyChance(1));
    const sold = a.runAction('serve-customer');
    expect(sold.ok).toBe(true);
    expect(eco.shelfQty('fresh_jamu')).toBe(2 - sold.sold);
    // Packing at the atelier.
    a.startActivity('craft');
    a.runAction('travel', { to: 'loc_home_atelier' });
    const gold = s.wallet.gold;
    const left = s.inventory.count('fresh_jamu', 'product');
    const pk = a.runAction('package', { item: 'fresh_jamu', container: 'bottle', label: true });
    expect(pk.qty).toBe(left);
    expect(s.wallet.gold).toBeCloseTo(gold - left * 2.5, 5);
    expect(s.inventory.find((l) => l.item === 'fresh_jamu' && l.pack === 'bottle+label').length).toBe(1);
    expect(eco.packMult('bottle+label')).toBeCloseTo(1.26, 5);
    expect(s.activityLog.some((l) => l.actionId === 'package')).toBe(true);
  });
});
