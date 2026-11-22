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

  it('keeps a classic layout the user explicitly chose (marker true)', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'classic', sheetLayoutChosen: true }),
    );

    expect(readStoredSheetLayout()).toBe('classic');
  });

  it('keeps a beta layout the user explicitly chose (marker true)', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'beta', sheetLayoutChosen: true }),
    );

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves a legacy unmarked classic to beta', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: 'classic' }));

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves classic with marker false to beta', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'classic', sheetLayoutChosen: false }),
    );

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('only honours a marker that is exactly true', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'classic', sheetLayoutChosen: 'true' }),
    );

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves to beta when the marker is present but the value is invalid', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'psychedelic', sheetLayoutChosen: true }),
    );

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves to beta when the stored blob has no sheetLayout key', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ density: 'condensed' }));

    expect(readStoredSheetLayout()).toBe('beta');
  });

  it('resolves to beta for an unrecognized stored value without a marker', () => {
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
