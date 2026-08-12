import { describe, it, expect } from 'vitest';
import { clearMarked, gainCapped } from './rest-track.utils';

describe('clearMarked', () => {
  it('clears the amount asked for when that much is marked', () => {
    expect(clearMarked(4, 3)).toEqual({ next: 1, cleared: 3 });
  });

  it('never clears more than is marked', () => {
    expect(clearMarked(2, 9)).toEqual({ next: 0, cleared: 2 });
  });

  it('clears nothing from an empty track', () => {
    expect(clearMarked(0, 5)).toEqual({ next: 0, cleared: 0 });
  });

  /** `Infinity` is how "clear all" is expressed without a second function. */
  it('clears the whole track for Infinity', () => {
    expect(clearMarked(7, Infinity)).toEqual({ next: 0, cleared: 7 });
  });

  it('clears nothing for a negative amount rather than adding Stress back', () => {
    expect(clearMarked(3, -2)).toEqual({ next: 3, cleared: 0 });
  });

  it('rounds a fractional amount down', () => {
    expect(clearMarked(5, 2.9)).toEqual({ next: 3, cleared: 2 });
  });

  /**
   * The backend does not enforce `marked <= max`, so an over-marked track has to stay sane: this is
   * what makes a companion marked past its Stress max recoverable one clear at a time.
   */
  it('handles a track marked past its maximum', () => {
    expect(clearMarked(5, 1)).toEqual({ next: 4, cleared: 1 });
  });
});

describe('gainCapped', () => {
  it('gains the amount asked for when there is room', () => {
    expect(gainCapped(1, 2, 6)).toEqual({ next: 3, gained: 2 });
  });

  it('stops at the cap', () => {
    expect(gainCapped(5, 3, 6)).toEqual({ next: 6, gained: 1 });
  });

  it('gains nothing at the cap', () => {
    expect(gainCapped(6, 1, 6)).toEqual({ next: 6, gained: 0 });
  });

  /** A value already over its cap is left alone rather than clamped down by a gain. */
  it('leaves an over-cap value untouched', () => {
    expect(gainCapped(8, 1, 6)).toEqual({ next: 8, gained: 0 });
  });

  it('gains nothing for a negative amount', () => {
    expect(gainCapped(2, -3, 6)).toEqual({ next: 2, gained: 0 });
  });

  it('handles a cap of zero', () => {
    expect(gainCapped(0, 2, 0)).toEqual({ next: 0, gained: 0 });
  });
});
