import { describe, it, expect } from 'vitest';
import { canEditItem } from './item-ownership.utils';

describe('canEditItem', () => {
  it('allows editing when the viewer authored the item', () => {
    expect(canEditItem({ createdByUserId: 5 }, 5)).toBe(true);
  });

  it('denies editing when a different user authored the item', () => {
    expect(canEditItem({ createdByUserId: 5 }, 6)).toBe(false);
  });

  it('denies editing official content (createdByUserId null)', () => {
    expect(canEditItem({ createdByUserId: null }, 5)).toBe(false);
  });

  it('denies editing when createdByUserId is absent (unexpanded entity)', () => {
    expect(canEditItem({}, 5)).toBe(false);
  });

  it('denies editing when the viewer is signed out', () => {
    expect(canEditItem({ createdByUserId: 5 }, null)).toBe(false);
  });
});
