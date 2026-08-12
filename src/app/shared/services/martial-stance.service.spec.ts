import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MartialStanceService } from './martial-stance.service';
import { MartialStanceResponse } from '../models/martial-stance-api.model';
import { PaginatedResponse } from '../models/api.model';

const baseUrl = 'http://localhost:8080/api/dh/martial-stances';

function buildMartialStanceResponse(overrides: Partial<MartialStanceResponse> = {}): MartialStanceResponse {
  return {
    id: 1,
    name: 'Aggressive Stance',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: MartialStanceResponse[]): PaginatedResponse<MartialStanceResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('MartialStanceService', () => {
  let service: MartialStanceService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MartialStanceService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAllMartialStances', () => {
    it('should call the correct URL with size=100 and expand=features', () => {
      service.getAllMartialStances().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl &&
          r.params.get('page') === '0' &&
          r.params.get('size') === '100' &&
          r.params.get('expand') === 'features',
      );
      expect(req.request.method).toBe('GET');
      req.flush(buildPaginatedResponse([]));
    });
  });

  describe('getMartialStancesPaginated', () => {
    it('should call correct URL with default query params', () => {
      service.getMartialStancesPaginated().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl &&
          r.params.get('page') === '0' &&
          r.params.get('size') === '20' &&
          r.params.get('expand') === 'features',
      );
      expect(req.request.method).toBe('GET');
      req.flush(buildPaginatedResponse([]));
    });

    it('should map response to PaginatedCards', () => {
      const mockResponse = buildPaginatedResponse([buildMartialStanceResponse({ name: 'Aggressive Stance' })]);

      let result: { cards: { name: string }[] } | undefined;
      service.getMartialStancesPaginated().subscribe(r => (result = r));

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.flush(mockResponse);

      expect(result?.cards).toHaveLength(1);
      expect(result?.cards[0].name).toBe('Aggressive Stance');
    });
  });
});
