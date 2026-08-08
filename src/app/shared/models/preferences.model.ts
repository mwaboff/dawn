export const DENSITIES = ['comfortable', 'condensed'] as const;
export type Density = (typeof DENSITIES)[number];

export const MOTION_PREFERENCES = ['system', 'reduced', 'full'] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export const SHEET_LAYOUTS = ['classic', 'beta'] as const;
export type SheetLayout = (typeof SHEET_LAYOUTS)[number];

export const CARD_THEMES = ['light', 'dark'] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

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
