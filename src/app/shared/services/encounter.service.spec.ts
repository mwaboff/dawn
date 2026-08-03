import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { EncounterService, MAX_OWN_ENCOUNTER_PAGES } from './encounter.service';
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

  it('should include creatorId param when provided', () => {
    service.getEncounters({ creatorId: 42 }).subscribe();

    const req = httpTesting.expectOne(r => r.params.get('creatorId') === '42');
    req.flush({ content: [], currentPage: 0, pageSize: 20, totalElements: 0, totalPages: 0 });
  });

  it('should omit creatorId param when not provided', () => {
    service.getEncounters().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('creatorId')).toBe(false);
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

  describe('getOwnEncounters', () => {
    it('should request page 0 with a 100-size page and the given creatorId', () => {
      let result: EncounterResponse[] | undefined;
      service.getOwnEncounters(42).subscribe(r => (result = r));

      const req = httpTesting.expectOne(
        r => r.params.get('page') === '0' && r.params.get('size') === '100' && r.params.get('creatorId') === '42',
      );
      req.flush({
        content: [buildEncounterResponse({ id: 1, creatorId: 42 })],
        currentPage: 0, pageSize: 100, totalElements: 1, totalPages: 1,
      });

      expect(result?.map(e => e.id)).toEqual([1]);
    });

    it('should rely on the server to scope results to creatorId, not filter client-side', () => {
      // The server now does the narrowing (creatorId composes as an AND on top of the usual
      // visibility rule); this asserts the result passes through as-is rather than being
      // re-filtered, since a client-side filter here would be a second, driftable copy of the
      // same rule the server already enforces.
      let result: EncounterResponse[] | undefined;
      service.getOwnEncounters(42).subscribe(r => (result = r));

      httpTesting.expectOne(r => r.params.get('creatorId') === '42').flush({
        content: [buildEncounterResponse({ id: 1, creatorId: 42 })],
        currentPage: 0, pageSize: 100, totalElements: 1, totalPages: 1,
      });

      expect(result?.map(e => e.id)).toEqual([1]);
    });

    it('should fetch every page and merge the results when the response spans multiple pages', () => {
      let result: EncounterResponse[] | undefined;
      service.getOwnEncounters(42).subscribe(r => (result = r));

      const firstReq = httpTesting.expectOne(r => r.params.get('page') === '0');
      firstReq.flush({
        content: [buildEncounterResponse({ id: 1, creatorId: 42 })],
        currentPage: 0, pageSize: 100, totalElements: 150, totalPages: 2,
      });

      const secondReq = httpTesting.expectOne(r => r.params.get('page') === '1');
      secondReq.flush({
        content: [buildEncounterResponse({ id: 2, creatorId: 42 })],
        currentPage: 1, pageSize: 100, totalElements: 150, totalPages: 2,
      });

      expect(result?.map(e => e.id)).toEqual([1, 2]);
    });

    it('should not fetch a second page when the first page is already the last', () => {
      service.getOwnEncounters(42).subscribe();

      httpTesting.expectOne(r => r.params.get('page') === '0').flush({
        content: [buildEncounterResponse({ id: 1, creatorId: 42 })],
        currentPage: 0, pageSize: 100, totalElements: 1, totalPages: 1,
      });

      httpTesting.expectNone(r => r.params.get('page') === '1');
    });

    it('should treat a malformed (non-finite) totalPages as the last page instead of recursing forever', () => {
      let result: EncounterResponse[] | undefined;
      service.getOwnEncounters(42).subscribe(r => (result = r));

      httpTesting.expectOne(r => r.params.get('page') === '0').flush({
        content: [buildEncounterResponse({ id: 1, creatorId: 42 })],
        currentPage: 0, pageSize: 100, totalElements: 1, totalPages: undefined as unknown as number,
      });

      httpTesting.expectNone(r => r.params.get('page') === '1');
      expect(result?.map(e => e.id)).toEqual([1]);
    });

    it('should stop at the page safety cap and log an error rather than recurse indefinitely', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      let result: EncounterResponse[] | undefined;
      service.getOwnEncounters(42).subscribe(r => (result = r));

      // The server insists there are far more pages than the cap allows on every page fetched.
      for (let page = 0; page < MAX_OWN_ENCOUNTER_PAGES; page++) {
        httpTesting.expectOne(r => r.params.get('page') === String(page)).flush({
          content: [buildEncounterResponse({ id: page + 1, creatorId: 42 })],
          currentPage: page, pageSize: 100, totalElements: 100_000, totalPages: 9999,
        });
      }

      httpTesting.expectNone(r => r.params.get('page') === String(MAX_OWN_ENCOUNTER_PAGES));
      expect(result?.length).toBe(MAX_OWN_ENCOUNTER_PAGES);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain(`${MAX_OWN_ENCOUNTER_PAGES}-page safety cap`);

      errorSpy.mockRestore();
    });
  });
});
