import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DASHBOARD_PREVIEW_LIMIT,
  DASHBOARD_VARIANTS,
  DASHBOARD_VARIANT_DEFAULT,
  DASHBOARD_VARIANT_STORAGE_KEY,
  readStoredVariant,
  writeStoredVariant,
} from './dashboard.model';

describe('dashboard.model constants', () => {
  it('DASHBOARD_PREVIEW_LIMIT is 5', () => {
    expect(DASHBOARD_PREVIEW_LIMIT).toBe(5);
  });

  it('DASHBOARD_VARIANTS contains expected values', () => {
    expect(Array.from(DASHBOARD_VARIANTS)).toEqual(['ledger', 'sheet', 'war-table']);
  });

  it('DASHBOARD_VARIANT_DEFAULT is ledger', () => {
    expect(DASHBOARD_VARIANT_DEFAULT).toBe('ledger');
  });
});

describe('readStoredVariant', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default when storage is empty', () => {
    expect(readStoredVariant()).toBe('ledger');
  });

  it('returns stored value when valid: sheet', () => {
    localStorage.setItem(DASHBOARD_VARIANT_STORAGE_KEY, 'sheet');
    expect(readStoredVariant()).toBe('sheet');
  });

  it('returns stored value when valid: war-table', () => {
    localStorage.setItem(DASHBOARD_VARIANT_STORAGE_KEY, 'war-table');
    expect(readStoredVariant()).toBe('war-table');
  });

  it('returns stored value when valid: ledger', () => {
    localStorage.setItem(DASHBOARD_VARIANT_STORAGE_KEY, 'ledger');
    expect(readStoredVariant()).toBe('ledger');
  });

  it('returns default when stored value is invalid', () => {
    localStorage.setItem(DASHBOARD_VARIANT_STORAGE_KEY, 'foo');
    expect(readStoredVariant()).toBe('ledger');
  });

  it('returns default when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage error');
    });
    expect(readStoredVariant()).toBe('ledger');
  });
});

describe('writeStoredVariant', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the correct key and value', () => {
    writeStoredVariant('sheet');
    expect(localStorage.getItem(DASHBOARD_VARIANT_STORAGE_KEY)).toBe('sheet');
  });

  it('swallows errors from setItem', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeStoredVariant('war-table')).not.toThrow();
  });
});
