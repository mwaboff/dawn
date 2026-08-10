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
  cardTheme: CardTheme;
}

export const PREFERENCES_STORAGE_KEY = 'oh-sheet:preferences';

const DEFAULT_SHEET_LAYOUT: SheetLayout = 'classic';

function isSheetLayoutValue(value: unknown): value is SheetLayout {
  return (SHEET_LAYOUTS as readonly unknown[]).includes(value);
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
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SHEET_LAYOUT;
    const candidate = (parsed as Partial<UserPreferences>).sheetLayout;
    return isSheetLayoutValue(candidate) ? candidate : DEFAULT_SHEET_LAYOUT;
  } catch {
    return DEFAULT_SHEET_LAYOUT;
  }
}
