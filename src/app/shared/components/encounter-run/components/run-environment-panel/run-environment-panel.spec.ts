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

  it('should render the environment stat block once it loads', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.card--type-environment')).toBeTruthy();
  });

  it('should render Impulses and Potential Adversaries alongside the card', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment());
    fixture.detectChanges();

    const details = Array.from<Element>(fixture.nativeElement.querySelectorAll('.run-environment-panel__detail'))
      .map(el => el.textContent?.trim());
    expect(details.some(text => text?.includes('Trap the party'))).toBe(true);
    expect(details.some(text => text?.includes('Skeletons'))).toBe(true);
  });

  it('should not render a detail line when impulses/potentialAdversaries are absent', () => {
    setup();
    fixture.detectChanges();
    httpTesting.expectOne(r => r.url === `${environmentsBaseUrl}/7`).flush(buildEnvironment({ impulses: undefined, potentialAdversaries: undefined }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.run-environment-panel__detail')).toBeFalsy();
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
    expect(fixture.nativeElement.querySelector('.card--type-environment')).toBeTruthy();
  });
});
