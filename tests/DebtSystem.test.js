import { describe, it, expect } from 'vitest';
import { gameInDo } from './helpers.js';

describe('DebtSystem (riba loan)', () => {
  it('payment at or above the minimum: only compound interest', () => {
    const gm = gameInDo();
    const c = gm.content, d = gm.ctx.sys.debt;
    gm.state.wallet.gold = 1000;
    d.payUtilities();
    d.pay(c.num('DEBT_MIN_PAYMENT'));
    const after = c.num('DEBT_START') - c.num('DEBT_MIN_PAYMENT');
    const r = d.closeMonth();
    expect(r.fees).toBe(0);
    expect(r.balance).toBeCloseTo(after * (1 + c.num('DEBT_INTEREST_RATE')), 2);
  });

  it('payment below the minimum: hidden late fee; unpaid utilities become debt', () => {
    const gm = gameInDo();
    const c = gm.content, d = gm.ctx.sys.debt;
    gm.state.wallet.gold = 0;
    const r = d.closeMonth();
    const expected = c.num('DEBT_START') * (1 + c.num('DEBT_INTEREST_RATE')) + c.num('HIDDEN_FEE_LATE') + c.num('MONTHLY_UTILITIES');
    expect(r.fees).toBe(c.num('HIDDEN_FEE_LATE'));
    expect(r.unpaidUtilities).toBe(c.num('MONTHLY_UTILITIES'));
    expect(r.balance).toBeCloseTo(expected, 2);
  });

  it('interest compounds month after month', () => {
    const gm = gameInDo();
    const c = gm.content, d = gm.ctx.sys.debt;
    gm.state.wallet.gold = 0;
    d.closeMonth();
    const b1 = gm.state.debt.balance;
    d.closeMonth();
    expect(gm.state.debt.balance).toBeCloseTo(b1 * (1 + c.num('DEBT_INTEREST_RATE')) + c.num('HIDDEN_FEE_LATE') + c.num('MONTHLY_UTILITIES'), 2);
  });

  it('a balance above DEBT_LIMIT sets bankrupt', () => {
    const gm = gameInDo();
    gm.state.debt.balance = gm.content.num('DEBT_LIMIT');
    expect(gm.ctx.sys.debt.closeMonth().bankrupt).toBe(true);
  });

  it('cannot pay more than gold or balance', () => {
    const gm = gameInDo();
    gm.state.wallet.gold = 50;
    expect(gm.ctx.sys.debt.pay(500)).toBe(50);
    expect(gm.state.wallet.gold).toBe(0);
  });
});
