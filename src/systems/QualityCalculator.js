/**
 * QualityCalculator (docs systems/production.md, SPECS §6).
 * Score = weighted average of slot material points x skill multiplier. The score picks the tier.
 * Empty slots ("-") are not in the average. More than one material in a slot: their mean.
 * Unity: plain C# class that reads a QualityConfig ScriptableObject.
 */
export class QualityCalculator {
  /** @param {any} config data/QualityConfig.json */
  constructor(config) {
    this.config = config;
  }

  /** @param {string} materialTier Common, Rare, Epic, Legendary or Spoiled */
  points(materialTier) {
    const p = this.config.materialPoints[materialTier];
    if (p === undefined) throw new Error(`QualityConfig: no points for ${materialTier}`);
    return p;
  }

  /** @param {number} level 1..10 */
  skillMultiplier(level) {
    const t = this.config.skillMultiplierByLevel;
    return t[Math.max(1, Math.min(level, t.length)) - 1];
  }

  /** @param {Record<string, number[]>} slotPoints slot -> points of each material in it (empty list = "-") */
  materialScore(slotPoints) {
    let sum = 0, weight = 0;
    for (const [slot, list] of Object.entries(slotPoints)) {
      if (!list?.length) continue;
      const w = this.config.slotWeights[slot] ?? this.config.slotWeights.default;
      sum += w * (list.reduce((a, b) => a + b, 0) / list.length);
      weight += w;
    }
    return weight ? sum / weight : 0;
  }

  /** @param {Record<string, number[]>} slotPoints @param {number} level */
  score(slotPoints, level) {
    return this.materialScore(slotPoints) * this.skillMultiplier(level);
  }

  /** @param {number} score @returns {{tier:string, from:number, priceMult:number}} */
  tier(score) {
    const tiers = [...this.config.tiers].sort((a, b) => b.from - a.from);
    return tiers.find((t) => score >= t.from) ?? tiers.at(-1);
  }

  /** @param {string} tierId */
  priceMult(tierId) {
    return this.config.tiers.find((t) => t.tier === tierId)?.priceMult ?? 1;
  }
}
