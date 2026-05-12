import { describe, it, expect } from 'vitest';
import { classBorderColor } from './class-color.utils';

const DEFAULT_COLOR = 'rgba(212, 160, 86, 0.4)';

describe('classBorderColor', () => {
  it('maps Bard (title case) to expected color', () => {
    expect(classBorderColor('Bard')).toBe('#d4a056');
  });

  it('maps GUARDIAN (uppercase) to expected color', () => {
    expect(classBorderColor('GUARDIAN')).toBe('#5e8ed4');
  });

  it('maps " wizard " (with whitespace) to expected color', () => {
    expect(classBorderColor(' wizard ')).toBe('#7fd4c2');
  });

  it('returns default for unknown class', () => {
    expect(classBorderColor('paladin')).toBe(DEFAULT_COLOR);
  });

  it('returns default for null', () => {
    expect(classBorderColor(null)).toBe(DEFAULT_COLOR);
  });

  it('returns default for undefined', () => {
    expect(classBorderColor(undefined)).toBe(DEFAULT_COLOR);
  });

  it('returns default for empty string', () => {
    expect(classBorderColor('')).toBe(DEFAULT_COLOR);
  });
});
