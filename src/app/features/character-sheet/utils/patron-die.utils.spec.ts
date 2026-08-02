import { describe, it, expect } from 'vitest';
import { patronDieForLevel } from './patron-die.utils';

describe('patronDieForLevel', () => {
  it('should return D6 at level 1', () => {
    expect(patronDieForLevel(1)).toBe('D6');
  });

  it('should return D6 at level 4', () => {
    expect(patronDieForLevel(4)).toBe('D6');
  });

  it('should return D8 at level 5', () => {
    expect(patronDieForLevel(5)).toBe('D8');
  });

  it('should return D8 above level 5', () => {
    expect(patronDieForLevel(10)).toBe('D8');
  });
});
