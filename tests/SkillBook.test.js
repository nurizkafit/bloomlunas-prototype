import { describe, it, expect } from 'vitest';
import { SkillBook } from '../src/model/SkillBook.js';

describe('SkillBook.progress', () => {
  const t = [20, 30];
  it('gives level and progress in the level', () => {
    expect(SkillBook.progress(0, t)).toEqual({ level: 1, into: 0, need: 20 });
    expect(SkillBook.progress(25, t)).toEqual({ level: 2, into: 5, need: 30 });
  });
  it('gives need 0 at max level', () => {
    expect(SkillBook.progress(60, t)).toEqual({ level: 3, into: 10, need: 0 });
  });
  it('matches levelFor', () => {
    for (const xp of [0, 19, 20, 49, 50, 99]) expect(SkillBook.progress(xp, t).level).toBe(SkillBook.levelFor(xp, t));
  });
});
