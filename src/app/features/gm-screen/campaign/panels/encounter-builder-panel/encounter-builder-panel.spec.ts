import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CampaignResponse } from '../../../../../shared/models/campaign-api.model';
import { EncounterResponse } from '../../../../../shared/models/encounter-api.model';
import { EncounterRunResponse } from '../../../../../shared/models/encounter-run-api.model';
import { PaginatedResponse } from '../../../../../shared/models/api.model';
import { EncounterRunView } from '../../../../../shared/components/encounter-run/encounter-run-view';
import { GmScreenContext } from '../../gm-screen-context.service';
import { EncounterBuilderPanel } from './encounter-builder-panel';

const ENCOUNTERS_URL = 'http://localhost:8080/api/dh/encounters?page=0&size=100';
const RUNS_URL = 'http://localhost:8080/api/dh/encounter-runs?status=ACTIVE&campaignId=7';
const runUrl = (runId: number) => `http://localhost:8080/api/dh/encounter-runs/${runId}`;
const startRunUrl = (encounterId: number) => `http://localhost:8080/api/dh/encounters/${encounterId}/runs`;

function campaign(): CampaignResponse {
  return {
    id: 7,
    name: 'The Hollow Road',
    creatorId: 1,
    gameMasterIds: [1],
    playerIds: [],
    pendingCharacterSheetIds: [],
    playerCharacterIds: [],
    nonPlayerCharacterIds: [],
    fear: 0,
    isEnded: false,
    createdAt: '',
    lastModifiedAt: '',
  } as CampaignResponse;
}

function encounter(overrides: Partial<EncounterResponse> = {}): EncounterResponse {
  return {
    id: 10,
    name: 'Ambush at the Ford',
    tier: 2,
    isOfficial: false,
    isPublic: false,
    campaignId: 7,
    creatorId: 1,
    adversaries: [],
    adjustmentEasier: false,
    adjustmentTwoPlusSolos: false,
    adjustmentBonusDamage: false,
    adjustmentLowerTier: false,
    adjustmentNoElites: false,
    adjustmentHarder: false,
    suggestedBattlePoints: 11,
    spentBattlePoints: 9,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

function encountersPage(content: EncounterResponse[]): PaginatedResponse<EncounterResponse> {
  return { content, totalElements: content.length, totalPages: 1, pageSize: 100, currentPage: 0 };
}

function run(overrides: Partial<EncounterRunResponse> = {}): EncounterRunResponse {
  return {
    id: 42,
    encounterId: 10,
    campaignId: 7,
    startedById: 1,
    status: 'ACTIVE',
    startedAt: '',
    adversaries: [],
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  };
}

describe('EncounterBuilderPanel', () => {
  let fixture: ComponentFixture<EncounterBuilderPanel>;
  let component: EncounterBuilderPanel;
  let context: GmScreenContext;
  let httpMock: HttpTestingController;

  function setUp(seedCampaign = true): void {
    TestBed.configureTestingModule({
      imports: [EncounterBuilderPanel],
      providers: [provideHttpClient(), provideHttpClientTesting(), GmScreenContext],
    });
    context = TestBed.inject(GmScreenContext);
    if (seedCampaign) context.setCampaign(campaign());
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EncounterBuilderPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function flushList(encounters: EncounterResponse[], runs: EncounterRunResponse[]): void {
    httpMock.expectOne(ENCOUNTERS_URL).flush(encountersPage(encounters));
    httpMock.expectOne(RUNS_URL).flush(runs);
    fixture.detectChanges();
  }

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => httpMock.verify());

  it('loads the campaign encounters and active runs on init', () => {
    setUp();
    flushList([encounter()], []);

    expect(component.encounters()).toHaveLength(1);
  });

  it('issues no requests when the campaign id is not yet known', () => {
    setUp(false);
    httpMock.expectNone(ENCOUNTERS_URL);
    httpMock.expectNone(RUNS_URL);
  });

  it("filters out encounters that don't belong to this campaign", () => {
    setUp();
    flushList([encounter({ id: 1, campaignId: 7 }), encounter({ id: 2, campaignId: 9 })], []);

    expect(component.encounters().map(e => e.id)).toEqual([1]);
  });

  it('renders a row per campaign encounter', () => {
    setUp();
    flushList([encounter({ id: 1 }), encounter({ id: 2, name: 'Second Wave' })], []);

    expect(fixture.nativeElement.querySelectorAll('app-panel-encounter-row').length).toBe(2);
  });

  it('shows an empty state when the campaign has no saved encounters', () => {
    setUp();
    flushList([], []);

    expect(fixture.nativeElement.querySelector('.gm-panel__note').textContent).toContain(
      'No encounters saved',
    );
  });

  it('reports a failed load with an announced error and a retry action', () => {
    setUp();
    httpMock.expectOne(ENCOUNTERS_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    // forkJoin cancels the still-open runs request the moment the encounters one errors --
    // drain it via match() (not expectOne().flush(), which throws on an already-cancelled request).
    httpMock.match(RUNS_URL);
    fixture.detectChanges();

    expect(component.loadFailed()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    const retryButton: HTMLButtonElement | null = fixture.nativeElement.querySelector('button');
    expect(retryButton).toBeTruthy();
  });

  it('re-issues the load when the retry button is clicked after a failure', () => {
    setUp();
    httpMock.expectOne(ENCOUNTERS_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    httpMock.match(RUNS_URL);
    fixture.detectChanges();
    expect(component.loadFailed()).toBe(true);

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    retryButton.click();
    fixture.detectChanges();
    flushList([encounter()], []);

    expect(component.loadFailed()).toBe(false);
    expect(component.encounters()).toHaveLength(1);
  });

  it('passes campaignId when starting a run', () => {
    setUp();
    flushList([encounter()], []);

    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();

    const request = httpMock.expectOne(startRunUrl(10));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ campaignId: 7 });
    request.flush(run());
  });

  it('shows the run view once a run starts, at compact density with no header', () => {
    setUp();
    flushList([encounter()], []);

    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    httpMock.expectOne(startRunUrl(10)).flush(run());
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    const runView = fixture.debugElement.query(By.directive(EncounterRunView));
    expect(runView).toBeTruthy();
    expect(runView.componentInstance.runId()).toBe(42);
    expect(runView.componentInstance.density()).toBe('compact');
    expect(runView.componentInstance.showHeader()).toBe(false);

    // `showHeader=false` only hides EncounterRunView's title/standing -- its own
    // RunLifecycleActions (Complete/Discard) still renders, so this panel must not render a
    // second copy alongside it.
    expect(fixture.nativeElement.querySelectorAll('app-run-lifecycle-actions').length).toBe(1);
  });

  it('resumes an existing ACTIVE run instead of starting a second one', () => {
    setUp();
    flushList([encounter()], [run()]);

    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectNone(startRunUrl(10));
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    const runView = fixture.debugElement.query(By.directive(EncounterRunView));
    expect(runView.componentInstance.runId()).toBe(42);
  });

  it('labels an already-active encounter "Resume" instead of "Run"', () => {
    setUp();
    flushList([encounter()], [run()]);

    expect(fixture.nativeElement.querySelector('app-panel-encounter-row button').textContent.trim()).toBe(
      'Resume',
    );
  });

  it('shows an error and stays on the list when starting a run fails', () => {
    setUp();
    flushList([encounter()], []);

    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    httpMock.expectOne(startRunUrl(10)).flush('boom', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(component.startError()).toContain('Ambush at the Ford');
    expect(fixture.debugElement.query(By.directive(EncounterRunView))).toBeFalsy();
  });

  it('returns to the list without ending the run when "Back to list" is clicked', () => {
    setUp();
    flushList([encounter()], [run()]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    component.onBackToList();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(EncounterRunView))).toBeFalsy();
    expect(fixture.nativeElement.querySelector('app-panel-encounter-row')).toBeTruthy();
  });

  it('reloads the list once the run ends', () => {
    setUp();
    flushList([encounter()], [run()]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    component.onRunEnded();

    httpMock.expectOne(ENCOUNTERS_URL).flush(encountersPage([encounter()]));
    httpMock.expectOne(RUNS_URL).flush([]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(EncounterRunView))).toBeFalsy();
  });
});
