import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { EncounterRunService } from './encounter-run.service';
import { EncounterRunResponse } from '../models/encounter-run-api.model';

const encountersBaseUrl = 'http://localhost:8080/api/dh/encounters';
const runsBaseUrl = 'http://localhost:8080/api/dh/encounter-runs';

function buildRunResponse(overrides: Partial<EncounterRunResponse> = {}): EncounterRunResponse {
  return {
    id: 1,
    encounterId: 5,
    startedById: 12,
    status: 'ACTIVE',
    startedAt: '2026-08-02T21:00:00',
    adversaries: [],
    createdAt: '2026-08-02T21:00:00',
    lastModifiedAt: '2026-08-02T21:00:00',
    ...overrides,
  };
}

describe('EncounterRunService', () => {
  let service: EncounterRunService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EncounterRunService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('startRun', () => {
    it('should POST to the source encounter and send an empty body when no campaignId is given', () => {
      service.startRun(5).subscribe();

      const req = httpTesting.expectOne(`${encountersBaseUrl}/5/runs`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(buildRunResponse());
    });

    it('should send an empty body when called with an explicitly empty request', () => {
      service.startRun(5, {}).subscribe();

      const req = httpTesting.expectOne(`${encountersBaseUrl}/5/runs`);
      expect(req.request.body).toEqual({});
      req.flush(buildRunResponse());
    });

    it('should include campaignId in the body when provided', () => {
      service.startRun(5, { campaignId: 3 }).subscribe();

      const req = httpTesting.expectOne(`${encountersBaseUrl}/5/runs`);
      expect(req.request.body).toEqual({ campaignId: 3 });
      req.flush(buildRunResponse({ campaignId: 3 }));
    });

    it('should send withCredentials: true', () => {
      service.startRun(5).subscribe();

      const req = httpTesting.expectOne(`${encountersBaseUrl}/5/runs`);
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildRunResponse());
    });

    it('should return the created run', () => {
      let result: EncounterRunResponse | undefined;
      service.startRun(5).subscribe(r => (result = r));

      const req = httpTesting.expectOne(`${encountersBaseUrl}/5/runs`);
      req.flush(buildRunResponse({ id: 9 }));

      expect(result!.id).toBe(9);
    });
  });

  describe('getRun', () => {
    it('should GET a single run by id', () => {
      let result: EncounterRunResponse | undefined;
      service.getRun(1).subscribe(r => (result = r));

      const req = httpTesting.expectOne(`${runsBaseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(buildRunResponse({ id: 1 }));

      expect(result!.id).toBe(1);
    });

    it('should send withCredentials: true', () => {
      service.getRun(1).subscribe();

      const req = httpTesting.expectOne(`${runsBaseUrl}/1`);
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildRunResponse());
    });
  });

  describe('getRuns', () => {
    it('should GET the list endpoint with no query params when no filters are given', () => {
      service.getRuns().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === runsBaseUrl && !r.params.has('status') && !r.params.has('campaignId'),
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should include the status param when provided', () => {
      service.getRuns({ status: 'ACTIVE' }).subscribe();

      const req = httpTesting.expectOne(r => r.url === runsBaseUrl && r.params.get('status') === 'ACTIVE');
      req.flush([]);
    });

    it('should omit the status param when not provided', () => {
      service.getRuns({ campaignId: 3 }).subscribe();

      const req = httpTesting.expectOne(r => r.url === runsBaseUrl);
      expect(req.request.params.has('status')).toBe(false);
      req.flush([]);
    });

    it('should include the campaignId param when provided', () => {
      service.getRuns({ campaignId: 3 }).subscribe();

      const req = httpTesting.expectOne(r => r.url === runsBaseUrl && r.params.get('campaignId') === '3');
      req.flush([]);
    });

    it('should omit the campaignId param when not provided, to list the caller\'s own runs', () => {
      service.getRuns({ status: 'ACTIVE' }).subscribe();

      const req = httpTesting.expectOne(r => r.url === runsBaseUrl);
      expect(req.request.params.has('campaignId')).toBe(false);
      req.flush([]);
    });

    it('should return the plain array response, not a paginated wrapper', () => {
      let result: EncounterRunResponse[] | undefined;
      service.getRuns().subscribe(r => (result = r));

      const req = httpTesting.expectOne(r => r.url === runsBaseUrl);
      req.flush([buildRunResponse({ id: 1 }), buildRunResponse({ id: 2 })]);

      expect(result).toHaveLength(2);
    });
  });

  describe('updateAdversary', () => {
    it('should PATCH the adversary instance with the full body when all fields are given', () => {
      service
        .updateAdversary(1, 2, {
          hitPointsMarked: 4,
          stressMarked: 2,
          tokens: 1,
          isDefeated: false,
          note: 'Flanking',
        })
        .subscribe();

      const req = httpTesting.expectOne(`${runsBaseUrl}/1/adversaries/2`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        hitPointsMarked: 4,
        stressMarked: 2,
        tokens: 1,
        isDefeated: false,
        note: 'Flanking',
      });
      req.flush(buildRunResponse());
    });

    it('should only send the provided fields on a partial update', () => {
      service.updateAdversary(1, 2, { hitPointsMarked: 4 }).subscribe();

      const req = httpTesting.expectOne(`${runsBaseUrl}/1/adversaries/2`);
      expect(req.request.body).toEqual({ hitPointsMarked: 4 });
      req.flush(buildRunResponse());
    });

    it('should send tokens alone as an absolute value on a partial update', () => {
      service.updateAdversary(1, 2, { tokens: 3 }).subscribe();

      const req = httpTesting.expectOne(`${runsBaseUrl}/1/adversaries/2`);
      expect(req.request.body).toEqual({ tokens: 3 });
      req.flush(buildRunResponse());
    });

    it('should send tokens alongside other provided fields', () => {
      service.updateAdversary(1, 2, { tokens: 2, hitPointsMarked: 1 }).subscribe();

      const req = httpTesting.expectOne(`${runsBaseUrl}/1/adversaries/2`);
      expect(req.request.body).toEqual({ tokens: 2, hitPointsMarked: 1 });
      req.flush(buildRunResponse());
    });

    it('should return the full updated run', () => {
      let result: EncounterRunResponse | undefined;
      service.updateAdversary(1, 2, { isDefeated: true }).subscribe(r => (result = r));

      const req = httpTesting.expectOne(`${runsBaseUrl}/1/adversaries/2`);
      req.flush(buildRunResponse({ id: 1 }));

      expect(result!.id).toBe(1);
    });
  });

  describe('completeRun', () => {
    it('should POST to the complete endpoint', () => {
      service.completeRun(1).subscribe();

      const req = httpTesting.expectOne(`${runsBaseUrl}/1/complete`);
      expect(req.request.method).toBe('POST');
      req.flush(buildRunResponse({ status: 'COMPLETED', endedAt: '2026-08-02T22:00:00' }));
    });

    it('should return the completed run', () => {
      let result: EncounterRunResponse | undefined;
      service.completeRun(1).subscribe(r => (result = r));

      const req = httpTesting.expectOne(`${runsBaseUrl}/1/complete`);
      req.flush(buildRunResponse({ status: 'COMPLETED' }));

      expect(result!.status).toBe('COMPLETED');
    });
  });

  describe('deleteRun', () => {
    it('should DELETE a run and emit null on a 204 flush', () => {
      let result: void | null | undefined;
      let completed = false;
      service.deleteRun(1).subscribe({
        next: r => (result = r),
        complete: () => (completed = true),
      });

      const req = httpTesting.expectOne(`${runsBaseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(result).toBeNull();
      expect(completed).toBe(true);
    });
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getRun(1).subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(`${runsBaseUrl}/1`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
