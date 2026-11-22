import { PREFERENCES_STORAGE_KEY, SheetLayout } from '../models/preferences.model';

/**
 * Stores an explicit sheet layout choice the way the Preferences page would. `PreferencesService`
 * reads storage once, at construction, so call this before the first `TestBed.inject` or
 * `createComponent` in a spec. Specs that exercise the classic branch need it because beta is the
 * default for a user with nothing stored.
 */
export function storeSheetLayout(layout: SheetLayout): void {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ sheetLayout: layout, sheetLayoutChosen: true }));
}
