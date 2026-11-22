export const DENSITIES = ['comfortable', 'condensed'] as const;
export type Density = (typeof DENSITIES)[number];

export const MOTION_PREFERENCES = ['system', 'reduced', 'full'] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export const SHEET_LAYOUTS = ['classic', 'beta'] as const;
export type SheetLayout = (typeof SHEET_LAYOUTS)[number];

export const CARD_THEMES = ['default', 'light', 'dark'] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

/**
 * The two faces a card can actually render as, once a `CardTheme` preference is resolved for a
 * given surface. Unlike `CardTheme` there is no `'default'` here -- every surface ends up
 * showing one real face or the other.
 */
export const CARD_FACES = ['light', 'dark'] as const;
export type CardFace = (typeof CARD_FACES)[number];

/**
 * Resolves a raw `cardTheme` preference to the face a given surface should render.
 * `'light'`/`'dark'` are absolute and win regardless of the surface. `'default'` is the only
 * surface-dependent value: pass `darkAvailable: true` for a surface that has a dark treatment
 * (the beta character sheet, resources/reference, the app root) to get `'dark'`, or `false` for
 * a surface that doesn't yet (character creation, level-up) to get `'light'`.
 */
export function resolveCardFace(pref: CardTheme, darkAvailable: boolean): CardFace {
  if (pref === 'light' || pref === 'dark') return pref;
  return darkAvailable ? 'dark' : 'light';
}

export interface UserPreferences {
  density: Density;
  motion: MotionPreference;
  sheetLayout: SheetLayout;
  /**
   * True only once the user has picked a layout via the Preferences page. A stored `sheetLayout`
   * counts only alongside this marker: before the marker existed, every density/motion/card-theme
   * change also saved the then-default `'classic'`, so an unmarked value is indistinguishable
   * from a real choice and is ignored (see `resolveStoredSheetLayout`).
   */
  sheetLayoutChosen: boolean;
  cardTheme: CardTheme;
}

export const PREFERENCES_STORAGE_KEY = 'oh-sheet:preferences';

/**
 * The layout a user gets until they explicitly pick one, and the fallback for a missing, unmarked
 * or unrecognized stored value. Shared by `readStoredSheetLayout()` (the route guard) and
 * `PreferencesService` (every in-page consumer) so the two can never disagree about it.
 */
export const DEFAULT_SHEET_LAYOUT: SheetLayout = 'beta';

export function isSheetLayoutValue(value: unknown): value is SheetLayout {
  return (SHEET_LAYOUTS as readonly unknown[]).includes(value);
}

/** True only for a stored blob whose `sheetLayoutChosen` marker is exactly `true`. */
export function isSheetLayoutChosen(stored: unknown): boolean {
  return (
    typeof stored === 'object' &&
    stored !== null &&
    (stored as Partial<UserPreferences>).sheetLayoutChosen === true
  );
}

/**
 * The single rule for turning a parsed preferences blob into a layout: the stored `sheetLayout`
 * counts only when the `sheetLayoutChosen` marker is `true` AND the value is valid; anything else
 * (legacy unmarked values, missing marker, bad value, non-object) resolves to
 * `DEFAULT_SHEET_LAYOUT`. Used by both `readStoredSheetLayout()` and `PreferencesService`.
 */
export function resolveStoredSheetLayout(stored: unknown): SheetLayout {
  if (!isSheetLayoutChosen(stored)) return DEFAULT_SHEET_LAYOUT;
  const candidate = (stored as Partial<UserPreferences>).sheetLayout;
  return isSheetLayoutValue(candidate) ? candidate : DEFAULT_SHEET_LAYOUT;
}

/**
 * Reads the sheet layout preference directly from localStorage, bypassing DI. Used by the
 * character sheet route's `canMatch` guard, which runs before the injector is convenient to
 * reach. Total and dependency-free: never throws, always resolves to a valid SheetLayout.
 */
export function readStoredSheetLayout(): SheetLayout {
  if (typeof localStorage === 'undefined') return DEFAULT_SHEET_LAYOUT;
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_SHEET_LAYOUT;
    return resolveStoredSheetLayout(JSON.parse(raw));
  } catch {
    return DEFAULT_SHEET_LAYOUT;
  }
}
