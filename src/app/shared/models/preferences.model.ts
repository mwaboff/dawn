export const DENSITIES = ['comfortable', 'condensed'] as const;
export type Density = (typeof DENSITIES)[number];

export const MOTION_PREFERENCES = ['system', 'reduced', 'full'] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export interface UserPreferences {
  density: Density;
  motion: MotionPreference;
}

export const PREFERENCES_STORAGE_KEY = 'oh-sheet:preferences';
