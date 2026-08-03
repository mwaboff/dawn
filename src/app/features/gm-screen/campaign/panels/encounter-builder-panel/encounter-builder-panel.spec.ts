import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CampaignResponse } from '../../../../../shared/models/campaign-api.model';
import { EncounterResponse } from '../../../../../shared/models/encounter-api.model';
import { EncounterRunResponse } from '../../../../../shared/models/encounter-run-api.model';
import { PaginatedResponse } from '../../../../../shared/models/api.model';
import { EncounterRunView } from '../../../../../shared/components/encounter-run/encounter-run-view';
import { GmScreenContext } from '../../gm-screen-context.service';
import { encounterEditPath } from '../../../../encounters/encounter-routes';
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
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), GmScreenContext],
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

  it('loads the full visible encounter list and this campaign\'s active runs on init', () => {
    setUp();
    flushList([encounter()], []);

    expect(component.encounters()).toHaveLength(1);
  });

  it('issues no requests when the campaign id is not yet known', () => {
    setUp(false);
    httpMock.expectNone(ENCOUNTERS_URL);
    httpMock.expectNone(RUNS_URL);
  });

  it("does not filter the encounter list by this campaign's id", () => {
    setUp();
    flushList([encounter({ id: 1, campaignId: 7 }), encounter({ id: 2, campaignId: 9 })], []);

    expect(component.encounters().map(e => e.id)).toEqual([1, 2]);
  });

  it('renders a row per visible encounter', () => {
    setUp();
    flushList([encounter({ id: 1 }), encounter({ id: 2, name: 'Second Wave' })], []);

    expect(fixture.nativeElement.querySelectorAll('app-panel-encounter-row').length).toBe(2);
  });

  it('shows an empty state naming the visibility tiers actually listed', () => {
    setUp();
    flushList([], []);

    expect(fixture.nativeElement.querySelector('.gm-panel__note').textContent).toContain(
      'official, public, or your own encounters',
    );
  });

  it('links "+ New Encounter" to the encounter builder route', () => {
    setUp();
    flushList([], []);

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/encounters/new');
  });

  it('opens "+ New Encounter" in a new tab, safely and with a warning in its accessible name', () => {
    // A GM mid-session shouldn't lose their screen to go build something -- but WCAG G201 says an
    // unannounced new-window/tab open is a context change the user must be warned about.
    setUp();
    flushList([], []);

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.getAttribute('aria-label')).toBe('New encounter (opens in a new tab)');
    // The glyph is a visible cue for sighted users; aria-hidden keeps it from being announced a
    // second time on top of the aria-label above.
    const icon = link.querySelector('.eb__new-tab-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('filters the list to encounters matching the search query', () => {
    setUp();
    flushList([encounter({ id: 1, name: 'Goblin Ambush' }), encounter({ id: 2, name: 'Second Wave' })], []);

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#eb-search');
    input.value = 'wave';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('app-panel-encounter-row');
    expect(rows).toHaveLength(1);
  });

  it('shows a no-match message (not the no-encounters message) when a search finds nothing', () => {
    setUp();
    flushList([encounter({ id: 1, name: 'Goblin Ambush' })], []);

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#eb-search');
    input.value = 'nothing-like-this';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.gm-panel__note').textContent).toContain(
      'No encounters match',
    );
  });

  it('does not warn about a capped list under the fetch size', () => {
    setUp();
    flushList([encounter({ id: 1 })], []);

    expect(fixture.nativeElement.querySelector('.eb__cap-note')).toBeFalsy();
  });

  it('warns the list may be capped once it reaches the fetch size', () => {
    setUp();
    flushList(
      Array.from({ length: 100 }, (_, i) => encounter({ id: i + 1 })),
      [],
    );

    expect(fixture.nativeElement.querySelector('.eb__cap-note')).toBeTruthy();
  });

  it('keeps the cap warning visible alongside a "no matches" search result', () => {
    // `atFetchCap` reads the raw fetched list, not the filtered one -- a search narrowing the
    // *visible* rows to zero must not make the cap warning disappear along with them, since the
    // cap is still just as true and the GM still can't be sure this is really "no matches".
    setUp();
    flushList(
      Array.from({ length: 100 }, (_, i) => encounter({ id: i + 1 })),
      [],
    );

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#eb-search');
    input.value = 'nothing-like-this';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.eb__cap-note')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.gm-panel__note').textContent).toContain(
      'No encounters match',
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
    // `showHeader=false` hides the run view's own title, but its Delete-Encounter control still
    // reads `title()` for its accessible name -- so the host must supply the real encounter name
    // even with the header hidden.
    expect(runView.componentInstance.title()).toBe('Ambush at the Ford');
    // `EncounterRunView` can't import the route itself (`shared/` never imports from `features/`),
    // so this panel resolves it and passes a plain string -- the Edit control depends on it.
    expect(runView.componentInstance.editHref()).toBe(encounterEditPath(10));

    // `showHeader=false` only hides EncounterRunView's title/standing -- its own
    // RunLifecycleActions (Complete/Discard) still renders, so this panel must not render a
    // second copy alongside it.
    expect(fixture.nativeElement.querySelectorAll('app-run-lifecycle-actions').length).toBe(1);
  });

  it('moves focus to the run heading once a run starts', async () => {
    setUp();
    flushList([encounter()], []);

    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    httpMock.expectOne(startRunUrl(10)).flush(run());
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.eb__run-title')).toBe(document.activeElement);
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
    httpMock.expectOne(RUNS_URL).flush([run()]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(EncounterRunView))).toBeFalsy();
    expect(fixture.nativeElement.querySelector('app-panel-encounter-row')).toBeTruthy();
  });

  it('moves focus to the list heading when "Back to list" is clicked', async () => {
    setUp();
    flushList([encounter()], [run()]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    component.onBackToList();
    httpMock.expectOne(RUNS_URL).flush([run()]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.eb__search-label')).toBe(document.activeElement);
  });

  it('refreshes the active-run list on "Back to list" so a later Resume targets the current run', () => {
    // `RunLifecycleActions`' Reset deletes the old run and starts a new one server-side without
    // telling `EncounterRunView`'s host (it has no output for it) -- so the run id this panel
    // cached at the last full load (42) can go stale while the GM is looking at the run view.
    // Refreshing on the way back to the list is what a later Resume should target instead (99).
    setUp();
    flushList([encounter()], [run({ id: 42 })]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run({ id: 42 }));
    fixture.detectChanges();

    component.onBackToList();
    httpMock.expectOne(RUNS_URL).flush([run({ id: 99 })]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectNone(startRunUrl(10));
    httpMock.expectOne(runUrl(99)).flush(run({ id: 99 }));
    fixture.detectChanges();

    const runView = fixture.debugElement.query(By.directive(EncounterRunView));
    expect(runView.componentInstance.runId()).toBe(99);
  });

  it('ignores a Resume click while the post-Back refresh is still in flight', () => {
    // The GET fired by `onBackToList()` hasn't resolved yet here -- `activeRunList` is still the
    // pre-Back snapshot. Acting on it now would be exactly the race a GM could hit by clicking
    // Resume in the instant before the fresh list lands.
    setUp();
    flushList([encounter()], [run({ id: 42 })]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run({ id: 42 }));
    fixture.detectChanges();

    component.onBackToList();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();

    httpMock.expectNone(startRunUrl(10));
    expect(fixture.debugElement.query(By.directive(EncounterRunView))).toBeFalsy();

    // Drain the still-open refresh so `httpMock.verify()` doesn't fail the test.
    httpMock.expectOne(RUNS_URL).flush([run({ id: 42 })]);
  });

  it('falls back to a full reload (never a stale, still-clickable list) when the post-Back refresh fails', () => {
    setUp();
    flushList([encounter()], [run({ id: 42 })]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run({ id: 42 }));
    fixture.detectChanges();

    component.onBackToList();
    httpMock.expectOne(RUNS_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    // The failed background refresh falls back to `load()`, which gates the whole list behind
    // `loading` -- there is no frame where a row renders clickable against the stale pre-Back data.
    expect(component.loading()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-panel-encounter-row')).toBeFalsy();

    // That fallback load resolving with fresh data (a new run id, 99, for the same encounter) is
    // what a Resume click afterwards correctly targets -- not the stale 42 from before Back.
    flushList([encounter()], [run({ id: 99 })]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectNone(startRunUrl(10));
    httpMock.expectOne(runUrl(99)).flush(run({ id: 99 }));
    fixture.detectChanges();

    const runView = fixture.debugElement.query(By.directive(EncounterRunView));
    expect(runView.componentInstance.runId()).toBe(99);
  });

  it('falls back to the list when the encounter itself is deleted from the run view', () => {
    // Deleting an encounter cascades to its ACTIVE run server-side, so there is genuinely nothing
    // left to show -- this must behave like `completed`, not linger on a run that's gone.
    setUp();
    flushList([encounter()], [run()]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    fixture.debugElement.query(By.directive(EncounterRunView)).componentInstance.encounterDeleted.emit();

    httpMock.expectOne(ENCOUNTERS_URL).flush(encountersPage([]));
    httpMock.expectOne(RUNS_URL).flush([]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(EncounterRunView))).toBeFalsy();
    expect(fixture.nativeElement.querySelector('app-panel-encounter-row')).toBeFalsy();
  });

  it('moves focus to the list heading after the encounter is deleted from the run view', async () => {
    setUp();
    flushList([encounter()], [run()]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    fixture.debugElement.query(By.directive(EncounterRunView)).componentInstance.encounterDeleted.emit();
    httpMock.expectOne(ENCOUNTERS_URL).flush(encountersPage([]));
    httpMock.expectOne(RUNS_URL).flush([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.eb__search-label')).toBe(document.activeElement);
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

  it('moves focus to the list heading once the run completes', async () => {
    setUp();
    flushList([encounter()], [run()]);
    fixture.nativeElement.querySelector('app-panel-encounter-row button').click();
    fixture.detectChanges();
    httpMock.expectOne(runUrl(42)).flush(run());
    fixture.detectChanges();

    fixture.debugElement.query(By.directive(EncounterRunView)).componentInstance.completed.emit();
    httpMock.expectOne(ENCOUNTERS_URL).flush(encountersPage([encounter()]));
    httpMock.expectOne(RUNS_URL).flush([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.eb__search-label')).toBe(document.activeElement);
  });
});
