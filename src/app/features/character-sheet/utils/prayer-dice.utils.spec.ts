import { describe, it, expect, vi } from 'vitest';
import {
  readyPrayerDiceCount,
  rollPrayerDice,
  togglePrayerDieSpent,
} from './prayer-dice.utils';

/** Returns the given faces and records how it was called, so dice counts are assertable. */
function scriptedRoll(faces: number[]) {
  return vi.fn((): readonly number[] => faces);
}

describe('rollPrayerDice', () => {
  it('should roll one d4 per point of the Spellcast trait', () => {
    const roll = scriptedRoll([1, 2, 3]);

    rollPrayerDice(3, false, roll);

    expect(roll).toHaveBeenCalledWith(4, 3);
  });

  it('should place every rolled die unspent', () => {
    const result = rollPrayerDice(2, false, scriptedRoll([4, 1]));

    expect(result.dice).toEqual([
      { value: 4, spent: false },
      { value: 1, spent: false },
    ]);
  });

  it('should roll no dice at a Spellcast trait of zero', () => {
    const roll = scriptedRoll([3]);

    const result = rollPrayerDice(0, false, roll);

    expect(result.dice).toEqual([]);
  });

  it('should not call the roller at all at a Spellcast trait of zero', () => {
    const roll = scriptedRoll([3]);

    rollPrayerDice(0, false, roll);

    expect(roll).not.toHaveBeenCalled();
  });

  it('should roll no dice at a negative Spellcast trait', () => {
    const result = rollPrayerDice(-1, false, scriptedRoll([3]));

    expect(result.dice).toEqual([]);
  });

  it('should report no dropped die when Devout is not applied', () => {
    const result = rollPrayerDice(2, false, scriptedRoll([4, 1]));

    expect(result.dropped).toBeNull();
  });

  it('should roll one extra die when Devout is applied', () => {
    const roll = scriptedRoll([1, 2, 3, 4]);

    rollPrayerDice(3, true, roll);

    expect(roll).toHaveBeenCalledWith(4, 4);
  });

  it('should keep only the Spellcast trait many dice when Devout is applied', () => {
    const result = rollPrayerDice(3, true, scriptedRoll([1, 2, 3, 4]));

    expect(result.dice).toEqual([
      { value: 2, spent: false },
      { value: 3, spent: false },
      { value: 4, spent: false },
    ]);
  });

  it('should report the face Devout discarded', () => {
    const result = rollPrayerDice(3, true, scriptedRoll([4, 1, 3, 2]));

    expect(result.dropped).toBe(1);
  });

  it('should discard exactly one die when the lowest face is tied', () => {
    const result = rollPrayerDice(3, true, scriptedRoll([1, 1, 4, 3]));

    expect(result.dice).toEqual([
      { value: 1, spent: false },
      { value: 4, spent: false },
      { value: 3, spent: false },
    ]);
  });

  it('should return every face rolled, including the one Devout dropped', () => {
    const result = rollPrayerDice(2, true, scriptedRoll([3, 1, 4]));

    expect(result.rolled).toEqual([3, 1, 4]);
  });

  it('should roll no dice at a Spellcast trait of zero even with Devout', () => {
    const roll = scriptedRoll([4]);

    const result = rollPrayerDice(0, true, roll);

    expect(result.dice).toEqual([]);
  });
});

describe('togglePrayerDieSpent', () => {
  const dice = [
    { value: 3, spent: false },
    { value: 1, spent: true },
  ];

  it('should mark an unspent die spent', () => {
    expect(togglePrayerDieSpent(dice, 0)).toEqual([
      { value: 3, spent: true },
      { value: 1, spent: true },
    ]);
  });

  it('should put a spent die back', () => {
    expect(togglePrayerDieSpent(dice, 1)).toEqual([
      { value: 3, spent: false },
      { value: 1, spent: false },
    ]);
  });

  it('should not mutate the original list', () => {
    togglePrayerDieSpent(dice, 0);

    expect(dice[0].spent).toBe(false);
  });

  it('should ignore an index past the end of the list', () => {
    expect(togglePrayerDieSpent(dice, 5)).toBe(dice);
  });

  it('should ignore a negative index', () => {
    expect(togglePrayerDieSpent(dice, -1)).toBe(dice);
  });

  it('should return an empty list unchanged', () => {
    expect(togglePrayerDieSpent([], 0)).toEqual([]);
  });
});

describe('readyPrayerDiceCount', () => {
  it('should count only unspent dice', () => {
    const count = readyPrayerDiceCount([
      { value: 3, spent: false },
      { value: 1, spent: true },
      { value: 4, spent: false },
    ]);

    expect(count).toBe(2);
  });

  it('should be zero for an empty list', () => {
    expect(readyPrayerDiceCount([])).toBe(0);
  });

  it('should be zero when every die is spent', () => {
    expect(readyPrayerDiceCount([{ value: 2, spent: true }])).toBe(0);
  });
});
