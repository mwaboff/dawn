import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PreferencesService } from './preferences.service';
import { PREFERENCES_STORAGE_KEY } from '../../shared/models/preferences.model';

function clearDomAttrs(): void {
  document.documentElement.removeAttribute('data-density');
  document.documentElement.removeAttribute('data-motion');
  document.documentElement.removeAttribute('data-card-theme');
}

describe('PreferencesService', () => {
  let service: PreferencesService;

  beforeEach(() => {
    localStorage.clear();
    clearDomAttrs();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreferencesService);
  });

  afterEach(() => {
    localStorage.clear();
    clearDomAttrs();
  });

  describe('defaults', () => {
    it('defaults density to comfortable when nothing is stored or stamped', () => {
      expect(service.density()).toBe('comfortable');
    });

    it('defaults motion to system when nothing is stored or stamped', () => {
      expect(service.motion()).toBe('system');
    });

    it('defaults cardTheme to dark when nothing is stored or stamped', () => {
      expect(service.cardTheme()).toBe('dark');
    });
  });

  describe('setDensity / setMotion', () => {
    it('setDensity updates the density signal', () => {
      service.setDensity('condensed');

      expect(service.density()).toBe('condensed');
    });

    it('setMotion updates the motion signal', () => {
      service.setMotion('reduced');

      expect(service.motion()).toBe('reduced');
    });

    it('setDensity persists all preferences to localStorage', () => {
      service.setMotion('full');
      service.setDensity('condensed');

      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY)!);
      expect(stored).toEqual({
        density: 'condensed',
        motion: 'full',
        sheetLayout: 'classic',
        cardTheme: 'dark',
      });
    });

    it('setMotion persists all preferences to localStorage', () => {
      service.setDensity('condensed');
      service.setMotion('reduced');

      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY)!);
      expect(stored).toEqual({
        density: 'condensed',
        motion: 'reduced',
        sheetLayout: 'classic',
        cardTheme: 'dark',
      });
    });
  });

  describe('setSheetLayout', () => {
    it('updates the sheetLayout signal', () => {
      service.setSheetLayout('beta');

      expect(service.sheetLayout()).toBe('beta');
    });

    it('persists all preferences to localStorage', () => {
      service.setDensity('condensed');
      service.setMotion('reduced');
      service.setSheetLayout('beta');

      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY)!);
      expect(stored).toEqual({
        density: 'condensed',
        motion: 'reduced',
        sheetLayout: 'beta',
        cardTheme: 'dark',
      });
    });
  });

  describe('setCardTheme', () => {
    it('updates the cardTheme signal', () => {
      service.setCardTheme('dark');

      expect(service.cardTheme()).toBe('dark');
    });

    it('persists all preferences to localStorage without clobbering the other three', () => {
      service.setDensity('condensed');
      service.setMotion('reduced');
      service.setSheetLayout('beta');
      service.setCardTheme('dark');

      const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY)!);
      expect(stored).toEqual({
        density: 'condensed',
        motion: 'reduced',
        sheetLayout: 'beta',
        cardTheme: 'dark',
      });
    });
  });

  describe('load on construction', () => {
    it('loads a previously stored density from localStorage', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'condensed', motion: 'full' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.density()).toBe('condensed');
      expect(freshService.motion()).toBe('full');
    });
  });

  describe('invalid stored values fall back to defaults', () => {
    it('falls back to comfortable/system for a malformed JSON value', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not-json{{');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.density()).toBe('comfortable');
      expect(freshService.motion()).toBe('system');
    });

    it('falls back to comfortable for an unknown density value', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'spacious', motion: 'full' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.density()).toBe('comfortable');
      expect(freshService.motion()).toBe('full');
    });

    it('falls back to system for an unknown motion value', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'condensed', motion: 'blazing' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.density()).toBe('condensed');
      expect(freshService.motion()).toBe('system');
    });

    it('falls back to defaults when the stored value is not an object', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify('condensed'));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.density()).toBe('comfortable');
      expect(freshService.motion()).toBe('system');
    });

    it('falls back to classic when sheetLayout is missing from the stored value', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'condensed', motion: 'full' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.sheetLayout()).toBe('classic');
    });

    it('falls back to classic for an unknown sheetLayout value', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'condensed', motion: 'full', sheetLayout: 'psychedelic' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.sheetLayout()).toBe('classic');
    });

    /* Pins the upgrade path for a user whose stored blob predates the cardTheme feature entirely
       (no key at all, not just an unrecognized one) -- they get dark today where they got light
       before this preference existed, which is the intended behaviour change, not a regression.
       Must not throw and must leave their other three preferences exactly as stored. */
    it('migrates a pre-cardTheme stored blob to dark without disturbing the other three preferences', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'condensed', motion: 'reduced', sheetLayout: 'beta' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      let freshService!: PreferencesService;
      expect(() => {
        freshService = TestBed.inject(PreferencesService);
      }).not.toThrow();

      expect(freshService.cardTheme()).toBe('dark');
      expect(freshService.density()).toBe('condensed');
      expect(freshService.motion()).toBe('reduced');
      expect(freshService.sheetLayout()).toBe('beta');
    });

    it('falls back to dark for an unknown cardTheme value', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'condensed', motion: 'full', cardTheme: 'psychedelic' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.cardTheme()).toBe('dark');
    });
  });

  describe('DOM attribute is the source of truth at startup', () => {
    it('initializes density from a pre-stamped DOM attribute over a different stored value', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'comfortable', motion: 'system' }),
      );
      document.documentElement.setAttribute('data-density', 'condensed');
      document.documentElement.setAttribute('data-motion', 'reduced');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.density()).toBe('condensed');
      expect(freshService.motion()).toBe('reduced');
    });

    it('ignores an invalid DOM attribute and falls back to storage', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ density: 'condensed', motion: 'full' }),
      );
      document.documentElement.setAttribute('data-density', 'huge');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.density()).toBe('condensed');
    });

    it('initializes cardTheme from a pre-stamped DOM attribute over a different stored value', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ cardTheme: 'light' }));
      document.documentElement.setAttribute('data-card-theme', 'dark');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.cardTheme()).toBe('dark');
    });

    it('ignores an invalid data-card-theme attribute and falls back to storage', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ cardTheme: 'dark' }));
      document.documentElement.setAttribute('data-card-theme', 'psychedelic');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(PreferencesService);

      expect(freshService.cardTheme()).toBe('dark');
    });
  });

  describe('DOM attribute stamping', () => {
    it('stamps data-density on <html> when density changes', () => {
      service.setDensity('condensed');
      TestBed.tick();

      expect(document.documentElement.getAttribute('data-density')).toBe('condensed');
    });

    it('stamps data-motion on <html> when motion changes', () => {
      service.setMotion('reduced');
      TestBed.tick();

      expect(document.documentElement.getAttribute('data-motion')).toBe('reduced');
    });

    it('stamps data-card-theme on <html> when cardTheme changes', () => {
      service.setCardTheme('dark');
      TestBed.tick();

      expect(document.documentElement.getAttribute('data-card-theme')).toBe('dark');
    });

    it('stamps all three attributes on construction to match the initial signals', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      TestBed.inject(PreferencesService);
      TestBed.tick();

      expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
      expect(document.documentElement.getAttribute('data-motion')).toBe('system');
      expect(document.documentElement.getAttribute('data-card-theme')).toBe('dark');
    });
  });

  describe('effectiveMotion', () => {
    // jsdom does not implement matchMedia at all, so it must be stubbed directly rather than
    // spied on -- and removed afterward so the stub doesn't leak into other tests in this file.
    afterEach(() => {
      delete (window as { matchMedia?: unknown }).matchMedia;
    });

    it('resolves reduced/full motion directly without consulting matchMedia', () => {
      service.setMotion('reduced');
      expect(service.effectiveMotion()).toBe('reduced');

      service.setMotion('full');
      expect(service.effectiveMotion()).toBe('full');
    });

    it('resolves system via matchMedia to reduced when the OS prefers reduced motion', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

      service.setMotion('system');

      expect(service.effectiveMotion()).toBe('reduced');
    });

    it('resolves system via matchMedia to full when the OS does not prefer reduced motion', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;

      service.setMotion('system');

      expect(service.effectiveMotion()).toBe('full');
    });
  });
});
