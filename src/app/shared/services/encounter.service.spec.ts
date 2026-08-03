import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { EncounterService } from './encounter.service';
import { EncounterResponse } from '../models/encounter-api.model';

const baseUrl = 'http://localhost:8080/api/dh/encounters';

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
    spentBattlePoints: 0,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('EncounterService', () => {
  let service: EncounterService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EncounterService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should list encounters with default paging', () => {
    service.getEncounters().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl && r.params.get('page') === '0' && r.params.get('size') === '20',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], currentPage: 0, pageSize: 20, totalElements: 0, totalPages: 0 });
  });

  it('should send withCredentials: true on list', () => {
    service.getEncounters().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], currentPage: 0, pageSize: 20, totalElements: 0, totalPages: 0 });
  });

  it('should include expand param when provided', () => {
    service.getEncounters({ expand: 'environment,adversaryDetails' }).subscribe();

    const req = httpTesting.expectOne(r => r.params.get('expand') === 'environment,adversaryDetails');
    req.flush({ content: [], currentPage: 0, pageSize: 20, totalElements: 0, totalPages: 0 });
  });

  it('should fetch a single encounter by id', () => {
    let result: EncounterResponse | undefined;
    service.getEncounter(5).subscribe(r => (result = r));

    const req = httpTesting.expectOne(`${baseUrl}/5`);
    expect(req.request.method).toBe('GET');
    req.flush(buildEncounterResponse({ id: 5 }));

    expect(result!.id).toBe(5);
  });

  it('should include expand param when fetching a single encounter', () => {
    service.getEncounter(5, 'environment').subscribe();

    const req = httpTesting.expectOne(r => r.url === `${baseUrl}/5` && r.params.get('expand') === 'environment');
    req.flush(buildEncounterResponse({ id: 5 }));
  });

  it('should POST a create request', () => {
    service.createEncounter({ name: 'Goblin Ambush' }).subscribe();

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Goblin Ambush' });
    req.flush(buildEncounterResponse());
  });

  it('should PUT an update request', () => {
    service.updateEncounter(1, { partySize: 5 }).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ partySize: 5 });
    req.flush(buildEncounterResponse());
  });

  it('should DELETE an encounter', () => {
    service.deleteEncounter(1).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST a copy request', () => {
    service.copyEncounter(1).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/1/copy`);
    expect(req.request.method).toBe('POST');
    req.flush(buildEncounterResponse({ id: 2, originalEncounterId: 1 }));
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getEncounters().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
