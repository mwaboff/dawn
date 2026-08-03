import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Encounters } from './encounters';
import { AuthService } from '../../core/services/auth.service';
import { EncounterService } from '../../shared/services/encounter.service';
import { EncounterRunService } from '../../shared/services/encounter-run.service';
import { EncounterResponse } from '../../shared/models/encounter-api.model';
import { EncounterRunResponse } from '../../shared/models/encounter-run-api.model';
import { UserResponse } from '../../core/models/auth.model';

function buildRunResponse(overrides: Partial<EncounterRunResponse> = {}): EncounterRunResponse {
  return {
    id: 10,
    encounterId: 1,
    startedById: 1,
    status: 'ACTIVE',
    startedAt: '2026-01-01T00:00:00',
    adversaries: [],
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function buildEncounterResponse(overrides: Partial<EncounterResponse> = {}): EncounterResponse {
  return {
    id: 1,
    name: 'Goblin Ambush',
    isOfficial: false,
    isPublic: false,
    creatorId: 1,
    adversaries: [],
    adjustmentEasier: false,
    adjustmentTwoPlusSolos: false,
    adjustmentBonusDamage: false,
    adjustmentLowerTier: false,
    adjustmentNoElites: false,
    adjustmentHarder: false,
    suggestedBattlePoints: 14,
    spentBattlePoints: 6,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function buildUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return { id: 1, username: 'gm', role: 'USER', createdAt: '', lastModifiedAt: '', usernameChosen: true, ...overrides };
}

describe('Encounters', () => {
  let fixture: ComponentFixture<Encounters>;
  let component: Encounters;
  let encounterService: EncounterService;
  let encounterRunService: EncounterRunService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Encounters],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(Encounters);
    component = fixture.componentInstance;
    encounterService = TestBed.inject(EncounterService);
    encounterRunService = TestBed.inject(EncounterRunService);
    authService = TestBed.inject(AuthService);
    // Every ngOnInit also loads active runs -- most tests here aren't about that section, so
    // default it to empty and let the active-runs-specific tests below override this spy.
    vi.spyOn(encounterRunService, 'getRuns').mockReturnValue(of([]));
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('fetches only the current user\'s own encounters via the shared service, keyed by their id', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 7 }));
    const ownEncounters = [buildEncounterResponse({ id: 1, creatorId: 7 })];
    const getOwnEncountersSpy = vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of(ownEncounters));

    fixture.detectChanges();

    expect(getOwnEncountersSpy).toHaveBeenCalledWith(7);
    expect(component.encounters()).toEqual(ownEncounters);
  });

  it('never fetches and clears loading when there is no signed-in user', () => {
    vi.spyOn(authService, 'user').mockReturnValue(null);
    const getOwnEncountersSpy = vi.spyOn(encounterService, 'getOwnEncounters');

    fixture.detectChanges();

    expect(getOwnEncountersSpy).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('sets error and clears loading when the request fails', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(throwError(() => new Error('boom')));

    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('shows the empty state with no encounters', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([]));

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-empty')).toBeTruthy();
  });

  it('flags an over-budget encounter', () => {
    expect(component.isOverBudget(buildEncounterResponse({ spentBattlePoints: 20, suggestedBattlePoints: 14 }))).toBe(true);
    expect(component.isOverBudget(buildEncounterResponse({ spentBattlePoints: 10, suggestedBattlePoints: 14 }))).toBe(false);
  });

  describe('getTierRangeLabel', () => {
    // The full tier-resolution rule (single tier, range, tierOverride, "Mixed Tier" fallback) is
    // covered once in shared/utils/encounter-tier.utils.spec.ts -- this only proves the wrapper
    // composes with it correctly and adds the page-specific empty-roster case on top.
    it('shows "No adversaries yet" for an empty roster, regardless of overall tier', () => {
      expect(component.getTierRangeLabel(buildEncounterResponse({ tier: 3, adversaries: [] }))).toBe('No adversaries yet');
    });

    it('delegates to the shared tier-resolution rule when the roster is non-empty', () => {
      const encounter = buildEncounterResponse({
        tier: 2,
        adversaries: [{ id: 1, adversaryId: 5, displayOrder: 0 }],
      });
      expect(component.getTierRangeLabel(encounter)).toBe('Tier 2');
    });
  });

  it('navigates to the edit route for a row', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onEdit(3);

    expect(navigateSpy).toHaveBeenCalledWith(['/encounters/3/edit']);
  });

  it('navigates to create on onCreate', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onCreate();

    expect(navigateSpy).toHaveBeenCalledWith(['/encounters/new']);
  });

  it('copies an encounter and navigates to the copy\'s edit route', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.spyOn(encounterService, 'copyEncounter').mockReturnValue(of(buildEncounterResponse({ id: 55 })));

    component.onCopy(1);

    expect(navigateSpy).toHaveBeenCalledWith(['/encounters/55/edit']);
    expect(component.copyingId()).toBeNull();
  });

  it('removes the encounter from the list after a confirmed delete', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([buildEncounterResponse({ id: 1, creatorId: 1 })]));
    fixture.detectChanges();
    // A real 204 No Content DELETE response reaches HttpClient subscribers as `null` at runtime,
    // despite the `Observable<void>` type -- mocking it as `undefined` let this pass while a
    // `result !== null` sentinel check silently ate every successful delete.
    vi.spyOn(encounterService, 'deleteEncounter').mockReturnValue(of(null) as unknown as ReturnType<EncounterService['deleteEncounter']>);

    component.onDeleteRequest(1);
    component.onDeleteConfirm();
    component.onConfirmDelete();

    expect(component.encounters()).toHaveLength(0);
    expect(component.confirmingDeleteId()).toBeNull();
  });

  // `deleteEncounter` cascades: the backend hard-deletes the encounter's ACTIVE run (if any) in
  // the same transaction, destroying that run's live HP/Stress/tokens/notes with no way back --
  // unlike the encounter itself, which is soft-deleted and admin-restorable. The dialog's copy
  // must name that consequence rather than a blanket "permanently deleted" claim that overstates
  // the encounter side and understates the run side.
  it('names the in-progress run\'s data loss in the delete confirmation, without overclaiming the encounter is unrecoverable', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([buildEncounterResponse({ id: 1, creatorId: 1 })]));
    fixture.detectChanges();

    component.onDeleteRequest(1);
    component.onDeleteConfirm();
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.dialog-message')?.textContent?.trim();
    expect(message).toContain('live HP, Stress, tokens, and notes');
    expect(message).not.toContain('permanently delete this encounter');
  });

  it('keeps the encounter and shows an error when delete fails', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([buildEncounterResponse({ id: 1, creatorId: 1 })]));
    fixture.detectChanges();
    vi.spyOn(encounterService, 'deleteEncounter').mockReturnValue(throwError(() => new Error('boom')));

    component.onDeleteRequest(1);
    component.onDeleteConfirm();
    component.onConfirmDelete();

    expect(component.encounters()).toHaveLength(1);
    expect(component.deleteError()).toBe(true);
    expect(component.confirmingDeleteId()).toBeNull();
  });

  it('cancels a pending delete without removing anything', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([buildEncounterResponse({ id: 1, creatorId: 1 })]));
    fixture.detectChanges();

    component.onDeleteRequest(1);
    component.onCancelDelete();

    expect(component.pendingDeleteId()).toBeNull();
    expect(component.encounters()).toHaveLength(1);
  });

  it('makes the card itself a link to the run route, as the row\'s primary action', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([buildEncounterResponse({ id: 3, creatorId: 1, name: 'Goblin Ambush' })]));

    fixture.detectChanges();

    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.roster-entry-link');
    expect(link?.getAttribute('href')).toBe('/encounters/3/run');
    expect(link?.getAttribute('aria-label')).toBe('Run Goblin Ambush');
  });

  // The row itself used to be the focusable/interactive element, so shared/styles/roster.css's
  // `.roster-entry:focus-visible` gave the whole row a 2px accent outline on tab-focus. Focus now
  // lives on .roster-entry-link instead, which that shared rule can no longer match -- this
  // asserts the local `:has()` rule in encounters.css restores the same outline on the row, not
  // just a default ring around the name text.
  // jsdom's :focus-visible does not match a programmatically-.focus()'d element (with or without
  // a preceding keydown to establish keyboard modality -- both were tried), so live-DOM assertion
  // isn't possible here, the same legitimate limitation already accepted for the pure-CSS layout
  // fixes elsewhere in this PR. This instead inspects the compiled stylesheet rule itself, so a
  // future edit that weakens or deletes the outline (not just the tint) still fails a test.
  it('keeps an outline declaration on the :has() rule that restores row-level focus, not just the tint', () => {
    fixture.detectChanges();

    const rule = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .find((r): r is CSSStyleRule => r instanceof CSSStyleRule && r.selectorText?.includes('roster-entry-link:focus-visible'));

    expect(rule).toBeTruthy();
    expect(rule?.style.getPropertyValue('outline')).toContain('2px');
    expect(rule?.style.getPropertyValue('outline')).toContain('solid');
  });

  // This clicks the real rendered button rather than calling component.onEdit() directly --
  // the Edit button sits inside the same row as the stretched run link (see .roster-entry-link
  // in encounters.css), so a wiring mistake that let the row's link swallow the click would pass
  // a method-level test while still being broken in the browser.
  it('navigates to the edit route -- not the run route -- when the Edit button is clicked', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([buildEncounterResponse({ id: 3, creatorId: 1, name: 'Goblin Ambush' })]));
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const editBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.encounters-edit-btn');
    editBtn.click();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/encounters/3/edit']);
  });

  describe('active runs', () => {
    beforeEach(() => {
      vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
      vi.spyOn(encounterService, 'getOwnEncounters').mockReturnValue(of([buildEncounterResponse({ id: 1, creatorId: 1, name: 'Goblin Ambush' })]));
    });

    it('lists an active run paired with its encounter name', () => {
      vi.spyOn(encounterRunService, 'getRuns').mockReturnValue(of([buildRunResponse({ id: 10, encounterId: 1 })]));

      fixture.detectChanges();

      expect(component.activeRunEntries()).toEqual([{ run: expect.objectContaining({ id: 10 }), encounterName: 'Goblin Ambush' }]);
      expect(fixture.nativeElement.querySelector('.active-runs-name').textContent).toContain('Goblin Ambush');
    });

    // The discard control's aria-label used to read "Discard {{encounterName}}" -- indistinguishable
    // from deleting the saved encounter itself, when it only ends the in-progress run. Locking the
    // wording in place so it can't regress back to that ambiguity.
    it('labels the discard control as ending the run, not deleting the encounter', () => {
      vi.spyOn(encounterRunService, 'getRuns').mockReturnValue(of([buildRunResponse({ id: 10, encounterId: 1 })]));

      fixture.detectChanges();

      const discardBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.active-runs-actions .btn--danger-ghost');
      expect(discardBtn.getAttribute('aria-label')).toBe('Discard the in-progress run of Goblin Ambush');
      expect(discardBtn.textContent?.trim()).toBe('Discard Run');
    });

    it('resumes an active run by navigating to its encounter\'s run route', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onResume(buildRunResponse({ id: 10, encounterId: 7 }));

      expect(navigateSpy).toHaveBeenCalledWith(['/encounters/7/run']);
    });

    it('removes the run from the rendered list after a confirmed discard', () => {
      vi.spyOn(encounterRunService, 'getRuns').mockReturnValue(of([buildRunResponse({ id: 10, encounterId: 1 })]));
      // A real 204 No Content DELETE reaches HttpClient subscribers as `null`, not `undefined`.
      vi.spyOn(encounterRunService, 'deleteRun').mockReturnValue(of(null) as unknown as ReturnType<EncounterRunService['deleteRun']>);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.active-runs-entry')).toBeTruthy();

      component.onDiscardRequest(10);
      component.onDiscardConfirm();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.active-runs-entry')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.active-runs')).toBeFalsy();
    });

    it('keeps the run and shows an error when discard fails', () => {
      vi.spyOn(encounterRunService, 'getRuns').mockReturnValue(of([buildRunResponse({ id: 10, encounterId: 1 })]));
      vi.spyOn(encounterRunService, 'deleteRun').mockReturnValue(throwError(() => new Error('boom')));
      fixture.detectChanges();

      component.onDiscardRequest(10);
      component.onDiscardConfirm();
      fixture.detectChanges();

      expect(component.activeRuns()).toHaveLength(1);
      expect(component.discardError()).toBe(true);
      expect(fixture.nativeElement.querySelector('.active-runs-entry')).toBeTruthy();
    });

    it('cancels a pending discard without removing anything', () => {
      vi.spyOn(encounterRunService, 'getRuns').mockReturnValue(of([buildRunResponse({ id: 10, encounterId: 1 })]));
      fixture.detectChanges();

      component.onDiscardRequest(10);
      component.onDiscardCancel();

      expect(component.pendingDiscardId()).toBeNull();
      expect(component.activeRuns()).toHaveLength(1);
    });
  });
});
