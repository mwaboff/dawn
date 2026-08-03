import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Encounters, tierRangeLabel } from './encounters';
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

describe('tierRangeLabel', () => {
  it('returns a placeholder for an empty roster', () => {
    expect(tierRangeLabel(buildEncounterResponse({ adversaries: [] }))).toBe('No adversaries yet');
  });

  it('returns a single tier label when every instance shares a tier', () => {
    const encounter = buildEncounterResponse({
      adversaries: [{ id: 1, adversaryId: 5, adversary: { id: 5, name: 'A', tier: 2, adversaryType: 'MINION' }, displayOrder: 0 }],
    });
    expect(tierRangeLabel(encounter)).toBe('Tier 2');
  });

  it('returns a range when instances span multiple tiers', () => {
    const encounter = buildEncounterResponse({
      adversaries: [
        { id: 1, adversaryId: 5, adversary: { id: 5, name: 'A', tier: 1, adversaryType: 'MINION' }, displayOrder: 0 },
        { id: 2, adversaryId: 6, adversary: { id: 6, name: 'B', tier: 3, adversaryType: 'SOLO' }, displayOrder: 1 },
      ],
    });
    expect(tierRangeLabel(encounter)).toBe('Tier 1–3');
  });

  it('prefers tierOverride over the printed tier', () => {
    const encounter = buildEncounterResponse({
      adversaries: [{ id: 1, adversaryId: 5, adversary: { id: 5, name: 'A', tier: 1, adversaryType: 'MINION' }, tierOverride: 4, displayOrder: 0 }],
    });
    expect(tierRangeLabel(encounter)).toBe('Tier 4');
  });
});

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

  it('filters the response to the current user\'s own encounters', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getEncounters').mockReturnValue(
      of({
        content: [buildEncounterResponse({ id: 1, creatorId: 1 }), buildEncounterResponse({ id: 2, creatorId: 99 })],
        currentPage: 0, pageSize: 50, totalElements: 2, totalPages: 1,
      }),
    );

    fixture.detectChanges();

    expect(component.encounters()).toHaveLength(1);
    expect(component.encounters()[0].id).toBe(1);
  });

  it('sets error and clears loading when the request fails', () => {
    vi.spyOn(encounterService, 'getEncounters').mockReturnValue(throwError(() => new Error('boom')));

    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('shows the empty state with no encounters', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getEncounters').mockReturnValue(
      of({ content: [], currentPage: 0, pageSize: 50, totalElements: 0, totalPages: 0 }),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.roster-empty')).toBeTruthy();
  });

  it('flags an over-budget encounter', () => {
    expect(component.isOverBudget(buildEncounterResponse({ spentBattlePoints: 20, suggestedBattlePoints: 14 }))).toBe(true);
    expect(component.isOverBudget(buildEncounterResponse({ spentBattlePoints: 10, suggestedBattlePoints: 14 }))).toBe(false);
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
    vi.spyOn(encounterService, 'getEncounters').mockReturnValue(
      of({ content: [buildEncounterResponse({ id: 1, creatorId: 1 })], currentPage: 0, pageSize: 50, totalElements: 1, totalPages: 1 }),
    );
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

  it('keeps the encounter and shows an error when delete fails', () => {
    vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
    vi.spyOn(encounterService, 'getEncounters').mockReturnValue(
      of({ content: [buildEncounterResponse({ id: 1, creatorId: 1 })], currentPage: 0, pageSize: 50, totalElements: 1, totalPages: 1 }),
    );
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
    vi.spyOn(encounterService, 'getEncounters').mockReturnValue(
      of({ content: [buildEncounterResponse({ id: 1, creatorId: 1 })], currentPage: 0, pageSize: 50, totalElements: 1, totalPages: 1 }),
    );
    fixture.detectChanges();

    component.onDeleteRequest(1);
    component.onCancelDelete();

    expect(component.pendingDeleteId()).toBeNull();
    expect(component.encounters()).toHaveLength(1);
  });

  it('navigates to the run route for a row', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onRun(3);

    expect(navigateSpy).toHaveBeenCalledWith(['/encounters/3/run']);
  });

  describe('active runs', () => {
    beforeEach(() => {
      vi.spyOn(authService, 'user').mockReturnValue(buildUser({ id: 1 }));
      vi.spyOn(encounterService, 'getEncounters').mockReturnValue(
        of({ content: [buildEncounterResponse({ id: 1, creatorId: 1, name: 'Goblin Ambush' })], currentPage: 0, pageSize: 50, totalElements: 1, totalPages: 1 }),
      );
    });

    it('lists an active run paired with its encounter name', () => {
      vi.spyOn(encounterRunService, 'getRuns').mockReturnValue(of([buildRunResponse({ id: 10, encounterId: 1 })]));

      fixture.detectChanges();

      expect(component.activeRunEntries()).toEqual([{ run: expect.objectContaining({ id: 10 }), encounterName: 'Goblin Ambush' }]);
      expect(fixture.nativeElement.querySelector('.active-runs-name').textContent).toContain('Goblin Ambush');
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
