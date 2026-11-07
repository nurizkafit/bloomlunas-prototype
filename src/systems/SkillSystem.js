/**
 * SkillSystem: Moon (craft, process), Sun (sell, trade), Earth (gather). XP through use.
 * Level comes from XP_LEVELS. Moon level picks the product tier. Sun adds customers. Earth adds loot.
 * Unity: plain C# service.
 */
export class SkillSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** @param {string} skill @param {number} xp */
  add(skill, xp) {
    if (!skill || !xp) return;
    const { state } = this.ctx;
    state.skills[skill] = (state.skills[skill] ?? 0) + xp;
    state.week.xp[skill] = (state.week.xp[skill] ?? 0) + xp;
  }

  /** @param {string} skill @returns {number} level 1.. */
  level(skill) {
    const xp = this.ctx.state.skills[skill] ?? 0;
    const lv = this.ctx.content.num('XP_LEVELS');
    let l = 1;
    for (let i = 0; i < lv.length; i++) if (xp >= lv[i]) l = i + 1;
    return l;
  }

  /** XP progress inside the level: {level, xp, from, to, ratio}. @param {string} skill */
  progress(skill) {
    const xp = this.ctx.state.skills[skill] ?? 0;
    const lv = this.ctx.content.num('XP_LEVELS');
    const level = this.level(skill);
    const from = lv[level - 1], to = lv[level] ?? from;
    return { level, xp, from, to, ratio: to > from ? (xp - from) / (to - from) : 1 };
  }

  /** Product tier id for the current Moon level. */
  tier() {
    const t = this.ctx.content.num('QUALITY_BY_MOON_LEVEL');
    return t[Math.min(this.level('moon'), t.length) - 1];
  }
}
