import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  DENSITIES,
  Density,
  MOTION_PREFERENCES,
  MotionPreference,
  PREFERENCES_STORAGE_KEY,
  SHEET_LAYOUTS,
  SheetLayout,
  UserPreferences,
} from '../../shared/models/preferences.model';

const DEFAULT_DENSITY: Density = 'comfortable';
const DEFAULT_MOTION: MotionPreference = 'system';
const DEFAULT_SHEET_LAYOUT: SheetLayout = 'classic';

function isDensity(value: unknown): value is Density {
  return (DENSITIES as readonly unknown[]).includes(value);
}

function isMotion(value: unknown): value is MotionPreference {
  return (MOTION_PREFERENCES as readonly unknown[]).includes(value);
}

function isSheetLayout(value: unknown): value is SheetLayout {
  return (SHEET_LAYOUTS as readonly unknown[]).includes(value);
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // The pre-paint script in index.html stamps both attributes on <html> before Angular boots
  // (falling back to comfortable/system on its own parse failure), so the DOM is the freshest
  // source of truth at startup -- storage is only consulted if the attribute is missing or bad.
  readonly density = signal<Density>(this.initialDensity());
  readonly motion = signal<MotionPreference>(this.initialMotion());
  // Unlike density/motion there is no pre-paint DOM attribute for sheet layout -- it initializes
  // from storage only.
  readonly sheetLayout = signal<SheetLayout>(this.readStorage()?.sheetLayout ?? DEFAULT_SHEET_LAYOUT);

  readonly effectiveMotion = computed<Exclude<MotionPreference, 'system'>>(() => {
    const motion = this.motion();
    if (motion !== 'system') return motion;
    if (!this.isBrowser || typeof window.matchMedia !== 'function') return 'full';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
  });

  constructor() {
    effect(() => {
      const density = this.density();
      const motion = this.motion();
      if (!this.isBrowser) return;
      document.documentElement.setAttribute('data-density', density);
      document.documentElement.setAttribute('data-motion', motion);
    });
  }

  setDensity(density: Density): void {
    this.density.set(density);
    this.persist({ density, motion: this.motion(), sheetLayout: this.sheetLayout() });
  }

  setMotion(motion: MotionPreference): void {
    this.motion.set(motion);
    this.persist({ density: this.density(), motion, sheetLayout: this.sheetLayout() });
  }

  setSheetLayout(sheetLayout: SheetLayout): void {
    this.sheetLayout.set(sheetLayout);
    this.persist({ density: this.density(), motion: this.motion(), sheetLayout });
  }

  private initialDensity(): Density {
    const fromDom = this.readDomAttr('data-density');
    if (isDensity(fromDom)) return fromDom;
    return this.readStorage()?.density ?? DEFAULT_DENSITY;
  }

  private initialMotion(): MotionPreference {
    const fromDom = this.readDomAttr('data-motion');
    if (isMotion(fromDom)) return fromDom;
    return this.readStorage()?.motion ?? DEFAULT_MOTION;
  }

  private readDomAttr(name: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return document.documentElement.getAttribute(name);
    } catch {
      return null;
    }
  }

  private readStorage(): UserPreferences | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;
      const candidate = parsed as Partial<UserPreferences>;
      return {
        density: isDensity(candidate.density) ? candidate.density : DEFAULT_DENSITY,
        motion: isMotion(candidate.motion) ? candidate.motion : DEFAULT_MOTION,
        sheetLayout: isSheetLayout(candidate.sheetLayout) ? candidate.sheetLayout : DEFAULT_SHEET_LAYOUT,
      };
    } catch {
      return null;
    }
  }

  private persist(prefs: UserPreferences): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* quota or private mode -- in-memory state still works for this session */
    }
  }
}
