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
    const ses = this.#session();
    ses.walks += 1; ses.spots.push(spot.id);
    return state.explore.spot;
  }

  gather() {
    const { state, sys, content } = this.ctx;
    const s = state.explore.spot;
    if (!s) return { ok: false, reason: 'none' };
    for (const l of s.loot) Inventory.add(state.inv, l.item, l.variant, l.qty);
    state.explore.found.push(s);
    state.explore.spot = null;
    const d = content.get('spots', s.id);
    sys.skills.add('earth', d.xp);
    const ses = this.#session();
    ses.gathered.push({ id: s.id, loot: s.loot }); ses.xp += d.xp; ses.gatherMin += d.gatherMin; ses.gatherEnergy += d.gatherEnergy;
    return { ok: true, loot: s.loot };
  }

  skip() {
    this.#session().skipped += 1;
    this.ctx.state.explore.spot = null;
    return { ok: true };
  }

  /** The walk since the last "End exploration" (or day start). */
  #session() {
    const e = this.ctx.state.explore;
    return (e.session ??= { walks: 0, spots: [], gathered: [], skipped: 0, xp: 0, gatherMin: 0, gatherEnergy: 0, walkMin: 0 });
  }

  /** Add walk minutes to the session (the ActionRunner spends the time). */
  addWalk(min) { this.#session().walkMin += min; }

  /** End exploration: return the recap and start a new session. */
  end() {
    const { content } = this.ctx;
    const ses = this.#session();
    const items = {};
    for (const g of ses.gathered) for (const l of g.loot) { const k = `${l.item}|${l.variant}`; items[k] = (items[k] ?? 0) + l.qty; }
    const recap = {
      walks: ses.walks, found: ses.spots.length, gathered: ses.gathered.length, skipped: ses.skipped, xp: ses.xp,
      min: ses.walkMin + ses.gatherMin, energy: ses.walks * content.num('EXPLORE_WALK_ENERGY') + ses.gatherEnergy,
      items: Object.entries(items).map(([k, qty]) => { const [item, variant] = k.split('|'); return { item, variant, qty }; })
    };
    this.ctx.state.explore.session = null;
    return recap;
  }
}
