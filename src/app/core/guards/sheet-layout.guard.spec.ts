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

  it('matches the classic route when classic is explicitly stored', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: 'classic' }));

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(true);
  });

  it('falls through to the beta route when beta is stored', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: 'beta' }));

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('falls through to the beta route when other preferences are stored without a sheetLayout', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ density: 'condensed' }));

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('falls through to the beta route for an unrecognized stored sheetLayout', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: 'psychedelic' }));

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });

  it('falls through to the beta route when the stored value is malformed JSON', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{{');

    const result = classicSheetGuard(mockRoute, mockSegments);

    expect(result).toBe(false);
  });
});
