import { Inventory } from '../model/Inventory.js';

/**
 * ExploreSystem: auto-explore one area (City Outskirt). Each walk finds one spot.
 * The player picks Gather or Skip. Earth level adds loot. Unity: plain C# service.
 */
export class ExploreSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  spotsLeft() {
    return this.ctx.content.num('EXPLORE_SPOTS_PER_DAY') - this.ctx.state.explore.spotsToday;
  }

  /** Walk on until a spot is found. Returns the walk minutes (time is spent by the ActionRunner). */
  walkMinutes() {
    const [lo, hi] = this.ctx.content.num('EXPLORE_WALK_MIN');
    return this.ctx.rng.int(lo / 15, hi / 15) * 15;
  }

  /** Roll the spot and its loot. */
  findSpot() {
    const { state, content, rng, sys } = this.ctx;
    const spot = rng.weighted(content.all('spots'), (s) => s.weight);
    const bonus = (sys.skills.level('earth') - 1) * content.num('EARTH_LOOT_BONUS');
    const loot = spot.loot.map((l) => ({ item: l.item, variant: l.variant, qty: rng.int(l.min, l.max) + (rng.chance(bonus) ? 1 : 0) }));
    state.explore.spot = { id: spot.id, loot };
    state.explore.spotsToday += 1;
    return state.explore.spot;
  }

  gather() {
    const { state, sys, content } = this.ctx;
    const s = state.explore.spot;
    if (!s) return { ok: false, reason: 'none' };
    for (const l of s.loot) Inventory.add(state.inv, l.item, l.variant, l.qty);
    state.explore.found.push(s);
    state.explore.spot = null;
    sys.skills.add('earth', content.get('spots', s.id).xp);
    return { ok: true, loot: s.loot };
  }

  skip() {
    this.ctx.state.explore.spot = null;
    return { ok: true };
  }
}
