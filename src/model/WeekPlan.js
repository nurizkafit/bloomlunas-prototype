/**
 * WeekPlan: the cards the player placed in Plan, and the budget slots.
 * Card = { uid, activityId, day (0 = Mon), startMin (minutes after midnight), durationMin, locationId?, recipeId?, used }.
 * Budget slots (Planner Book): exp (weekly expenses), buy (purchases), buf (buffer). Unity: [Serializable] class.
 */
export class WeekPlan {
  constructor() {
    /** @type {{uid:number, activityId:string, day:number, startMin:number, durationMin:number, locationId?:string, recipeId?:string, used:boolean}[]} */
    this.cards = [];
    /** @type {{exp?:number, buy?:number, buf?:number}} */
    this.budget = {};
    this.locked = false;
    this.nextUid = 1;
  }

  /** @param {{activityId:string, day:number, startMin:number, durationMin:number, locationId?:string, recipeId?:string}} card */
  place(card) {
    const c = { ...card, uid: this.nextUid++, used: false };
    this.cards.push(c);
    return c;
  }

  /** Change a card (time, day, settings). @param {number} uid @param {Record<string, any>} changes */
  change(uid, changes) {
    const c = this.cards.find((x) => x.uid === uid);
    if (c) Object.assign(c, changes, { uid });
    return c;
  }

  /** @param {number} uid */
  remove(uid) {
    this.cards = this.cards.filter((x) => x.uid !== uid);
  }

  clear() {
    this.cards = [];
    this.budget = {};
    this.locked = false;
  }
}
