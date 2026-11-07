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

  /** The picked lot of a recipe slot entry, or null (auto: good lots first, oldest first). @param {Record<string,string>} lots @param {string} key */
  static pick(lots, key) {
    const v = lots?.[key];
    if (!v) return null;
    const [born, sp] = String(v).split('|');
    return { born: Number(born), spoiled: sp === '1' };
  }

  /**
   * Lots the player can pick for one slot entry (Crafting: pick materials).
   * @param {{item:string, variant:string}} entry @returns {{born:number, spoiled:boolean, qty:number, key:string}[]}
   */
  lotsFor(entry) {
    return this.ctx.state.inventory.find((l) => l.item === entry.item && l.variant === entry.variant)
      .sort((a, b) => Number(a.spoiled) - Number(b.spoiled) || a.born - b.born)
      .map((l) => ({ born: l.born, spoiled: l.spoiled, qty: l.qty, key: `${l.born}|${l.spoiled ? 1 : 0}` }));
  }

  /** @param {any} recipe @param {{batches?:number, lots?:Record<string,string>}} [o] @returns {string|null} reason it cannot be made, or null */
  missing(recipe, o = {}) {
    const inv = this.ctx.state.inventory, b = o.batches ?? 1;
    for (const [slot, list] of Object.entries(recipe.slots)) {
      for (const [i, s] of list.entries()) {
        const pk = ProductionSystem.pick(o.lots, `${slot}:${i}`);
        const have = pk ? inv.find((l) => l.item === s.item && l.variant === s.variant && l.born === pk.born && l.spoiled === pk.spoiled).reduce((n, l) => n + l.qty, 0)
          : inv.count(s.item, s.variant, { includeSpoiled: true });
        if (have < s.qty * b) return `not enough ${s.item} (${s.variant})${pk ? ' in the picked lot' : ''}`;
      }
    }
    return null;
  }

  /** Expected tier with the stock and the picked lots, for the craft screen. @param {any} recipe @param {{batches?:number, lots?:Record<string,string>}} [o] */
  preview(recipe, o = {}) {
    const { inventory } = this.ctx.state, b = o.batches ?? 1;
    const slotPoints = {};
    for (const [slot, list] of Object.entries(recipe.slots)) {
      slotPoints[slot] = list.map((s, i) => {
        const pk = ProductionSystem.pick(o.lots, `${slot}:${i}`);
        const good = pk ? !pk.spoiled : inventory.count(s.item, s.variant) >= s.qty * b;
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

  /**
   * Use the materials and make the product. Call missing() first.
   * @param {any} recipe @param {{batches?:number, lots?:Record<string,string>, pack?:string|null}} [o] batches x materials and output; pack = packed output
   */
  craft(recipe, o = {}) {
    const { state, content, bus } = this.ctx, b = o.batches ?? 1;
    const slotPoints = {};
    for (const [slot, list] of Object.entries(recipe.slots)) {
      slotPoints[slot] = list.map((s, i) => {
        const pk = ProductionSystem.pick(o.lots, `${slot}:${i}`);
        const need = s.qty * b;
        const taken = state.inventory.take(s.item, s.variant, need, pk ? { includeSpoiled: true, born: pk.born, spoiled: pk.spoiled } : { includeSpoiled: true });
        const tier = content.get('items', s.item).tier;
        const pts = taken.reduce((n, l) => n + l.qty * this.ctx.sys.quality.points(l.spoiled ? 'Spoiled' : tier), 0);
        return pts / need;
      });
    }
    const r = this.#rate(recipe, slotPoints);
    const out = recipe.output * b;
    if (r.tier === 'Failed') state.stats.waste += out;
    else state.inventory.add(recipe.product, 'product', out, { tier: r.tier, born: state.calendar.absDay(), pack: o.pack ?? null });
    state.stats.made[r.tier] = (state.stats.made[r.tier] ?? 0) + out;
    bus.emit(MSG.INVENTORY_CHANGED, { item: recipe.product });
    return { ...r, product: recipe.product, qty: r.tier === 'Failed' ? 0 : out };
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
