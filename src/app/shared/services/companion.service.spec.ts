import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { CompanionService } from './companion.service';
import { CompanionApiResponse } from '../models/companion-api.model';

const baseUrl = 'http://localhost:8080/api/dh/companions';

function buildCompanionResponse(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 1,
    characterSheetId: 1,
    name: 'Forest Wolf',
    evasion: 10,
    baseEvasion: 10,
    attackName: 'Bite',
    attackRange: 'MELEE',
    baseAttackRange: 'MELEE',
    damageDice: 'D6',
    baseDamageDice: 'D6',
    attackDiceCount: 1,
    damageType: 'PHYSICAL',
    stressMax: 3,
    baseStressMax: 3,
    stressMarked: 0,
    outOfScene: false,
    origin: 'SUBCLASS_FEATURE',
    advancesOnLevelUp: true,
    trainings: [],
    remainingByOption: {},
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: CompanionApiResponse[]) {
  return {
    content,
    currentPage: 0,
    pageSize: 100,
    totalElements: content.length,
    totalPages: 1,
  };
}

describe('CompanionService', () => {
  let service: CompanionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getCompanions', () => {
    it('sends characterSheetId as a required query param', () => {
      service.getCompanions(7).subscribe();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.params.get('characterSheetId')).toBe('7');
      req.flush(buildPaginatedResponse([]));
    });

    it('requests the experiences expand', () => {
      service.getCompanions(7).subscribe();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.params.get('expand')).toBe('experiences');
      req.flush(buildPaginatedResponse([]));
    });

    it('sends withCredentials: true', () => {
      service.getCompanions(7).subscribe();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildPaginatedResponse([]));
    });

    it('returns the response content array', () => {
      const mockData = [buildCompanionResponse({ id: 1 }), buildCompanionResponse({ id: 2, name: 'Shadow Cat' })];
      let result: CompanionApiResponse[] | undefined;

      service.getCompanions(7).subscribe(data => (result = data));

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.flush(buildPaginatedResponse(mockData));

      expect(result).toHaveLength(2);
      expect(result![1].name).toBe('Shadow Cat');
    });

    it('propagates HTTP errors', () => {
      let error: HttpErrorResponse | undefined;
      service.getCompanions(7).subscribe({ error: e => (error = e) });

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });

  describe('createCompanion', () => {
    it('POSTs to the base endpoint', () => {
      service.createCompanion({
        characterSheetId: 7,
        name: 'Wolf',
        attackName: 'Bite',
        attackRange: 'MELEE',
        damageDice: 'D6',
      }).subscribe();

      const req = httpTesting.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      req.flush(buildCompanionResponse());
    });
  });

  describe('updateCompanion', () => {
    it('PUTs to the companion endpoint', () => {
      service.updateCompanion(1, { stressMarked: 2 }).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ stressMarked: 2 });
      req.flush(buildCompanionResponse({ stressMarked: 2 }));
    });
  });

  describe('deleteCompanion', () => {
    it('DELETEs the companion endpoint', () => {
      service.deleteCompanion(1).subscribe();

      const req = httpTesting.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
