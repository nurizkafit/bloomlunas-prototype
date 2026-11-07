/**
 * Rng: seeded random numbers (mulberry32), so a bot run can repeat. Unity: System.Random with a seed.
 */
export class Rng {
  /** @param {number} seed */
  constructor(seed) {
    this.state = seed >>> 0;
  }

  /** @returns {number} 0 <= n < 1 */
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** @param {number} lo @param {number} hi @returns {number} integer lo..hi */
  int(lo, hi) {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  /** @param {number} lo @param {number} hi */
  range(lo, hi) {
    return lo + this.next() * (hi - lo);
  }

  /** @param {number} p */
  chance(p) {
    return this.next() < p;
  }

  /** @template T @param {T[]} list @returns {T} */
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }

  /** Pick by weight. @template T @param {T[]} list @param {(x:T)=>number} weight @returns {T} */
  weighted(list, weight) {
    const total = list.reduce((s, x) => s + weight(x), 0);
    let r = this.next() * total;
    for (const x of list) { r -= weight(x); if (r < 0) return x; }
    return list[list.length - 1];
  }
}
