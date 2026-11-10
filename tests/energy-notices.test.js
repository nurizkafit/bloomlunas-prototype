import { describe, it, expect } from 'vitest';
import { MSG } from '../src/core/EventBus.js';
import { Inventory } from '../src/model/Inventory.js';
import { gameInDo } from './helpers.js';

const sleep = (gm) => { gm.state.pendingEvent = null; return gm.action('sleep'); };

describe('negative energy (user request 10 Nov 2026)', () => {
  it('lets the player act with low energy, down to ENERGY_MIN', () => {
    const gm = gameInDo();
    gm.state.cal.minute = 8 * 60;
    gm.state.energy = 2;
    const r = gm.sys.actions.run('travel', { place: 'market' });
    expect(r.ok).toBe(true);
    expect(gm.state.energy).toBe(2 - gm.content.num('TRAVEL_ENERGY'));
    gm.state.energy = gm.content.num('ENERGY_MIN') + 1;
    expect(gm.sys.actions.run('travel', { place: 'home' }).reason).toBe('tired');
  });

  it('takes negative energy times ENERGY_DEBT_MULT from the next day', () => {
    const gm = gameInDo();
    gm.state.day.meals = 1;
    gm.state.energy = -10;
    sleep(gm);
    expect(gm.state.energy).toBe(gm.content.num('ENERGY_MAX') - 10 * gm.content.num('ENERGY_DEBT_MULT'));
  });

  it('applies the penalty on top of the hungry maximum', () => {
    const gm = gameInDo();
    gm.state.day.meals = 0;
    gm.state.energy = -10;
    sleep(gm);
    expect(gm.state.energy).toBe(gm.content.num('ENERGY_HUNGRY_MAX') - 20);
  });

  it('a meal can bring energy back above zero (no penalty)', () => {
    const gm = gameInDo();
    gm.state.energy = -5;
    gm.state.cal.minute = 7 * 60;
    expect(gm.sys.actions.run('eat').ok).toBe(true);
    expect(gm.state.energy).toBe(-5 + gm.content.num('MEAL_ENERGY'));
    sleep(gm);
    expect(gm.state.energy).toBe(gm.content.num('ENERGY_MAX'));
  });
});

describe('notices (objectives, ready commissions, arrived requests)', () => {
  const listen = (gm) => { const got = []; gm.bus.on(MSG.NOTICE_ADDED, (n) => got.push(n)); return got; };

  it('sends a notice once when a commission becomes ready, and marks the Quests tab', () => {
    const gm = gameInDo();
    const got = listen(gm);
    const id = gm.content.all('quests')[0].id, q = gm.content.get('quests', id);
    gm.state.quests.active.push({ id, due: gm.sys.time.absDay() + 5 });
    Inventory.add(gm.state.inv, q.item, 'product', q.qty, Object.keys(gm.content.num('QUALITY_TIERS'))[0]);
    gm.sys.notices.scan();
    gm.sys.notices.scan();
    const ready = got.filter((n) => n.tab === 'quests');
    expect(ready.length).toBe(1);
    expect(gm.sys.notices.unread('quests')).toBe(true);
    gm.bus.emit(MSG.INTENT_READ_NOTICES, { tab: 'quests' });
    expect(gm.sys.notices.unread('quests')).toBe(false);
  });

  it('sends a notice when an objective is done', () => {
    const gm = gameInDo();
    const got = listen(gm);
    gm.state.quests.done.push({ id: 'x', day: 1 });
    gm.sys.notices.scan();
    expect(got.some((n) => n.tab === 'notes' && n.text.startsWith('Objective done'))).toBe(true);
  });

  it('sends a notice when a posted request arrives', () => {
    const gm = gameInDo();
    const got = listen(gm);
    gm.state.quests.requests = [{ item: 'turmeric', variant: 'dried', qty: 3, cost: 10, day: 1, readyDay: gm.sys.time.absDay() + 1 }];
    sleep(gm);
    expect(got.some((n) => n.text.startsWith('Your request arrived'))).toBe(true);
  });
});
