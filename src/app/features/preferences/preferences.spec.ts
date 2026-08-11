import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Preferences } from './preferences';
import { PreferencesService } from '../../core/services/preferences.service';

describe('Preferences', () => {
  let fixture: ComponentFixture<Preferences>;
  let component: Preferences;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-motion');
    document.documentElement.removeAttribute('data-card-theme');

    await TestBed.configureTestingModule({
      imports: [Preferences],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Preferences);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-motion');
    document.documentElement.removeAttribute('data-card-theme');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the page heading', () => {
    const heading = el.querySelector('h1');
    expect(heading?.textContent).toContain('Display Preferences');
  });

  it('renders four fieldsets: Density, Motion, Character sheet, and Card theme', () => {
    const legends = Array.from(el.querySelectorAll('legend')).map(l => l.textContent);
    expect(legends).toEqual(['Density', 'Motion', 'Character sheet', 'Card theme']);
  });

  it('renders a note that changes are stored on this device only', () => {
    expect(el.querySelector('.preferences-intro')?.textContent).toContain('this browser');
  });

  describe('density options', () => {
    it('renders comfortable and condensed options', () => {
      const labels = Array.from(el.querySelectorAll('input[name="density"]')).map(
        i => (i as HTMLInputElement).value,
      );
      expect(labels).toEqual(['comfortable', 'condensed']);
    });

    it('marks comfortable as checked by default', () => {
      const comfortable = el.querySelector(
        'input[name="density"][value="comfortable"]',
      ) as HTMLInputElement;
      expect(comfortable.checked).toBe(true);
    });

    it('clicking condensed calls setDensity on the service', () => {
      const service = TestBed.inject(PreferencesService);

      const condensed = el.querySelector(
        'input[name="density"][value="condensed"]',
      ) as HTMLInputElement;
      condensed.checked = true;
      condensed.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(service.density()).toBe('condensed');
    });

    it('applies the selected modifier class to the chosen option', () => {
      component.onDensityChange('condensed');
      fixture.detectChanges();

      const condensedLabel = el.querySelector('input[name="density"][value="condensed"]')
        ?.closest('label');
      expect(condensedLabel?.classList.contains('preferences-option--selected')).toBe(true);
    });
  });

  describe('motion options', () => {
    it('renders system, reduced, and full options', () => {
      const values = Array.from(el.querySelectorAll('input[name="motion"]')).map(
        i => (i as HTMLInputElement).value,
      );
      expect(values).toEqual(['system', 'reduced', 'full']);
    });

    it('marks system as checked by default', () => {
      const system = el.querySelector(
        'input[name="motion"][value="system"]',
      ) as HTMLInputElement;
      expect(system.checked).toBe(true);
    });

    it('clicking reduced calls setMotion on the service', () => {
      const service = TestBed.inject(PreferencesService);

      const reduced = el.querySelector(
        'input[name="motion"][value="reduced"]',
      ) as HTMLInputElement;
      reduced.checked = true;
      reduced.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(service.motion()).toBe('reduced');
    });
  });

  describe('sheet layout options', () => {
    it('renders classic and beta options', () => {
      const values = Array.from(el.querySelectorAll('input[name="sheetLayout"]')).map(
        i => (i as HTMLInputElement).value,
      );
      expect(values).toEqual(['classic', 'beta']);
    });

    it('marks classic as checked by default', () => {
      const classic = el.querySelector(
        'input[name="sheetLayout"][value="classic"]',
      ) as HTMLInputElement;
      expect(classic.checked).toBe(true);
    });

    it('clicking beta calls setSheetLayout on the service', () => {
      const service = TestBed.inject(PreferencesService);

      const beta = el.querySelector(
        'input[name="sheetLayout"][value="beta"]',
      ) as HTMLInputElement;
      beta.checked = true;
      beta.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(service.sheetLayout()).toBe('beta');
    });

    it('applies the selected modifier class to the chosen option', () => {
      component.onSheetLayoutChange('beta');
      fixture.detectChanges();

      const betaLabel = el.querySelector('input[name="sheetLayout"][value="beta"]')
        ?.closest('label');
      expect(betaLabel?.classList.contains('preferences-option--selected')).toBe(true);
    });

    it('states in the hint that the change applies the next time a character is opened', () => {
      const fieldset = Array.from(el.querySelectorAll('fieldset')).find(
        f => f.querySelector('legend')?.textContent === 'Character sheet',
      );
      expect(fieldset?.querySelector('.preferences-hint')?.textContent).toContain(
        'next time you open a character',
      );
    });
  });

  describe('card theme options', () => {
    it('renders default, light, and dark options, with default listed first', () => {
      const values = Array.from(el.querySelectorAll('input[name="cardTheme"]')).map(
        i => (i as HTMLInputElement).value,
      );
      expect(values).toEqual(['default', 'light', 'dark']);
    });

    it('marks default as checked by default', () => {
      const defaultOption = el.querySelector(
        'input[name="cardTheme"][value="default"]',
      ) as HTMLInputElement;
      expect(defaultOption.checked).toBe(true);
    });

    it('clicking light calls setCardTheme on the service', () => {
      const service = TestBed.inject(PreferencesService);

      const light = el.querySelector(
        'input[name="cardTheme"][value="light"]',
      ) as HTMLInputElement;
      light.checked = true;
      light.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(service.cardTheme()).toBe('light');
    });

    it('applies the selected modifier class to the chosen option', () => {
      component.onCardThemeChange('light');
      fixture.detectChanges();

      const lightLabel = el.querySelector('input[name="cardTheme"][value="light"]')
        ?.closest('label');
      expect(lightLabel?.classList.contains('preferences-option--selected')).toBe(true);
    });

    it('states in the hint that it has no effect on the classic sheet', () => {
      const fieldset = Array.from(el.querySelectorAll('fieldset')).find(
        f => f.querySelector('legend')?.textContent === 'Card theme',
      );
      expect(fieldset?.querySelector('.preferences-hint')?.textContent).toContain(
        'no effect on the classic sheet',
      );
    });

    it('labels the Light option with a "Beta" badge as real text, not decoration', () => {
      const lightLabel = el.querySelector('input[name="cardTheme"][value="light"]')
        ?.closest('label');
      expect(lightLabel?.querySelector('.preferences-option__badge')?.textContent?.trim()).toBe('Beta');
      // The badge lives inside <label>, so it folds into the radio's accessible name naturally --
      // no separate aria-label is used or needed.
      expect(lightLabel?.textContent).toContain('Light');
      expect(lightLabel?.textContent).toContain('Beta');
    });

    it('does not tag the Dark option with a badge', () => {
      const darkLabel = el.querySelector('input[name="cardTheme"][value="dark"]')
        ?.closest('label');
      expect(darkLabel?.querySelector('.preferences-option__badge')).toBeFalsy();
    });

    it('does not tag the Default option with a badge', () => {
      const defaultLabel = el.querySelector('input[name="cardTheme"][value="default"]')
        ?.closest('label');
      expect(defaultLabel?.querySelector('.preferences-option__badge')).toBeFalsy();
    });
  });
});
