/**
 * Inventory: item stacks keyed "item|variant|tier". Static helpers over the plain `state.inv` map.
 * tier is '' for materials and food, a quality tier id for products.
 * Unity: Dictionary<string,int> wrapped in a [Serializable] class.
 */
export class Inventory {
  /** @param {string} item @param {string} variant @param {string} [tier] */
  static key(item, variant, tier = '') {
    return `${item}|${variant}|${tier}`;
  }

  /** @param {string} key @returns {{item:string, variant:string, tier:string}} */
  static parse(key) {
    const [item, variant, tier] = key.split('|');
    return { item, variant, tier };
  }

  /** @param {Record<string,number>} inv @param {string} item @param {string} variant @param {string} [tier] */
  static count(inv, item, variant, tier) {
    if (tier !== undefined) return inv[Inventory.key(item, variant, tier)] ?? 0;
    let n = 0;
    for (const [k, q] of Object.entries(inv)) {
      const p = Inventory.parse(k);
      if (p.item === item && (variant === undefined || p.variant === variant)) n += q;
    }
    return n;
  }

  /** @param {Record<string,number>} inv @param {string} item @param {string} variant @param {number} qty @param {string} [tier] */
  static add(inv, item, variant, qty, tier = '') {
    const k = Inventory.key(item, variant, tier);
    const n = (inv[k] ?? 0) + qty;
    if (n < 0) throw new Error(`Inventory below zero: ${k}`);
    if (n === 0) delete inv[k]; else inv[k] = n;
  }

  /** Take qty of an item (any tier, best tier last so good stock stays). Returns the taken stacks. @param {Record<string,number>} inv @param {string} item @param {string} variant @param {number} qty @param {string[]} [tierOrder] */
  static take(inv, item, variant, qty, tierOrder = ['']) {
    const taken = [];
    let left = qty;
    for (const tier of tierOrder) {
      const have = Inventory.count(inv, item, variant, tier);
      const n = Math.min(have, left);
      if (n > 0) { Inventory.add(inv, item, variant, -n, tier); taken.push({ tier, qty: n }); left -= n; }
      if (!left) break;
    }
    if (left) throw new Error(`Not enough ${item} ${variant}`);
    return taken;
  }

  /** @param {Record<string,number>} inv @returns {{key:string, item:string, variant:string, tier:string, qty:number}[]} */
  static list(inv) {
    return Object.entries(inv).map(([key, qty]) => ({ key, qty, ...Inventory.parse(key) }));
  }
}
