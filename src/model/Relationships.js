/** Relationships: points per entity (guild). Level = floor(points / RELATIONSHIP_POINTS_PER_LEVEL). Unity: [Serializable] class. */
export class Relationships {
  constructor() {
    /** @type {Record<string, number>} */
    this.points = {};
  }

  /** @param {string} entityId @param {number} amount */
  add(entityId, amount) {
    this.points[entityId] = (this.points[entityId] ?? 0) + amount;
  }

  /** @param {string} entityId @param {number} pointsPerLevel */
  level(entityId, pointsPerLevel) {
    return Math.floor((this.points[entityId] ?? 0) / pointsPerLevel);
  }
}
