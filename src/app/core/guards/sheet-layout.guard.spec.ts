import { Route, UrlSegment } from '@angular/router';
import { classicSheetGuard } from './sheet-layout.guard';
import { PREFERENCES_STORAGE_KEY } from '../../shared/models/preferences.model';

describe('classicSheetGuard', () => {
  const mockRoute = {} as Route;
  const mockSegments = [] as UrlSegment[];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('falls through to the beta route when no preference is stored', () => {
    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('matches the classic route when classic was explicitly chosen (marker true)', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'classic', sheetLayoutChosen: true }),
    );

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(true);
  });

  it('falls through to the beta route for a legacy unmarked classic', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ density: 'condensed', sheetLayout: 'classic' }),
    );

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('falls through to the beta route when beta was explicitly chosen', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'beta', sheetLayoutChosen: true }),
    );

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('falls through to the beta route when other preferences are stored without a sheetLayout', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ density: 'condensed' }));

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('falls through to the beta route for an unrecognized stored sheetLayout', () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ sheetLayout: 'psychedelic', sheetLayoutChosen: true }),
    );

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('falls through to the beta route when the stored value is malformed JSON', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{{');

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });
});
