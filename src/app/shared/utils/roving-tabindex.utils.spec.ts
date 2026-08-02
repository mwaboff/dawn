import { describe, it, expect } from 'vitest';
import { isRovingTabKey, nextRovingTabIndex } from './roving-tabindex.utils';

describe('isRovingTabKey', () => {
  it('returns true for ArrowLeft, ArrowRight, Home, and End', () => {
    expect(isRovingTabKey('ArrowLeft')).toBe(true);
    expect(isRovingTabKey('ArrowRight')).toBe(true);
    expect(isRovingTabKey('Home')).toBe(true);
    expect(isRovingTabKey('End')).toBe(true);
  });

  it('returns false for other keys', () => {
    expect(isRovingTabKey('Enter')).toBe(false);
    expect(isRovingTabKey(' ')).toBe(false);
    expect(isRovingTabKey('Tab')).toBe(false);
    expect(isRovingTabKey('a')).toBe(false);
  });
});

describe('nextRovingTabIndex', () => {
  it('moves to the next index on ArrowRight', () => {
    expect(nextRovingTabIndex('ArrowRight', 0, 5)).toBe(1);
  });

  it('wraps from the last index to the first on ArrowRight', () => {
    expect(nextRovingTabIndex('ArrowRight', 4, 5)).toBe(0);
  });

  it('moves to the previous index on ArrowLeft', () => {
    expect(nextRovingTabIndex('ArrowLeft', 2, 5)).toBe(1);
  });

  it('wraps from the first index to the last on ArrowLeft', () => {
    expect(nextRovingTabIndex('ArrowLeft', 0, 5)).toBe(4);
  });

  it('jumps to index 0 on Home', () => {
    expect(nextRovingTabIndex('Home', 3, 5)).toBe(0);
  });

  it('jumps to the last index on End', () => {
    expect(nextRovingTabIndex('End', 0, 5)).toBe(4);
  });

  it('returns currentIndex unchanged when count is 0', () => {
    expect(nextRovingTabIndex('ArrowRight', 0, 0)).toBe(0);
  });

  it('is a no-op for a single-tab list', () => {
    expect(nextRovingTabIndex('ArrowRight', 0, 1)).toBe(0);
    expect(nextRovingTabIndex('ArrowLeft', 0, 1)).toBe(0);
  });

  describe('with disabled tabs', () => {
    // 5 tabs, indices 2 and 3 disabled.
    const isDisabled = (i: number) => i === 2 || i === 3;

    it('skips disabled tabs moving right', () => {
      expect(nextRovingTabIndex('ArrowRight', 1, 5, isDisabled)).toBe(4);
    });

    it('skips disabled tabs moving left', () => {
      expect(nextRovingTabIndex('ArrowLeft', 4, 5, isDisabled)).toBe(1);
    });

    it('wraps past disabled tabs at the boundary', () => {
      expect(nextRovingTabIndex('ArrowRight', 4, 5, isDisabled)).toBe(0);
      expect(nextRovingTabIndex('ArrowLeft', 0, 5, isDisabled)).toBe(4);
    });

    it('skips a disabled index 0 on Home', () => {
      const disabledFirstTwo = (i: number) => i === 0 || i === 1;
      expect(nextRovingTabIndex('Home', 4, 5, disabledFirstTwo)).toBe(2);
    });

    it('skips a disabled last index on End', () => {
      const disabledLastTwo = (i: number) => i === 3 || i === 4;
      expect(nextRovingTabIndex('End', 0, 5, disabledLastTwo)).toBe(2);
    });

    it('returns currentIndex when every tab is disabled', () => {
      expect(nextRovingTabIndex('ArrowRight', 1, 5, () => true)).toBe(1);
    });
  });
});
