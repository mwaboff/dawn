import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_SHEET_LAYOUT,
  PREFERENCES_STORAGE_KEY,
  readStoredSheetLayout,
  resolveCardFace,
} from './preferences.model';

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

describe('readStoredSheetLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to beta', () => {
    expect(DEFAULT_SHEET_LAYOUT).toBe('beta');
  });

  it('resolves to beta when nothing is stored', () => {
    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('keeps an explicitly stored classic layout', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: 'classic' }));

    expect(readStoredSheetLayout()).toBe('classic');
  });

  it('keeps an explicitly stored beta layout', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: 'beta' }));

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves to beta when the stored blob has no sheetLayout key', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ density: 'condensed' }));

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves to beta for an unrecognized stored value', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: 'psychedelic' }));

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves to beta when the stored value is not an object', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify('classic'));

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves to beta for malformed JSON', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{{');

    expect(readStoredSheetLayout()).toBe('beta');
  });
});
