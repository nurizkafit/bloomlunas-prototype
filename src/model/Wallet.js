/** Wallet: the gold of the player. Gold can go below 0 only through the debt rules, not here. Unity: [Serializable] class. */
export class Wallet {
  /** @param {number} gold */
  constructor(gold) {
    this.gold = gold;
  }

  /** @param {number} amount */
  canPay(amount) {
    return this.gold >= amount;
  }

  /** @param {number} amount positive = in, negative = out */
  add(amount) {
    this.gold = Math.round((this.gold + amount) * 100) / 100;
  }
}
