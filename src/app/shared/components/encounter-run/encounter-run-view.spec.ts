import { describe, it, expect, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
    expect(fixture.nativeElement.querySelector('.adversary-card__name').textContent.trim()).toBe('Giant Mosquito');
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
      flushRun(buildRun({ adversaries: [buildRunAdversary({ id: 1, isDefeated: false })] }));
      expect(fixture.nativeElement.querySelector('.run-view__standing').textContent.trim()).toBe('1 of 1 standing');

      const defeatBtn = fixture.nativeElement.querySelector('.run-row__defeat-btn');
      defeatBtn.click();
      fixture.detectChanges();
      httpTesting
        .expectOne(`${runsBaseUrl}/5/adversaries/1`)
        .flush(buildRun({ adversaries: [buildRunAdversary({ id: 1, isDefeated: true })] }));
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
  });

  describe('marking HP', () => {
    it('should PATCH the absolute value, not a delta', () => {
      setup();
      flushRun();

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

      const boxes = fixture.nativeElement.querySelectorAll('.resource-box');
      boxes[2].click(); // hitPointMax is 3
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      expect(req.request.body).toEqual({ hitPointsMarked: 3, isDefeated: true });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 3, isDefeated: true })] }));
    });

    it('should let the GM toggle defeat back off', () => {
      setup();
      flushRun(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 3, isDefeated: true })] }));

      const revive = fixture.nativeElement.querySelector('.run-row__defeat-btn');
      expect(revive.textContent.trim()).toBe('Revive');
      revive.click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      expect(req.request.body).toEqual({ isDefeated: false });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ hitPointsMarked: 3, isDefeated: false })] }));
    });

    it('should roll back and surface an error when the PATCH fails', () => {
      setup();
      flushRun();

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

      const [, incrementBtn] = fixture.nativeElement.querySelectorAll('.run-row__token-btn');
      incrementBtn.click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/adversaries/1`);
      expect(req.request.body).toEqual({ tokens: 6 });
      req.flush(buildRun({ adversaries: [buildRunAdversary({ tokens: 6 })] }));
    });
  });

  // Complete/Discard's own behaviour (POST/DELETE, rollback-free error handling, the confirm
  // dialog) is `RunLifecycleActions`'s own concern and is covered in its spec. This just checks
  // the parent wires it up: the right runId goes in, and its `completed` reaches the parent's own
  // `completed` output.
  describe('RunLifecycleActions wiring', () => {
    it('should pass the run id to the lifecycle actions and forward its completed event', () => {
      setup();
      flushRun();

      let completedCount = 0;
      fixture.componentInstance.completed.subscribe(() => completedCount++);

      const actions = fixture.debugElement.query(By.directive(RunLifecycleActions));
      expect(actions).toBeTruthy();
      expect(actions.componentInstance.runId()).toBe(5);

      // Triggers the child's own output directly rather than driving its full click/HTTP flow --
      // that flow is RunLifecycleActions's own spec's concern; this only checks the binding.
      actions.componentInstance.completed.emit();
      expect(completedCount).toBe(1);
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

    it('should not render the environment panel when the run has no environment', () => {
      setup();
      flushRun();

      expect(fixture.nativeElement.querySelector('app-run-environment-panel')).toBeFalsy();
    });
  });
});
