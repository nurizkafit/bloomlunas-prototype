import { round2 } from './EffectApplier.js';

/**
 * DebtSystem: the riba loan (docs debt/riba-loan). At month end: interest on the balance,
 * a hidden late fee when the payment is below the minimum, unpaid bills go onto the debt.
 * A missed payment does not end the game: the gap carries over (user decision 7 Nov 2026).
 * Unity: plain C# service.
 */
export class DebtSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #loan() { return this.ctx.content.get('debt', 'riba_loan'); }

  minPayment() {
    return this.ctx.content.num(this.#loan.minPaymentKey);
  }

  /** Minimum still due this month. */
  dueLeft() {
    return Math.max(0, this.minPayment() - this.ctx.state.debt.paidThisMonth);
  }

  /** @param {number} amount */
  pay(amount) {
    const { state, sys } = this.ctx;
    const paid = Math.max(0, Math.min(amount, state.gold, state.debt.balance));
    if (!paid) return 0;
    sys.ledger.add(-paid, 'Debt payment', 'bills');
    state.debt.balance = round2(state.debt.balance - paid);
    state.debt.paidThisMonth += paid;
    return paid;
  }

  payUtilities() {
    const { state, content, sys } = this.ctx;
    const due = content.num('MONTHLY_UTILITIES');
    if (state.debt.utilitiesPaid || state.gold < due) return 0;
    sys.ledger.add(-due, 'Utilities', 'bills');
    state.debt.utilitiesPaid = true;
    return due;
  }

  /** A bill the player could not pay goes onto the debt. @param {number} amount @param {string} label */
  addUnpaid(amount, label) {
    if (amount <= 0) return;
    const d = this.ctx.state.debt;
    d.balance = round2(d.balance + amount);
    d.carriedTotal = round2(d.carriedTotal + amount);
    d.unpaid = [...(d.unpaid ?? []), { label, amount }];
  }

  /** Month end, in this order: unpaid utilities, interest, late fee. Returns the summary. */
  closeMonth() {
    const { state, content } = this.ctx;
    const d = state.debt, loan = this.#loan;
    const start = d.months.at(-1)?.balanceAfter ?? content.num(loan.principalKey);
    const unpaidUtilities = d.utilitiesPaid ? 0 : content.num('MONTHLY_UTILITIES');
    this.addUnpaid(unpaidUtilities, 'Utilities');
    const shortfall = Math.max(0, this.minPayment() - d.paidThisMonth);
    const interest = round2(d.balance * content.num(loan.rateKey));
    const fee = shortfall > 0 ? content.num(loan.lateFeeKey) : 0;
    d.balance = round2(d.balance + interest + fee);
    d.interestTotal = round2(d.interestTotal + interest);
    d.feesTotal = round2(d.feesTotal + fee);
    const summary = { month: state.cal.month, balanceBefore: start, paid: d.paidThisMonth, shortfall, interest, fee, unpaidUtilities, balanceAfter: d.balance };
    d.months.push(summary);
    d.paidThisMonth = 0;
    d.utilitiesPaid = false;
    d.unpaid = [];
    return summary;
  }
}
