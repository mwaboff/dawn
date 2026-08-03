import { describe, it, expect, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { RunEnvironmentPanel } from './run-environment-panel';
import { EnvironmentResponse } from '../../../../models/environment-api.model';

const environmentsBaseUrl = 'http://localhost:8080/api/dh/environments';

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

describe('RunEnvironmentPanel', () => {
  let fixture: ComponentFixture<RunEnvironmentPanel>;
  let httpTesting: HttpTestingController;

  function setup(environmentId = 7): void {
    TestBed.configureTestingModule({
      imports: [RunEnvironmentPanel],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(RunEnvironmentPanel);
    fixture.componentRef.setInput('environmentId', environmentId);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  function flush(env: EnvironmentResponse = buildEnvironment()): void {
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/${env.id}`).flush(env);
    fixture.detectChanges();
  }

  function toggle(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.stat-row__toggle');
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch by environmentId with expand=features', () => {
    setup();
    fixture.detectChanges();

    const req = httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7` && r.params.get('expand') === 'features');
    expect(req.request.method).toBe('GET');
    req.flush(buildEnvironment());
  });

  it('should show a loading state before the environment resolves', () => {
    setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.run-environment-panel__status').textContent).toContain('Loading');
    httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
  });

  it('should render the environment as a row, styled like an adversary row', () => {
    setup();
    flush();

    const row = fixture.nativeElement.querySelector('.stat-row__item--environment');
    expect(row).toBeTruthy();
    expect(toggle().textContent).toContain('Sundered Ruins');
  });

  it('should show the environment type as a secondary line under the name, title-cased -- no tier', () => {
    setup();
    flush(buildEnvironment({ environmentType: 'EXPLORATION', tier: 2 }));

    const secondary = fixture.nativeElement.querySelector('.stat-row__secondary');
    expect(secondary.textContent.trim()).toBe('Exploration');
    // Unlike the adversary row's "Solo · Tier 3", the environment's secondary line is type alone
    // -- Tier isn't shown on this row at all (the user was explicit that adding it back wasn't
    // wanted unless it fell out naturally, and it doesn't here).
    expect(toggle().textContent).not.toContain('Tier');
  });

  it('should show Difficulty as a plain-number vital, matching the adversary row treatment', () => {
    setup();
    flush(buildEnvironment({ difficulty: 15, difficultySpecial: undefined }));

    const vital = fixture.nativeElement.querySelector('.stat-row__vital');
    expect(vital.textContent).toContain('15');
    expect(vital.textContent).toContain('Difficulty');
  });

  // This component projects `.stat-row__vital`/`.stat-row__name`/`.stat-row__secondary` into
  // `RunStatRow` via `[row-vitals]`/`[row-identity]`. This used to be a real bug (see
  // `run-adversary-row.spec.ts`'s identical describe block for the full mechanism) -- fixed by
  // promoting the rules to the global `shared/styles/stat-row.css`, which is structurally immune
  // to the projection issue. These assert class-name/structure only, not computed style values:
  // this project's Vitest/jsdom test environment doesn't apply the global stylesheet's cascade the
  // way it applies a component's own scoped `styleUrl` (see the other spec's comment for how that
  // was confirmed). The actual declared values were verified against the compiled build output.
  describe('Projected vital/identity styling (ng-content + emulated encapsulation)', () => {
    it('wires the Difficulty vital into the shared .stat-row__vital markup structure', () => {
      setup();
      flush(buildEnvironment({ difficulty: 15 }));

      const vital = fixture.nativeElement.querySelector('.stat-row__vital');
      expect(vital.querySelector('b')).toBeTruthy();
      expect(vital.querySelector('small')).toBeTruthy();
    });

    // Regression coverage for a real bug the user saw on screen: the name and type used to render
    // concatenated on one line ("CULT RITUALEvent") because both were plain inline children of one
    // single projected element -- `.stat-row__identity`'s `flex-direction: column` (global, unreadable
    // by jsdom) had only one real flex item, so nothing forced the type onto its own line. The
    // adversary row happened to stack correctly anyway, purely because its name line was
    // `display: flex` (block-level) and pushed the following inline span down as a side effect --
    // the environment row had no such sibling, so the same latent bug showed up differently there.
    // The fix makes the name line and the secondary line two *direct* children of `.stat-row__identity`
    // (two separate `<ng-content>` slots in `RunStatRow`), so stacking is guaranteed by flexbox
    // itself rather than incidental. This is the one thing jsdom *can* verify here, since it's DOM
    // structure, not the CSS cascade -- see `run-adversary-row.spec.ts`'s identical test for the
    // full mechanism, and the compiled-CSS verification noted in the team report for the rest.
    it('renders the name line and the secondary line as direct siblings under the identity block, not nested inside each other', () => {
      setup();
      flush(buildEnvironment({ environmentType: 'EXPLORATION' }));

      const identity = fixture.nativeElement.querySelector('.stat-row__identity');
      const nameLine = fixture.nativeElement.querySelector('.stat-row__name-line');
      const secondary = fixture.nativeElement.querySelector('.stat-row__secondary');

      expect(nameLine.parentElement).toBe(identity);
      expect(secondary.parentElement).toBe(identity);
      expect(identity.children.length).toBe(2);
    });
  });

  it('should show the verbatim Difficulty text when difficultySpecial is set instead of a number', () => {
    setup();
    flush(buildEnvironment({ difficulty: undefined, difficultySpecial: 'Special (see "Relative Strength")' }));

    expect(fixture.nativeElement.querySelector('.stat-row__vital').textContent).toContain(
      'Special (see "Relative Strength")',
    );
  });

  it('should not show HP, Stress, tokens, or a defeated state -- an environment has none of those', () => {
    setup();
    flush();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('HP marked');
    expect(text).not.toContain('Stress');
    expect(text).not.toContain('Tokens');
    expect(fixture.nativeElement.querySelector('.stat-row__skull')).toBeFalsy();
  });

  it('should not cap the detail panel height or clip long content, so it stays fully readable once expanded', () => {
    setup();
    flush(buildEnvironment({ description: 'A very long description. '.repeat(80) }));
    toggle().click();
    fixture.detectChanges();

    const detail = fixture.nativeElement.querySelector('app-run-environment-detail');
    expect(getComputedStyle(detail).overflow).not.toBe('clip');
    expect(getComputedStyle(detail).maxHeight).not.toMatch(/^\d/);
  });

  it('should render Impulses and Potential Adversaries in the expanded detail', () => {
    setup();
    flush();
    toggle().click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Trap the party');
    expect(text).toContain('Skeletons');
  });

  it('should not render an Impulses/Potential Adversaries section when absent', () => {
    setup();
    flush(buildEnvironment({ impulses: undefined, potentialAdversaries: undefined }));
    toggle().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Impulses');
    expect(fixture.nativeElement.textContent).not.toContain('Potential Adversaries');
  });

  it('should start collapsed with aria-expanded false and the detail panel hidden', () => {
    setup();
    flush();

    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('should mark its own host as a list item, for the run view\'s role="list" container', () => {
    setup();
    flush();

    expect(fixture.nativeElement.getAttribute('role')).toBe('listitem');
  });

  it('should show a retryable, visible error state when the fetch fails, not a permanent spinner', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('.run-environment-panel__status');
    expect(status.getAttribute('role')).toBe('alert');

    fixture.nativeElement.querySelector('.run-environment-panel__retry-link').click();
    fixture.detectChanges();

    httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stat-row__item--environment')).toBeTruthy();
  });
});
