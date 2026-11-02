import { describe, it, expect } from 'vitest';
import { gameInDo } from './helpers.js';

describe('EffectApplier', () => {
  it('applies every effect type', () => {
    const gm = gameInDo();
    const s = gm.state, fx = gm.ctx.sys.effects;
    const gold = s.wallet.gold, debt = s.debt.balance, min = s.calendar.minute;
    fx.apply([
      { type: 'gold', amount: 10, label: 'test' },
      { type: 'item', target: 'rice', variant: 'grain', amount: 3 },
      { type: 'xp', target: 'moon.cooking', amount: 4 },
      { type: 'relation', target: 'merchant_guild', amount: 2 },
      { type: 'energy', amount: -30 },
      { type: 'debt', amount: 50 },
      { type: 'time', amount: 45 }
    ]);
    expect(s.wallet.gold).toBe(gold + 10);
    expect(s.ledger.lines.at(-1)).toMatchObject({ label: 'test', amount: 10 });
    expect(s.inventory.count('rice', 'grain')).toBe(3);
    expect(s.skills.subXp.cooking).toBe(4);
    expect(s.skills.pathXp.moon).toBe(4);
    expect(s.relations.points.merchant_guild).toBe(2);
    expect(s.player.energy).toBe(70);
    expect(s.debt.balance).toBe(debt + 50);
    expect(s.calendar.minute).toBe(min + 45);
  });

  it('energy stays inside 0..ENERGY_MAX', () => {
    const gm = gameInDo();
    gm.ctx.sys.effects.apply([{ type: 'energy', amount: 500 }]);
    expect(gm.state.player.energy).toBe(gm.content.num('ENERGY_MAX'));
    gm.ctx.sys.effects.apply([{ type: 'energy', amount: -500 }]);
    expect(gm.state.player.energy).toBe(0);
  });

  it('refuses an unknown effect type', () => {
    expect(() => gameInDo().ctx.sys.effects.apply([{ type: 'magic', amount: 1 }])).toThrow();
  });
});
