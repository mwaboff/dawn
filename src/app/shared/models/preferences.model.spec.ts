import { describe, it, expect } from 'vitest';
import { resolveCardFace } from './preferences.model';

describe('resolveCardFace', () => {
  it('resolves default + dark-capable surface to dark', () => {
    expect(resolveCardFace('default', true)).toBe('dark');
  });

  it('resolves default + light-only surface to light', () => {
    expect(resolveCardFace('default', false)).toBe('light');
  });

  it('resolves light on a dark-capable surface to light, ignoring the surface', () => {
    expect(resolveCardFace('light', true)).toBe('light');
  });

  it('resolves light on a light-only surface to light', () => {
    expect(resolveCardFace('light', false)).toBe('light');
  });

  it('resolves dark on a dark-capable surface to dark', () => {
    expect(resolveCardFace('dark', true)).toBe('dark');
  });

  it('resolves dark on a light-only surface to dark, ignoring the surface', () => {
    expect(resolveCardFace('dark', false)).toBe('dark');
  });
});
