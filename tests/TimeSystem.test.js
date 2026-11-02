import { describe, it, expect } from 'vitest';
import { gameInDo, newContent } from './helpers.js';

describe('TimeSystem', () => {
  it('fatigue makes actions slower', () => {
    const gm = gameInDo();
    const t = gm.ctx.sys.time;
    expect(t.effectiveMinutes(60)).toBe(60);
    gm.state.player.fatigued = true;
    expect(t.effectiveMinutes(60)).toBe(60 * (1 + gm.content.num('FATIGUE_EFFICIENCY_PENALTY')));
  });

  it('work after DAY_END_HOUR sets workedLate; NIGHT_END_HOUR is the limit', () => {
    const gm = gameInDo();
    const c = gm.state.calendar, t = gm.ctx.sys.time;
    c.minute = gm.content.num('DAY_END_HOUR') * 60;
    t.advance(30);
    expect(gm.state.player.workedLate).toBe(true);
    c.minute = gm.content.num('NIGHT_END_HOUR') * 60 - 30;
    expect(t.fits(30)).toBe(true);
    expect(t.fits(31)).toBe(false);
  });

  it('sleep: low energy gives fatigue, energy comes back, the next day starts', () => {
    const gm = gameInDo();
    const p = gm.state.player;
    p.energy = gm.content.num('FATIGUE_THRESHOLD') - 1;
    gm.ctx.sys.time.sleep();
    expect(p.fatigued).toBe(true);
    expect(p.energy).toBe(gm.content.num('ENERGY_MAX'));
    expect(gm.state.calendar.day).toBe(1);
  });

  it('a fatigued player wakes late when the roll says so', () => {
    const content = newContent();
    content.balance.LATE_WAKE_CHANCE = { value: 1 };
    const gm = gameInDo(content);
    gm.state.player.fatigued = true;
    gm.ctx.sys.time.startDay(1);
    expect(gm.state.calendar.minute).toBe(content.num('DAY_START_HOUR') * 60 + content.num('LATE_WAKE_DELAY_MIN'));
  });

  it('sleep on the last day ends the week', () => {
    const gm = gameInDo();
    gm.state.calendar.day = gm.content.num('DAYS_PER_WEEK') - 1;
    gm.ctx.sys.time.sleep();
    expect(gm.state.player.weekOver).toBe(true);
  });

  it('fresh stock spoils after its shelf life; old products become waste', () => {
    const gm = gameInDo();
    const s = gm.state;
    s.inventory.add('kencur', 'fresh', 2, { born: 0 });
    s.calendar.day = 4;
    gm.ctx.sys.production.onDayStart();
    expect(s.inventory.count('kencur', 'fresh')).toBe(0);
    expect(s.inventory.count('kencur', 'fresh', { includeSpoiled: true })).toBe(2);
    expect(s.inventory.count('fresh_jamu')).toBe(0);
    expect(s.stats.waste).toBeGreaterThan(0);
  });
});
