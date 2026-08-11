import { describe, it, expect, vi } from 'vitest';
import { rollFocusRefresh } from './focus-refresh.utils';

/** Returns the given faces and records how it was called, so dice counts are assertable. */
function scriptedRoll(faces: number[]) {
  return vi.fn((): readonly number[] => faces);
}

describe('rollFocusRefresh', () => {
  it('should gain Focus equal to the highest die, not the sum', () => {
    const result = rollFocusRefresh(3, 6, scriptedRoll([2, 5, 3]));

    expect(result.focus).toBe(5);
  });

  it('should roll one d6 per point of Instinct', () => {
    const roll = scriptedRoll([1, 1, 1, 1]);

    rollFocusRefresh(4, 6, roll);

    expect(roll).toHaveBeenCalledWith(6, 4);
  });

  it('should clamp the result to focusMax', () => {
    const result = rollFocusRefresh(2, 3, scriptedRoll([6, 4]));

    expect(result.focus).toBe(3);
  });

  it('should report the unclamped highest die alongside the clamped Focus', () => {
    const result = rollFocusRefresh(2, 3, scriptedRoll([6, 4]));

    expect(result.highest).toBe(6);
  });

  it('should return every face rolled so the caller can explain the roll', () => {
    const result = rollFocusRefresh(3, 6, scriptedRoll([2, 5, 3]));

    expect(result.rolled).toEqual([2, 5, 3]);
  });

  it('should still roll one die when Instinct is zero', () => {
    const roll = scriptedRoll([4]);

    rollFocusRefresh(0, 6, roll);

    expect(roll).toHaveBeenCalledWith(6, 1);
  });

  it('should still roll one die when Instinct is negative', () => {
    const roll = scriptedRoll([4]);

    rollFocusRefresh(-2, 6, roll);

    expect(roll).toHaveBeenCalledWith(6, 1);
  });

  it('should gain no Focus when focusMax is zero', () => {
    const result = rollFocusRefresh(2, 0, scriptedRoll([6, 4]));

    expect(result.focus).toBe(0);
  });

  it('should treat a negative focusMax as zero rather than going below it', () => {
    const result = rollFocusRefresh(2, -1, scriptedRoll([6, 4]));

    expect(result.focus).toBe(0);
  });
});
