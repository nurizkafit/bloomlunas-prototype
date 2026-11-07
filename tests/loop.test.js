import { describe, it, expect } from 'vitest';
import { GameManager } from '../src/core/GameManager.js';
import { MSG } from '../src/core/EventBus.js';
import { Bot } from '../src/sim/Bot.js';
import { newContent, gameInDo } from './helpers.js';

describe('phase loop', () => {
  it('starts in Plan, week 1, month 1', () => {
    const gm = new GameManager(newContent(), { seed: 3 });
    gm.start();
    expect(gm.state.phase).toBe('plan');
    expect(gm.state.cal).toMatchObject({ month: 1, week: 1, day: 1 });
  });

  it('a bot plays 8 weeks and reaches the retrospective (no ending)', () => {
    const gm = new GameManager(newContent(), { seed: 7 });
    gm.start();
    new Bot(gm).play();
    expect(gm.state.phase).toBe('retro');
    expect(gm.state.weeks.length).toBe(8);
    expect(gm.state.debt.months.length).toBe(2);
    const r = gm.phases.retro.summary();
    expect(r.weeks).toBe(8);
    expect(r.sold).toBeGreaterThan(0);
  });

  it('sleep works anywhere and goes home', () => {
    const gm = gameInDo();
    gm.state.place = 'outskirt';
    gm.state.cal.minute = 21 * 60 + 50;
    const r = gm.action('sleep');
    expect(r.ok).toBe(true);
    expect(gm.state.place).toBe('home');
    expect(gm.state.cal.day).toBe(2);
  });

  it('week 4 Check goes to Act, Act goes to the next month', () => {
    const gm = gameInDo();
    for (let d = 0; d < 7; d++) { gm.state.pendingEvent = null; gm.action('sleep'); }
    expect(gm.state.phase).toBe('check');
    gm.state.cal.week = 4;
    gm.finishCheck({ ids: ['rest_more'] });
    expect(gm.state.phase).toBe('act');
    expect(gm.state.notes.length).toBe(1);
    gm.finishAct();
    expect(gm.state.phase).toBe('plan');
    expect(gm.state.cal).toMatchObject({ month: 2, week: 1 });
  });
});

describe('actions', () => {
  it('travel costs time and energy and refuses closed places', () => {
    const gm = gameInDo();
    const e = gm.state.energy, m = gm.state.cal.minute;
    expect(gm.action('travel', { place: 'market' }).ok).toBe(true);
    expect(gm.state.cal.minute).toBe(m + 30);
    expect(gm.state.energy).toBeLessThan(e);
    gm.state.cal.minute = 21 * 60;
    expect(gm.action('travel', { place: 'guild' }).reason).toBe('closed');
  });

  it('a station needs the right place', () => {
    const gm = gameInDo();
    expect(gm.action('marketBuy', { item: 'rice', variant: 'grain', qty: 1 }).reason).toBe('place');
  });

  it('craft takes recipe + quantity and uses the recipe materials', () => {
    const gm = gameInDo();
    const r = gm.content.get('recipes', 'kunyit_asam');
    for (const m of r.inputs) gm.sys.effects.apply([{ type: 'item', target: m.item, variant: m.variant, amount: m.qty * 2 }], 'test');
    const out = gm.action('craft', { recipe: 'kunyit_asam', batches: 2 });
    expect(out.ok).toBe(true);
    expect(out.out).toBe(r.outputPerBatch * 2);
  });

  it('craft refuses when materials are missing', () => {
    const gm = gameInDo();
    gm.state.inv = {};
    expect(gm.action('craft', { recipe: 'turmeric_salep', batches: 1 }).reason).toBe('materials');
  });

  it('explore finds a spot, then gather or skip', () => {
    const gm = gameInDo();
    gm.action('travel', { place: 'outskirt' });
    const w = gm.action('exploreWalk');
    expect(w.ok).toBe(true);
    expect(gm.state.explore.spot).toBeTruthy();
    expect(gm.action('exploreWalk').reason).toBe('spot');
    expect(gm.action('exploreSkip').ok).toBe(true);
    expect(gm.state.explore.spot).toBeNull();
  });
});

describe('economy and debt', () => {
  it('High price sells fewer than Low price over many hours', () => {
    const run = (level) => {
      const gm = gameInDo(newContent(), 11);
      gm.sys.effects.apply([{ type: 'item', target: 'kunyit_asam', variant: 'product', amount: 200 }], 'test');
      let sold = 0;
      for (let i = 0; i < 40; i++) {
        gm.state.shelf = gm.state.shelf.map(() => null);
        gm.sys.economy.stockShelf({ slot: 0, item: 'kunyit_asam', tier: 'standard', qty: 5, level });
        sold += gm.sys.economy.serveHour().sold.length;
      }
      return sold;
    };
    expect(run('high')).toBeLessThan(run('low'));
  });

  it('a missed payment carries over with a late fee, and the game goes on', () => {
    const gm = gameInDo();
    const before = gm.state.debt.balance;
    const s = gm.sys.debt.closeMonth();
    expect(s.shortfall).toBeGreaterThan(0);
    expect(s.fee).toBe(gm.content.num('HIDDEN_FEE_LATE'));
    expect(s.unpaidUtilities).toBe(gm.content.num('MONTHLY_UTILITIES'));
    expect(gm.state.debt.balance).toBeGreaterThan(before);
  });

  it('paying the minimum avoids the late fee', () => {
    const gm = gameInDo();
    gm.state.gold = 2000;
    gm.sys.debt.pay(gm.sys.debt.minPayment());
    gm.sys.debt.payUtilities();
    const s = gm.sys.debt.closeMonth();
    expect(s.fee).toBe(0);
    expect(s.unpaidUtilities).toBe(0);
  });

  it('views and logic talk only through the bus: intents change state', () => {
    const gm = new GameManager(newContent(), { seed: 2 });
    gm.start();
    gm.bus.emit(MSG.INTENT_SET_GOAL, { index: 0, goal: 'explore' });
    expect(gm.state.plan.goals[0]).toBe('explore');
  });
});
