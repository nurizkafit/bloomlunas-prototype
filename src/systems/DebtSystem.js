import { MSG } from '../core/EventBus.js';

/**
 * DebtSystem: the riba loan (docs debt/riba-loan.md). Monthly compound interest and a hidden late fee.
 * Unpaid costs become new debt. A balance above DEBT_LIMIT sets bankrupt (Bad ending, M5).
 * Unity: plain C# service.
 */
export class DebtSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #loan() { return this.ctx.content.get('debt', this.ctx.state.debt.debtId); }

  /** Pay part of the debt from gold. Returns the amount paid. @param {number} amount */
  pay(amount) {
    const { state } = this.ctx;
    const paid = Math.max(0, Math.min(amount, state.wallet.gold, state.debt.balance));
    if (!paid) return 0;
    this.ctx.sys.effects.apply([{ type: 'gold', amount: -paid, label: 'Debt payment' }], 'debt');
    state.debt.balance = round2(state.debt.balance - paid);
    state.debt.paidThisMonth += paid;
    this.ctx.bus.emit(MSG.DEBT_CHANGED, { balance: state.debt.balance });
    return paid;
  }

  /** Pay the monthly utilities as far as gold allows. */
  payUtilities() {
    const { state, content } = this.ctx;
    const due = content.num('MONTHLY_UTILITIES') - state.debt.utilitiesPaidThisMonth;
    const paid = Math.max(0, Math.min(due, state.wallet.gold));
    if (!paid) return 0;
    this.ctx.sys.effects.apply([{ type: 'gold', amount: -paid, label: 'Utilities' }], 'utilities');
    state.debt.utilitiesPaidThisMonth += paid;
    return paid;
  }

  /** A cost the player could not pay goes onto the debt. @param {number} amount @param {string} label */
  addUnpaid(amount, label) {
    const { state } = this.ctx;
    if (amount <= 0) return;
    state.debt.balance = round2(state.debt.balance + amount);
    state.debt.unpaidLines = [...(state.debt.unpaidLines ?? []), { label, amount }];
    this.ctx.bus.emit(MSG.DEBT_CHANGED, { balance: state.debt.balance });
  }

  /**
   * Month end (Act). Order: interest on the balance, then the late fee if the payment is below the minimum,
   * then unpaid utilities. Then the bankrupt check.
   */
  closeMonth() {
    const { state, content } = this.ctx;
    const loan = this.#loan, d = state.debt;
    const interest = round2(d.balance * content.num(loan.rateKey));
    d.balance = round2(d.balance + interest);
    d.interestTotal += interest;
    let fees = 0;
    for (const fee of loan.hiddenFees) {
      if (fee.id === 'late' && d.paidThisMonth < content.num(loan.minPaymentKey)) fees += content.num(fee.key);
    }
    d.balance = round2(d.balance + fees);
    d.feesTotal += fees;
    const unpaidUtilities = content.num('MONTHLY_UTILITIES') - d.utilitiesPaidThisMonth;
    this.addUnpaid(unpaidUtilities, 'Utilities');
    d.bankrupt = d.balance > content.num(loan.limitKey);
    const summary = { interest, fees, unpaidUtilities, paid: d.paidThisMonth, balance: d.balance, bankrupt: d.bankrupt };
    d.paidThisMonth = 0;
    d.utilitiesPaidThisMonth = 0;
    this.ctx.bus.emit(MSG.DEBT_CHANGED, { balance: d.balance });
    return summary;
  }
}

/** @param {number} n */
function round2(n) {
  return Math.round(n * 100) / 100;
}
