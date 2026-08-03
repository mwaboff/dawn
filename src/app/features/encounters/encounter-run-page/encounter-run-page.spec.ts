import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EncounterRunPage } from './encounter-run-page';
import { EncounterRunView } from '../../../shared/components/encounter-run/encounter-run-view';
import { EncounterRunService } from '../../../shared/services/encounter-run.service';
import { EncounterService } from '../../../shared/services/encounter.service';
import { EncounterRunResponse } from '../../../shared/models/encounter-run-api.model';
import { EncounterResponse } from '../../../shared/models/encounter-api.model';

function buildRun(overrides: Partial<EncounterRunResponse> = {}): EncounterRunResponse {
  return {
    id: 5,
    encounterId: 1,
    startedById: 1,
    status: 'ACTIVE',
    startedAt: '2026-01-01T00:00:00Z',
    adversaries: [],
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildEncounter(overrides: Partial<EncounterResponse> = {}): EncounterResponse {
  return {
    id: 1,
    name: 'Ambush at the Ford',
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
    suggestedBattlePoints: 0,
    spentBattlePoints: 0,
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup(id: string | null): {
  fixture: ComponentFixture<EncounterRunPage>;
  component: EncounterRunPage;
  runService: EncounterRunService;
  encounterService: EncounterService;
  router: Router;
} {
  TestBed.configureTestingModule({
    imports: [EncounterRunPage],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
    ],
  });
  const fixture = TestBed.createComponent(EncounterRunPage);
  const encounterService = TestBed.inject(EncounterService);
  vi.spyOn(encounterService, 'getEncounter').mockReturnValue(of(buildEncounter()));
  return {
    fixture,
    component: fixture.componentInstance,
    runService: TestBed.inject(EncounterRunService),
    encounterService,
    router: TestBed.inject(Router),
  };
}

describe('EncounterRunPage', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('resumes an existing ACTIVE run instead of starting a second one', () => {
    const { fixture, component, runService } = setup('1');
    const existingRun = buildRun({ id: 42, encounterId: 1 });
    vi.spyOn(runService, 'getRuns').mockReturnValue(of([existingRun]));
    const startRunSpy = vi.spyOn(runService, 'startRun');
    vi.spyOn(runService, 'getRun').mockReturnValue(of(existingRun));

    fixture.detectChanges();

    expect(component.runId()).toBe(42);
    expect(startRunSpy).not.toHaveBeenCalled();
  });

  it('starts a new run when no ACTIVE run exists for the encounter', () => {
    const { fixture, component, runService } = setup('1');
    const newRun = buildRun({ id: 99, encounterId: 1 });
    vi.spyOn(runService, 'getRuns').mockReturnValue(of([]));
    const startRunSpy = vi.spyOn(runService, 'startRun').mockReturnValue(of(newRun));
    vi.spyOn(runService, 'getRun').mockReturnValue(of(newRun));

    fixture.detectChanges();

    expect(component.runId()).toBe(99);
    expect(startRunSpy).toHaveBeenCalledWith(1);
  });

  it('sends no campaignId when starting a run', () => {
    const { fixture, runService } = setup('1');
    const newRun = buildRun({ id: 99, encounterId: 1 });
    vi.spyOn(runService, 'getRuns').mockReturnValue(of([]));
    const startRunSpy = vi.spyOn(runService, 'startRun').mockReturnValue(of(newRun));
    vi.spyOn(runService, 'getRun').mockReturnValue(of(newRun));

    fixture.detectChanges();

    expect(startRunSpy).toHaveBeenCalledTimes(1);
    expect(startRunSpy.mock.calls[0]).toHaveLength(1);
  });

  it('shows the error state without any HTTP call for a non-numeric id', () => {
    const { fixture, component, runService } = setup('abc');
    const getRunsSpy = vi.spyOn(runService, 'getRuns');

    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
    expect(getRunsSpy).not.toHaveBeenCalled();
  });

  it('shows the error state without any HTTP call for a negative id', () => {
    const { fixture, component, runService } = setup('-3');
    const getRunsSpy = vi.spyOn(runService, 'getRuns');

    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(getRunsSpy).not.toHaveBeenCalled();
  });

  it('shows a retry action instead of a permanent spinner when resolution fails', () => {
    const { fixture, component } = setup('1');
    const runService = TestBed.inject(EncounterRunService);
    vi.spyOn(runService, 'getRuns').mockReturnValue(throwError(() => new Error('boom')));

    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
    const retryButton: HTMLButtonElement | null = fixture.nativeElement.querySelector('.run-page-error button');
    expect(retryButton).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.run-page-loading')).toBeFalsy();
  });

  it('retries resolution when the retry button is clicked', () => {
    const { fixture, component, runService } = setup('1');
    const newRun = buildRun({ id: 7, encounterId: 1 });
    vi.spyOn(runService, 'getRuns').mockReturnValueOnce(throwError(() => new Error('boom'))).mockReturnValueOnce(of([]));
    vi.spyOn(runService, 'startRun').mockReturnValue(of(newRun));
    vi.spyOn(runService, 'getRun').mockReturnValue(of(newRun));
    fixture.detectChanges();
    expect(component.error()).toBe(true);

    component.retryLoad();
    fixture.detectChanges();

    expect(component.error()).toBe(false);
    expect(component.runId()).toBe(7);
  });

  it('renders EncounterRunView with the resolved run id once loaded', () => {
    const { fixture, runService } = setup('1');
    const existingRun = buildRun({ id: 42, encounterId: 1 });
    vi.spyOn(runService, 'getRuns').mockReturnValue(of([existingRun]));
    vi.spyOn(runService, 'getRun').mockReturnValue(of(existingRun));

    fixture.detectChanges();

    const runView = fixture.debugElement.query(By.directive(EncounterRunView));
    expect(runView).toBeTruthy();
    expect(runView.componentInstance.runId()).toBe(42);
    expect(runView.componentInstance.density()).toBe('comfortable');
    expect(runView.componentInstance.showHeader()).toBe(true);
  });

  it("names the run after the encounter it resolved, so the standalone page doesn't just say Running Encounter", () => {
    const { fixture, runService, encounterService } = setup('1');
    const existingRun = buildRun({ id: 42, encounterId: 1 });
    vi.spyOn(runService, 'getRuns').mockReturnValue(of([existingRun]));
    vi.spyOn(runService, 'getRun').mockReturnValue(of(existingRun));
    vi.spyOn(encounterService, 'getEncounter').mockReturnValue(of(buildEncounter({ id: 1, name: 'Ambush at the Ford' })));

    fixture.detectChanges();

    const runView = fixture.debugElement.query(By.directive(EncounterRunView));
    expect(runView.componentInstance.title()).toBe('Ambush at the Ford');
    expect(fixture.nativeElement.querySelector('.run-view__title').textContent.trim()).toBe('Ambush at the Ford');
  });

  it('navigates to the encounters list when the run completes', () => {
    const { fixture, component, runService, router } = setup('1');
    const existingRun = buildRun({ id: 42, encounterId: 1 });
    vi.spyOn(runService, 'getRuns').mockReturnValue(of([existingRun]));
    vi.spyOn(runService, 'getRun').mockReturnValue(of(existingRun));
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();

    component.onCompleted();

    expect(navigateSpy).toHaveBeenCalledWith(['/encounters']);
  });
});
