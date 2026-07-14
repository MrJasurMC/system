import { applyExp, expRequiredFor } from './leveling';

describe('leveling', () => {
  it('does not level up when exp is below the threshold', () => {
    const result = applyExp({ level: 1, exp: 0, expToNextLevel: 100 }, 50);
    expect(result.leveledUp).toBe(false);
    expect(result.level).toBe(1);
    expect(result.exp).toBe(50);
  });

  it('levels up exactly once when exp meets the threshold', () => {
    const result = applyExp({ level: 1, exp: 90, expToNextLevel: 100 }, 20);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.level).toBe(2);
    expect(result.exp).toBe(10);
    expect(result.expToNextLevel).toBe(expRequiredFor(2));
  });

  it('rolls over multiple level-ups from one large XP gain', () => {
    const result = applyExp({ level: 1, exp: 0, expToNextLevel: 100 }, 1000);
    expect(result.levelsGained).toBeGreaterThan(1);
    expect(result.unallocatedPointsGained).toBe(result.levelsGained * 3);
    expect(result.exp).toBeLessThan(result.expToNextLevel);
  });

  it('grows the exp requirement with level', () => {
    expect(expRequiredFor(5)).toBeGreaterThan(expRequiredFor(1));
  });
});
