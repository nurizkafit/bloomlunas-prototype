import { describe, it, expect } from 'vitest';
import { QualityCalculator } from '../src/systems/QualityCalculator.js';
import { newContent } from './helpers.js';

const q = new QualityCalculator(newContent().config('QualityConfig'));

describe('QualityCalculator (docs systems/production.md)', () => {
  it('docs example: Rare main herb, Common aroma and sweetener, no carrier = 62', () => {
    expect(q.materialScore({ main: [70], aroma: [50], sweetener: [50], carrier: [] })).toBe(62);
  });

  it('empty slots are not in the average', () => {
    expect(q.materialScore({ main: [50], aroma: [], sweetener: [], carrier: [50, 50] })).toBe(50);
  });

  it('Common materials: level 1 = Amateur, level 3 = Standard', () => {
    const slots = { main: [50], aroma: [50], sweetener: [50], carrier: [] };
    expect(q.tier(q.score(slots, 1)).tier).toBe('Amateur');
    expect(q.tier(q.score(slots, 2)).tier).toBe('Amateur');
    expect(q.tier(q.score(slots, 3)).tier).toBe('Standard');
  });

  it('spoiled main herb at level 1 fails (no sale)', () => {
    const s = q.score({ main: [20], aroma: [20], sweetener: [], carrier: [] }, 1);
    expect(q.tier(s).tier).toBe('Failed');
    expect(q.priceMult('Failed')).toBe(0);
  });

  it('tier boundaries and price multipliers', () => {
    expect(q.tier(100).tier).toBe('Fine');
    expect(q.tier(149.9).tier).toBe('Fine');
    expect(q.tier(150).tier).toBe('Premium');
    expect(q.tier(200).tier).toBe('Masterwork');
    expect(q.priceMult('Masterwork')).toBe(2);
  });
});
