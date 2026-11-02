/** DebtAccount: the riba loan balance and this month's payments. Unity: [Serializable] class. */
export class DebtAccount {
  /** @param {string} debtId @param {number} balance */
  constructor(debtId, balance) {
    this.debtId = debtId;
    this.balance = balance;
    this.paidThisMonth = 0;
    this.utilitiesPaidThisMonth = 0;
    this.feesTotal = 0;
    this.interestTotal = 0;
    this.bankrupt = false;
  }
}
