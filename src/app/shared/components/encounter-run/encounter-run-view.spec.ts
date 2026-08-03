import { describe, it, expect, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { EncounterRunView } from './encounter-run-view';
import { RunLifecycleActions } from './components/run-lifecycle-actions/run-lifecycle-actions';
import { RunEnvironmentPanel } from './components/run-environment-panel/run-environment-panel';
import { EncounterRunAdversaryResponse, EncounterRunResponse } from '../../models/encounter-run-api.model';
import { AdversaryApiResponse } from '../../models/adversary-api.model';
import { EnvironmentResponse } from '../../models/environment-api.model';

const runsBaseUrl = 'http://localhost:8080/api/dh/encounter-runs';
const environmentsBaseUrl = 'http://localhost:8080/api/dh/environments';

function buildStatBlock(overrides: Partial<AdversaryApiResponse> = {}): AdversaryApiResponse {
  return { id: 10, name: 'Giant Mosquito', tier: 1, adversaryType: 'SKULK', ...overrides };
}

function buildRunAdversary(overrides: Partial<EncounterRunAdversaryResponse> = {}): EncounterRunAdversaryResponse {
  return {
    id: 1,
    adversaryId: 10,
    adversary: buildStatBlock(),
    hitPointsMarked: 0,
    hitPointMax: 3,
    stressMarked: 0,
    stressMax: 2,
    tokens: 0,
    isDefeated: false,
    displayOrder: 0,
    ...overrides,
  };
}

function buildRun(overrides: Partial<EncounterRunResponse> = {}): EncounterRunResponse {
  return {
    id: 5,
    encounterId: 1,
    startedById: 1,
    status: 'ACTIVE',
    startedAt: '2026-01-01T00:00:00Z',
    adversaries: [buildRunAdversary()],
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildEnvironment(overrides: Partial<EnvironmentResponse> = {}): EnvironmentResponse {
  return {
    id: 7,
    name: 'Sundered Ruins',
    tier: 1,
    environmentType: 'EXPLORATION',
    difficulty: 11,
    impulses: 'Trap the party, collapse the ceiling',
    potentialAdversaries: 'Skeletons, a Cave Troll',
    isOfficial: true,
    isPublic: true,
    expansionId: 1,
    features: [],
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('EncounterRunView', () => {
  let fixture: ComponentFixture<EncounterRunView>;
  let httpTesting: HttpTestingController;

  function setup(runId = 5): void {
    TestBed.configureTestingModule({
      imports: [EncounterRunView],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(EncounterRunView);
    fixture.componentRef.setInput('runId', runId);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  function flushRun(run: EncounterRunResponse = buildRun()): void {
    fixture.detectChanges();
    httpTesting.expectOne(`${runsBaseUrl}/${run.id}`).flush(run);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('should instantiate with no GmScreenContext provider -- this is the guard against a campaign dependency creeping back in', () => {
    setup();
    expect(() => flushRun()).not.toThrow();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show a loading state before the run resolves', () => {
    setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-card-skeleton')).toBeTruthy();
    httpTesting.expectOne(`${runsBaseUrl}/5`).flush(buildRun());
  });

  it('should render a visible error state, not a permanent spinner, when the run fails to load', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(`${runsBaseUrl}/5`).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-card-skeleton')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.error-container')).toBeTruthy();
  });

  it('should render the adversary rows once the run loads', () => {
    setup();
    flushRun();

    expect(fixture.nativeElement.querySelector('app-run-adversary-row')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.stat-row__name').textContent.trim()).toBe('Giant Mosquito');
  });

  describe('showHeader', () => {
    it('should render the title and standing count by default', () => {
      setup();
      flushRun();

      expect(fixture.nativeElement.querySelector('.run-view__heading')).toBeTruthy();
    });

    it('should hide the title and standing count when showHeader is false, but keep Complete/Discard', () => {
      setup();
      fixture.componentRef.setInput('showHeader', false);
      flushRun();

      expect(fixture.nativeElement.querySelector('.run-view__heading')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('app-run-lifecycle-actions')).toBeTruthy();
    });
  });

  describe('title', () => {
    it('defaults to "Running Encounter" when no title is supplied', () => {
      setup();
      flushRun();

      expect(fixture.nativeElement.querySelector('.run-view__title').textContent.trim()).toBe('Running Encounter');
    });

    it('renders a caller-supplied title instead', () => {
      setup();
      fixture.componentRef.setInput('title', 'Ambush at the Ford');
      flushRun();

      expect(fixture.nativeElement.querySelector('.run-view__title').textContent.trim()).toBe('Ambush at the Ford');
    });
  });

  describe('standing count', () => {
    it('counts only the adversaries not yet marked defeated', () => {
      setup();
      flushRun(
        buildRun({
          adversaries: [
            buildRunAdversary({ id: 1, isDefeated: false }),
            buildRunAdversary({ id: 2, isDefeated: true }),
            buildRunAdversary({ id: 3, isDefeated: false }),
          ],
        }),
      );

      expect(fixture.nativeElement.querySelector('.run-view__standing').textContent.trim()).toBe('2 of 3 standing');
    });

    it('updates live as an adversary is marked defeated', () => {
      setup();
      flushRun(buildRun({ adversaries: [buildRunAdversary({ id: 1, isDefeated: false, hitPointMax: 3 })] }));
      expect(fixture.nativeElement.querySelector('.run-view__standing').textContent.trim()).toBe('1 of 1 standing');

      // Marking the last HP box is one path to a fresh defeat, alongside the standalone Mark
      // Defeated control in the expanded detail (see `RunAdversaryDetail`'s doc comment) -- this
      // exercises the HP path specifically.
      fixture.nativeElement.querySelector('.stat-row__toggle').click();
      fixture.detectChanges();
      const boxes = fixture.nativeElement.querySelectorAll('.resource-box');
      boxes[2].click();
      fixture.detectChanges();
      httpTesting
        .expectOne(`${runsBaseUrl}/5/adversaries/1`)
        .flush(buildRun({ adversaries: [buildRunAdversary({ id: 1, hitPointMax: 3, hitPointsMarked: 3, isDefeated: true })] }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.run-view__standing').textContent.trim()).toBe('0 of 1 standing');
    });

    it('is omitted when the encounter has no adversaries', () => {
      setup();
      flushRun(buildRun({ adversaries: [] }));

      expect(fixture.nativeElement.querySelector('.run-view__standing')).toBeFalsy();
    });
  });

  describe('density', () => {
    it('should not apply the compact modifier by default', () => {
      setup();
      flushRun();

      const list = fixture.nativeElement.querySelector('.run-view__adversaries');
      expect(list.classList.contains('run-view__adversaries--compact')).toBe(false);
    });

    it('should apply the compact modifier when density is compact', () => {
      setup();
      fixture.componentRef.setInput('density', 'compact');
      flushRun();

      const list = fixture.nativeElement.querySelector('.run-view__adversaries');
      expect(list.classList.contains('run-view__adversaries--compact')).toBe(true);
    });

    it('should render the adversary list as an explicit role="list" container, matching the party-list pattern', () => {
      // A plain div, not a <ul> -- its direct children are component selectors
      // (<app-run-environment-panel>, <app-run-adversary-row>), not <li> elements, which a native
      // <ul> may not contain. See `encounter-run-view.html`'s comment on this element.
      setup();
      flushRun();

      const list = fixture.nativeElement.querySelector('.run-view__adversaries');
      expect(list.tagName).toBe('DIV');
      expect(list.getAttribute('role')).toBe('list');
    });

    it('should give every direct child of the list container role="listitem", so AT can compute list position correctly', () => {
      setup();
      flushRun(
        buildRun({
          environmentId: 7,
          adversaries: [buildRunAdversary({ id: 1 }), buildRunAdversary({ id: 2, adversaryId: 10 })],
        }),
      );
      httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.run-view__adversaries');
      const children = Array.from<Element>(list.children);
      expect(children.length).toBe(3); // the environment panel + 2 adversary rows
      expect(children.every(el => el.getAttribute('role') === 'listitem')).toBe(true);
    });
  });

  describe('marking HP', () => {
    // The HP/Stress pip trackers live in the expanded detail panel now (see `run-adversary-row`'s
    // doc comment for why), so every one of these tests expands the row first -- exactly what a
    // GM has to do in the real app to reach them.
    function expandFirstRow(): void {
      fixture.nativeElement.querySelector('.stat-row__toggle').click();
      fixture.detectChanges();
    }

    it('should PATCH the absolute value, not a delta', () => {
      setup();
      flushRun();
      expandFirstRow();

      const boxes = fixture.nativeElement.querySelectorAll('.resource-box');
      boxes[1].click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ hitPointsMarked: 2 });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 2 })] }));
    });

    it('should send isDefeated: true in the same PATCH when the last HP box is marked', () => {
      setup();
      flushRun();
      expandFirstRow();

      const boxes = fixture.nativeElement.querySelectorAll('.resource-box');
      boxes[2].click(); // hitPointMax is 3
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      expect(req.request.body).toEqual({ hitPointsMarked: 3, isDefeated: true });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 3, isDefeated: true })] }));
    });

    it('should let the GM toggle defeat back off via the Revive action in the expanded detail', () => {
      setup();
      flushRun(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 3, isDefeated: true })] }));
      expandFirstRow();

      const revive = fixture.nativeElement.querySelector('.run-detail__defeat-toggle-btn');
      expect(revive.textContent.trim()).toBe('Revive');
      revive.click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      expect(req.request.body).toEqual({ isDefeated: false });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 3, isDefeated: false })] }));
    });

    it('should let the GM mark an adversary defeated directly, without first maxing out HP -- the standalone control regression', () => {
      // A prior round of trimming removed the standalone "Mark Defeated" control on the (wrong)
      // assumption that marking the last HP box covered every path to a fresh defeat. It doesn't:
      // a GM narrating a surrender or a retreat needs to mark defeat without touching HP at all.
      setup();
      flushRun(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 1, hitPointMax: 5, isDefeated: false })] }));
      expandFirstRow();

      const markDefeated = fixture.nativeElement.querySelector('.run-detail__defeat-toggle-btn');
      expect(markDefeated.textContent.trim()).toBe('Mark Defeated');
      markDefeated.click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      // The PATCH carries only isDefeated -- hitPointsMarked is never touched by this control.
      expect(req.request.body).toEqual({ isDefeated: true });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 1, hitPointMax: 5, isDefeated: true })] }));
      fixture.detectChanges();

      // The HP tracker's marked count is exactly what it was before -- untouched by the toggle.
      expect(fixture.nativeElement.querySelectorAll('.resource-box--marked').length).toBe(1);
    });

    it('should roll back and surface an error when the PATCH fails', () => {
      setup();
      flushRun();
      expandFirstRow();

      const boxes = fixture.nativeElement.querySelectorAll('.resource-box');
      boxes[1].click();
      fixture.detectChanges();

      // Optimistic update applied before the server responds.
      expect(fixture.nativeElement.querySelectorAll('.resource-box--marked').length).toBeGreaterThan(0);

      httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`).flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.resource-box--marked').length).toBe(0);
      const error = fixture.nativeElement.querySelector('.run-view__error');
      expect(error).toBeTruthy();
      expect(error.getAttribute('role')).toBe('alert');
    });
  });

  describe('tokens', () => {
    it('should increment from 0 with no maximum', () => {
      setup();
      flushRun(buildRun({ adversaries: [buildRunAdversary({ tokens: 5 })] }));

      // The +/- controls live in the expanded detail now -- the row itself only shows the count.
      fixture.nativeElement.querySelector('.stat-row__toggle').click();
      fixture.detectChanges();
      const [, incrementBtn] = fixture.nativeElement.querySelectorAll('.run-detail__token-btn');
      incrementBtn.click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      expect(req.request.body).toEqual({ tokens: 6 });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ tokens: 6 })] }));
    });
  });

  // Complete/Reset/Delete Encounter's own behaviour (POST/DELETE/start, rollback-free error
  // handling, the confirm dialog and inline trashcan) is `RunLifecycleActions`'s own concern and
  // is covered in its spec. This just checks the parent wires it up: the right ids go in, and its
  // outputs reach the parent's own outputs/state correctly.
  describe('RunLifecycleActions wiring', () => {
    it('should pass runId, encounterId, encounterLabel, campaignId, and editHref to the lifecycle actions', () => {
      setup();
      fixture.componentRef.setInput('title', 'Ambush at the Ford');
      fixture.componentRef.setInput('editHref', '/encounters/12/edit');
      flushRun(buildRun({ encounterId: 12, campaignId: 42 }));

      const actions = fixture.debugElement.query(By.directive(RunLifecycleActions));
      expect(actions).toBeTruthy();
      expect(actions.componentInstance.runId()).toBe(5);
      expect(actions.componentInstance.encounterId()).toBe(12);
      expect(actions.componentInstance.encounterLabel()).toBe('Ambush at the Ford');
      expect(actions.componentInstance.campaignId()).toBe(42);
      expect(actions.componentInstance.editHref()).toBe('/encounters/12/edit');
    });

    it('should forward the completed event', () => {
      setup();
      flushRun();

      let completedCount = 0;
      fixture.componentInstance.completed.subscribe(() => completedCount++);

      const actions = fixture.debugElement.query(By.directive(RunLifecycleActions));

      // Triggers the child's own output directly rather than driving its full click/HTTP flow --
      // that flow is RunLifecycleActions's own spec's concern; this only checks the binding.
      actions.componentInstance.completed.emit();
      expect(completedCount).toBe(1);
    });

    it('should forward the encounterDeleted event', () => {
      setup();
      flushRun();

      let deletedCount = 0;
      fixture.componentInstance.encounterDeleted.subscribe(() => deletedCount++);

      const actions = fixture.debugElement.query(By.directive(RunLifecycleActions));
      actions.componentInstance.encounterDeleted.emit();
      expect(deletedCount).toBe(1);
    });

    it('should swap in the fresh run when reset emits, without a second getRun round trip', () => {
      setup();
      flushRun(buildRun({ adversaries: [buildRunAdversary({ id: 1, hitPointsMarked: 2, isDefeated: true })] }));

      const actions = fixture.debugElement.query(By.directive(RunLifecycleActions));
      const freshRun = buildRun({
        id: 20,
        adversaries: [buildRunAdversary({ id: 1, hitPointsMarked: 0, isDefeated: false })],
      });
      actions.componentInstance.runReset.emit(freshRun);
      fixture.detectChanges();

      expect(fixture.componentInstance.run()).toEqual(freshRun);
      expect(fixture.nativeElement.querySelector('.run-view__standing').textContent.trim()).toBe('1 of 1 standing');
    });
  });

  // The environment fetch/render/error/retry behaviour is `RunEnvironmentPanel`'s own concern and
  // is covered in its spec. This just checks the parent renders it (or not) with the right input.
  describe('RunEnvironmentPanel wiring', () => {
    it('should render the environment panel with the run environmentId when the run has one', () => {
      setup();
      flushRun(buildRun({ environmentId: 7 }));

      const panel = fixture.debugElement.query(By.directive(RunEnvironmentPanel));
      expect(panel).toBeTruthy();
      expect(panel.componentInstance.environmentId()).toBe(7);

      // Draining the panel's own HTTP call (triggered by its own input effect) keeps this spec's
      // httpTesting.verify() clean -- asserting on the request itself is RunEnvironmentPanel's
      // own spec's concern.
      httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
    });

    it('should show a plain empty state, not a faded panel, when the run has no environment', () => {
      setup();
      flushRun();

      expect(fixture.nativeElement.querySelector('app-run-environment-panel')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.run-view__no-environment').textContent.trim()).toBe(
        'No environment set for this encounter.',
      );
    });

    it('should pass density through to the environment row, matching the adversary rows', () => {
      setup();
      fixture.componentRef.setInput('density', 'compact');
      flushRun(buildRun({ environmentId: 7 }));

      const panel = fixture.debugElement.query(By.directive(RunEnvironmentPanel));
      expect(panel.componentInstance.density()).toBe('compact');

      httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
    });

    it('should render the environment as the first row in the shared list, alongside the adversaries', () => {
      setup();
      flushRun(buildRun({ environmentId: 7 }));
      httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('.run-view__adversaries');
      const firstRow = list.querySelector('.stat-row__item');
      expect(firstRow.classList.contains('stat-row__item--environment')).toBe(true);
    });
  });
});
