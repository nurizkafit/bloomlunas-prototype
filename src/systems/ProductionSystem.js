import { Inventory } from '../model/Inventory.js';

/**
 * ProductionSystem: one Crafting menu (recipe + batches), the Drying rack (fresh -> dried, takes days)
 * and the Grinding table (dried -> powder). Quality tier comes from the Moon skill. Unity: plain C# service.
 */
export class ProductionSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** How many batches the stock allows. @param {any} recipe */
  maxBatches(recipe) {
    const { state, content } = this.ctx;
    let m = content.num('CRAFT_MAX_BATCHES');
    for (const i of recipe.inputs) m = Math.min(m, Math.floor(Inventory.count(state.inv, i.item, i.variant, '') / i.qty));
    return m;
  }

  /** Cost to craft: minutes, energy, missing inputs. @param {any} recipe @param {number} batches */
  craftCost(recipe, batches) {
    const { state } = this.ctx;
    const missing = recipe.inputs.filter((i) => Inventory.count(state.inv, i.item, i.variant, '') < i.qty * batches)
      .map((i) => ({ ...i, need: i.qty * batches, have: Inventory.count(state.inv, i.item, i.variant, '') }));
    return { min: recipe.minPerBatch * batches, energy: recipe.energyPerBatch * batches, out: recipe.outputPerBatch * batches, missing };
  }

  /** @param {any} recipe @param {number} batches */
  craft(recipe, batches) {
    const { state, sys } = this.ctx;
    for (const i of recipe.inputs) Inventory.take(state.inv, i.item, i.variant, i.qty * batches);
    const tier = sys.skills.tier();
    const out = recipe.outputPerBatch * batches;
    Inventory.add(state.inv, recipe.product, 'product', out, tier);
    sys.skills.add(recipe.skill, recipe.xpPerBatch * batches);
    return { out, tier };
  }

  rackUsed() {
    return this.ctx.state.rack.reduce((s, b) => s + b.qty, 0);
  }

  rackCapacity() {
    return this.ctx.content.num('DRYING_CAPACITY') + (this.ctx.state.boosts.DRYING_CAPACITY ?? 0);
  }

  /** @param {string} item @param {number} qty */
  dryStart(item, qty) {
    const { state, content, sys } = this.ctx;
    if (Inventory.count(state.inv, item, 'fresh', '') < qty) return { ok: false, reason: 'stock' };
    if (this.rackUsed() + qty > this.rackCapacity()) return { ok: false, reason: 'rack' };
    Inventory.add(state.inv, item, 'fresh', -qty);
    state.rack.push({ item, qty, readyDay: sys.time.absDay() + content.num('DRYING_DAYS') });
    sys.skills.add('moon', 2);
    return { ok: true };
  }

  /** Move all ready batches to stock. */
  dryCollect() {
    const { state, sys } = this.ctx;
    const today = sys.time.absDay();
    const ready = state.rack.filter((b) => b.readyDay <= today);
    if (!ready.length) return { ok: false, reason: 'none' };
    for (const b of ready) Inventory.add(state.inv, b.item, 'dried', b.qty);
    state.rack = state.rack.filter((b) => b.readyDay > today);
    sys.skills.add('moon', 2);
    return { ok: true, collected: ready };
  }

  /** @param {string} item @param {number} qty */
  grind(item, qty) {
    const { state, sys } = this.ctx;
    if (Inventory.count(state.inv, item, 'dried', '') < qty) return { ok: false, reason: 'stock' };
    const it = this.ctx.content.get('items', item);
    if (!it.variants.includes('powder')) return { ok: false, reason: 'variant' };
    Inventory.add(state.inv, item, 'dried', -qty);
    Inventory.add(state.inv, item, 'powder', qty);
    sys.skills.add('moon', qty);
    return { ok: true };
  }
}
