/**
 * WeekPlan: the cards the player placed in Plan. A card = activity on a day at a start minute, for a duration.
 * M2 adds budget slots and the Planner Book view. Unity: [Serializable] class.
 */
export class WeekPlan {
  constructor() {
    /** @type {{activityId:string, day:number, startMin:number, durationMin:number, used:boolean}[]} */
    this.cards = [];
    /** @type {Record<string, number>} */
    this.budget = {};
    this.locked = false;
  }

  /** @param {{activityId:string, day:number, startMin:number, durationMin:number}} card */
  place(card) {
    this.cards.push({ ...card, used: false });
  }

  clear() {
    this.cards = [];
    this.budget = {};
    this.locked = false;
  }
}
