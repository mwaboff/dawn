import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSurfaceDirective, CardSurfaceKind } from './card-surface.directive';
import { PreferencesService } from '../../core/services/preferences.service';

@Component({
  template: `<div class="surface" [appCardSurface]="kind">content</div>`,
  imports: [CardSurfaceDirective],
})
class TestHost {
  kind: CardSurfaceKind = 'dark-capable';
}

describe('CardSurfaceDirective', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let preferencesService: PreferencesService;

  // `kind` is set on `host` before the fixture's first `detectChanges()` call in every test below,
  // rather than in this `beforeEach` -- mutating it again afterwards trips
  // ExpressionChangedAfterItHasBeenCheckedError, since the first render already committed the
  // class field's default value as the checked baseline.
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-card-theme');

    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    preferencesService = TestBed.inject(PreferencesService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-card-theme');
  });

  function surfaceEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.surface');
  }

  const cases: { kind: CardSurfaceKind; pref: 'default' | 'light' | 'dark'; expected: 'light' | 'dark' }[] = [
    { kind: 'dark-capable', pref: 'default', expected: 'dark' },
    { kind: 'dark-capable', pref: 'light', expected: 'light' },
    { kind: 'dark-capable', pref: 'dark', expected: 'dark' },
    { kind: 'light-only', pref: 'default', expected: 'light' },
    { kind: 'light-only', pref: 'light', expected: 'light' },
    { kind: 'light-only', pref: 'dark', expected: 'dark' },
  ];

  for (const { kind, pref, expected } of cases) {
    it(`resolves ${kind} + '${pref}' preference to data-card-theme="${expected}"`, () => {
      host.kind = kind;
      preferencesService.setCardTheme(pref);
      fixture.detectChanges();

      expect(surfaceEl().getAttribute('data-card-theme')).toBe(expected);
    });
  }

  it('updates the host attribute reactively when the preference changes', () => {
    host.kind = 'light-only';
    preferencesService.setCardTheme('default');
    fixture.detectChanges();
    expect(surfaceEl().getAttribute('data-card-theme')).toBe('light');

    preferencesService.setCardTheme('dark');
    fixture.detectChanges();
    expect(surfaceEl().getAttribute('data-card-theme')).toBe('dark');
  });

  it('stamps only the host, independently of <html> -- divergent under the default preference', () => {
    host.kind = 'light-only';
    preferencesService.setCardTheme('default');
    fixture.detectChanges();

    expect(surfaceEl().getAttribute('data-card-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-card-theme')).toBe('dark');
  });
});
