import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadDataNode } from '../src/sim/loadDataNode.js';
import { ContentDB } from '../src/core/ContentDB.js';
import { GameManager } from '../src/core/GameManager.js';
import { EventBus, MSG } from '../src/core/EventBus.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = new ContentDB(loadDataNode(root));

describe('phase loop', () => {
  it('runs Plan > Do > Check for each week, then Act, then Plan of month 2 (no ending yet)', () => {
    const gm = new GameManager(content);
    const seen = [];
    gm.bus.on(MSG.PHASE_ENTERED, (e) => seen.push(e.phase));
    gm.start();
    const weeks = content.num('WEEKS_PER_MONTH');
    for (let i = 0; i < weeks * 3 + 1; i++) {
      if (gm.state.pendingEvent) gm.state.pendingEvent = null;
      gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    }
    const week = ['Plan', 'Do', 'Check'];
    expect(seen).toEqual([...Array(weeks).fill(week).flat(), 'Act', 'Plan']);
    expect(gm.state.calendar.month).toBe(2);
  });
});

describe('EventBus', () => {
  it('refuses unknown message names', () => {
    expect(() => new EventBus().emit('intent.typo')).toThrow();
  });
});

describe('ContentDB', () => {
  it('reads BalanceConfig values and refuses missing keys', () => {
    expect(content.num('GOLD_START')).toBe(240);
    expect(() => content.num('NOT_A_KEY')).toThrow();
  });
});
