import { describe, it, expect } from 'vitest';
import { GameManager } from '../src/core/GameManager.js';
import { MSG } from '../src/core/EventBus.js';
import { newContent, files } from './helpers.js';

const KEY = /\{([A-Z_]+)%?\}/g;

describe('story and tutorial text', () => {
  it('uses only known BalanceConfig numbers in story text', () => {
    const c = newContent();
    const texts = [...c.get('story', 'premise').paragraphs, ...c.get('tutorial', 'tutorial').steps.flatMap((s) => s.lines)];
    for (const t of texts) for (const [, k] of t.matchAll(KEY)) expect(typeof c.num(k), k).toBe('number');
  });

  it('has unique tutorial steps, each with lines', () => {
    const steps = newContent().get('tutorial', 'tutorial').steps;
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const s of steps) expect(s.lines.length, s.id).toBeGreaterThan(0);
  });

  it('marks a tutorial step as seen, and can turn the guide off', () => {
    const gm = new GameManager(newContent(), { seed: 1 });
    gm.start();
    expect(gm.state.tutorialSeen).toEqual([]);
    gm.bus.emit(MSG.INTENT_TUTORIAL_SEEN, { id: 'plan' });
    gm.bus.emit(MSG.INTENT_TUTORIAL_SEEN, { id: 'plan' });
    expect(gm.state.tutorialSeen).toEqual(['plan']);
    gm.bus.emit(MSG.INTENT_TUTORIAL_SEEN, { id: 'home', all: true });
    expect(gm.state.tutorialOff).toBe(true);
  });

  it('shows no build or test words to the player', () => {
    const player = Object.entries(files).filter(([p]) => !p.includes('BalanceConfig') && !p.includes('scene/'));
    const words = (o) => (typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(words) : o && typeof o === 'object' ? Object.entries(o).filter(([k]) => !k.startsWith('_') && k !== 'source').flatMap(([, v]) => words(v)) : []);
    for (const [p, j] of player) for (const w of words(j)) expect(/\bjam\b|jam build|prototype/i.test(w), `${p}: ${w}`).toBe(false);
  });
});
