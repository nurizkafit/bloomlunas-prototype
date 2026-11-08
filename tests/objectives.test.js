import { describe, it, expect } from 'vitest';
import { GameManager } from '../src/core/GameManager.js';
import { Bot } from '../src/sim/Bot.js';
import { newContent } from './helpers.js';

describe('objectives', () => {
  it('lists every objective and ticks them through a bot game', () => {
    const gm = new GameManager(newContent(), { seed: 7 });
    gm.start();
    const list = gm.sys.objectives.status();
    expect(list.length).toBe(gm.content.get('objectives', 'objectives').list.length);
    expect(list.find((o) => o.id === 'craft').done).toBe(false);
    new Bot(gm).play();
    const done = gm.sys.objectives.status().filter((o) => o.done).map((o) => o.id);
    expect(done).toEqual(expect.arrayContaining(['goals', 'products', 'buy', 'craft', 'store']));
  });

  it('has help text for each key the views use', () => {
    const help = newContent().get('help', 'help').items;
    for (const k of ['day', 'calendar', 'gold', 'debt', 'energy', 'goalDeck', 'products', 'materials', 'jarStore', 'jarPersonal', 'jarBuffer', 'skillMoon', 'skillSun', 'skillEarth', 'objectives']) {
      expect(help[k]?.text, k).toBeTruthy();
    }
  });
});
