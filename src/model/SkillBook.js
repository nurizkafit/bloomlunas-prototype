/**
 * SkillBook: XP per path (sun, moon, earth) and per sub-skill (cooking, alchemy, ...).
 * Level starts at 1. xpToNextLevel comes from data/skills/<path>.json. Unity: [Serializable] class.
 */
export class SkillBook {
  constructor() {
    /** @type {Record<string, number>} */
    this.pathXp = {};
    /** @type {Record<string, number>} */
    this.subXp = {};
  }

  /** @param {string|null|undefined} path @param {string|null|undefined} sub @param {number} amount */
  addXp(path, sub, amount) {
    if (!amount) return;
    if (path) this.pathXp[path] = (this.pathXp[path] ?? 0) + amount;
    if (sub) this.subXp[sub] = (this.subXp[sub] ?? 0) + amount;
  }

  /** @param {number} xp @param {number[]} table xp to go from level i+1 to i+2 */
  static levelFor(xp, table) {
    let level = 1, need = 0;
    for (const step of table) {
      need += step;
      if (xp < need) break;
      level += 1;
    }
    return level;
  }

  /**
   * Level and progress inside the level. Max level: need is 0.
   * @param {number} xp @param {number[]} table
   * @returns {{level:number, into:number, need:number}}
   */
  static progress(xp, table) {
    let level = 1, start = 0;
    for (const step of table) {
      if (xp < start + step) return { level, into: xp - start, need: step };
      start += step; level += 1;
    }
    return { level, into: xp - start, need: 0 };
  }
}
