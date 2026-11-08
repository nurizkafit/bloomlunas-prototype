import { describe, it, expect } from 'vitest';
import { gameInDo } from './helpers.js';

/** Plays one week of sleeps and returns the random events (id per day, null when none). */
function playWeek(gm) {
  const out = [];
  const fired = () => gm.state.pendingEvent;
  for (let d = 1; d <= 7; d++) {
    const id = fired();
    const ev = id ? gm.content.get('events', id) : null;
    out.push(ev && ev.type === 'random' ? ev.id : null);
    gm.state.pendingEvent = null;
    if (d < 7) gm.action('sleep');
  }
  return out;
}

describe('random events (user feedback 8 Nov 2026)', () => {
  it('come on 1 or 2 days a week, never two days in a row, never the same event twice in a row', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const gm = gameInDo(undefined, seed);
      // gameInDo clears day 1's card; roll day 1 again from a clean plan so the week is complete.
      gm.state.week.eventDays = null;
      gm.state.firedEvents = [];
      gm.sys.events.roll();
      const days = gm.state.week.eventDays;
      expect(days.length).toBeGreaterThanOrEqual(1);
      expect(days.length).toBeLessThanOrEqual(2);
      if (days.length === 2) expect(days[1] - days[0]).toBeGreaterThan(1);
      const week = playWeek(gm);
      const evDays = week.map((e, i) => (e ? i + 1 : 0)).filter(Boolean);
      expect(evDays).toEqual(days);
      const ids = week.filter(Boolean);
      for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
    }
  });
});
