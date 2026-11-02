import { MSG } from '../core/EventBus.js';
import { SkillBook } from '../model/SkillBook.js';

/**
 * ProductionSystem: craft recipes (Brew, Concoct), Sun drying batches, Grinding, shelf life and spoilage (SPECS §6).
 * Unity: plain C# service.
 */
export class ProductionSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Level of a sub-skill (for example cooking). @param {string} sub */
  subLevel(sub) {
    const { state, content } = this.ctx;
    const path = content.all('skills').find((s) => s.subSkills.includes(sub));
    return SkillBook.levelFor(state.skills.subXp[sub] ?? 0, path.xpToNextLevel);
  }

  /** @param {any} recipe @returns {string|null} reason it cannot be made, or null */
  missing(recipe) {
    const inv = this.ctx.state.inventory;
    for (const list of Object.values(recipe.slots)) {
      for (const s of list) {
        if (inv.count(s.item, s.variant, { includeSpoiled: true }) < s.qty) return `not enough ${s.item} (${s.variant})`;
      }
    }
    return null;
  }

  /** Expected tier with the stock the player has now, for the craft screen. @param {any} recipe */
  preview(recipe) {
    const { inventory } = this.ctx.state;
    const slotPoints = {};
    for (const [slot, list] of Object.entries(recipe.slots)) {
      slotPoints[slot] = list.map((s) => {
        const good = inventory.count(s.item, s.variant) >= s.qty;
        return this.ctx.sys.quality.points(good ? this.ctx.content.get('items', s.item).tier : 'Spoiled');
      });
    }
    return this.#rate(recipe, slotPoints);
  }

  #rate(recipe, slotPoints) {
    const product = this.ctx.content.get('items', recipe.product);
    const level = this.subLevel(product.moonSkill);
    const score = this.ctx.sys.quality.score(slotPoints, level);
    return { score, tier: this.ctx.sys.quality.tier(score).tier, level };
  }

  /** Use the materials and make the product. Call missing() first. @param {any} recipe */
  craft(recipe) {
    const { state, content, bus } = this.ctx;
    const slotPoints = {};
    for (const [slot, list] of Object.entries(recipe.slots)) {
      slotPoints[slot] = list.map((s) => {
        const taken = state.inventory.take(s.item, s.variant, s.qty, { includeSpoiled: true });
        const tier = content.get('items', s.item).tier;
        const pts = taken.reduce((n, l) => n + l.qty * this.ctx.sys.quality.points(l.spoiled ? 'Spoiled' : tier), 0);
        return pts / s.qty;
      });
    }
    const r = this.#rate(recipe, slotPoints);
    if (r.tier === 'Failed') state.stats.waste += recipe.output;
    else state.inventory.add(recipe.product, 'product', recipe.output, { tier: r.tier, born: state.calendar.absDay() });
    state.stats.made[r.tier] = (state.stats.made[r.tier] ?? 0) + recipe.output;
    bus.emit(MSG.INVENTORY_CHANGED, { item: recipe.product });
    return { ...r, product: recipe.product, qty: r.tier === 'Failed' ? 0 : recipe.output };
  }

  /** @param {string} item */
  #hasVariant(item, variant) {
    return this.ctx.content.get('items', item).variants?.some((v) => v.id === variant);
  }

  /** @param {string} item @param {number} qty @returns {string|null} */
  cannotStartBatch(item, qty) {
    const { state, content } = this.ctx;
    if (!this.#hasVariant(item, 'dried')) return `${item} cannot be dried`;
    if (state.inventory.count(item, 'fresh') < qty) return `not enough fresh ${item}`;
    const used = state.batches.reduce((n, b) => n + b.qty, 0);
    if (used + qty > content.num('SUN_DRYING_RACK_CAPACITY')) return 'drying rack is full';
    return null;
  }

  /** @param {string} item @param {number} qty */
  startBatch(item, qty) {
    const { state, content } = this.ctx;
    state.inventory.take(item, 'fresh', qty);
    state.batches.push({ item, qty, readyDay: state.calendar.absDay() + content.num('SUN_DRYING_DAYS') });
    return { item, qty };
  }

  /** Collect all ready batches as Dried stock. */
  collectBatch() {
    const { state } = this.ctx;
    const today = state.calendar.absDay();
    const ready = state.batches.filter((b) => b.readyDay <= today);
    state.batches = state.batches.filter((b) => b.readyDay > today);
    for (const b of ready) state.inventory.add(b.item, 'dried', b.qty, { born: today });
    return { collected: ready.reduce((n, b) => n + b.qty, 0) };
  }

  /** @param {string} item @param {number} qty @returns {string|null} */
  cannotGrind(item, qty) {
    if (!this.#hasVariant(item, 'powder')) return `${item} cannot be ground`;
    if (this.ctx.state.inventory.count(item, 'dried') < qty) return `not enough dried ${item}`;
    return null;
  }

  /** @param {string} item @param {number} qty */
  grind(item, qty) {
    const { state } = this.ctx;
    state.inventory.take(item, 'dried', qty);
    state.inventory.add(item, 'powder', qty, { born: state.calendar.absDay() });
    return { item, qty };
  }

  /** Shelf life: a lot older than its shelf life spoils (material) or is waste (product). */
  onDayStart() {
    const { state, content } = this.ctx;
    const today = state.calendar.absDay();
    for (const lot of state.inventory.lots) {
      const item = content.get('items', lot.item);
      const life = item.kind === 'product' ? item.shelfLifeDays : item.variants.find((v) => v.id === lot.variant)?.shelfLifeDays;
      if (life === undefined || today - lot.born <= life) continue;
      if (item.kind === 'product') { state.stats.waste += lot.qty; lot.qty = 0; }
      else lot.spoiled = true;
    }
    state.inventory.lots = state.inventory.lots.filter((l) => l.qty > 0);
  }
}
