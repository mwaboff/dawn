import { describe, it, expect } from 'vitest';
import { tierForLevel } from './tier.utils';

describe('tierForLevel', () => {
  it('should return tier 1 for level 1', () => {
    expect(tierForLevel(1)).toBe(1);
  });

  it('should return tier 2 for level 2', () => {
    expect(tierForLevel(2)).toBe(2);
  });

  it('should return tier 2 for level 4', () => {
    expect(tierForLevel(4)).toBe(2);
  });

  it('should return tier 3 for level 5', () => {
    expect(tierForLevel(5)).toBe(3);
  });

  it('should return tier 3 for level 7', () => {
    expect(tierForLevel(7)).toBe(3);
  });

  it('should return tier 4 for level 8', () => {
    expect(tierForLevel(8)).toBe(4);
  });

  it('should return tier 4 for level 10', () => {
    expect(tierForLevel(10)).toBe(4);
  });

  it('should clamp levels below 1 to tier 1', () => {
    expect(tierForLevel(0)).toBe(1);
  });
});
