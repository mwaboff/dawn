export const DASHBOARD_PREVIEW_LIMIT = 5;

export const DASHBOARD_VARIANTS = ['ledger', 'sheet', 'war-table'] as const;
export type DashboardVariant = (typeof DASHBOARD_VARIANTS)[number];

export const DASHBOARD_VARIANT_STORAGE_KEY = 'oh-sheet.dashboard.variant';
export const DASHBOARD_VARIANT_DEFAULT: DashboardVariant = 'ledger';

function isDashboardVariant(value: string | null): value is DashboardVariant {
  return value !== null && (DASHBOARD_VARIANTS as readonly string[]).includes(value);
}

export function readStoredVariant(): DashboardVariant {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return DASHBOARD_VARIANT_DEFAULT;
  }
  try {
    const stored = window.localStorage.getItem(DASHBOARD_VARIANT_STORAGE_KEY);
    return isDashboardVariant(stored) ? stored : DASHBOARD_VARIANT_DEFAULT;
  } catch {
    return DASHBOARD_VARIANT_DEFAULT;
  }
}

export function writeStoredVariant(variant: DashboardVariant): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    window.localStorage.setItem(DASHBOARD_VARIANT_STORAGE_KEY, variant);
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — silently skip persistence
  }
}
