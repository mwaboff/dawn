import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TransformationCardService } from './transformation-card.service';
import { TransformationCardResponse } from '../models/transformation-card-api.model';
import { PaginatedResponse } from '../models/api.model';

const baseUrl = 'http://localhost:8080/api/dh/transformation-cards';

function buildTransformationCardResponse(
  overrides: Partial<TransformationCardResponse> = {},
): TransformationCardResponse {
  return {
    id: 1,
    name: 'Wolf Form',
    expansionId: 1,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(
  content: TransformationCardResponse[],
): PaginatedResponse<TransformationCardResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('TransformationCardService', () => {
  let service: TransformationCardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransformationCardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAllTransformationCards', () => {
    it('should call the correct URL with size=100 and expand=features,questions', () => {
      service.getAllTransformationCards().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl &&
          r.params.get('page') === '0' &&
          r.params.get('size') === '100' &&
          r.params.get('expand') === 'features,questions',
      );
      expect(req.request.method).toBe('GET');
      req.flush(buildPaginatedResponse([]));
    });
  });

  describe('getTransformationCardsPaginated', () => {
    it('should call correct URL with default query params', () => {
      service.getTransformationCardsPaginated().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl &&
          r.params.get('page') === '0' &&
          r.params.get('size') === '20' &&
          r.params.get('expand') === 'features,questions',
      );
      expect(req.request.method).toBe('GET');
      req.flush(buildPaginatedResponse([]));
    });

    it('should map response to PaginatedCards', () => {
      const mockResponse = buildPaginatedResponse([buildTransformationCardResponse({ name: 'Wolf Form' })]);

      let result: { cards: { name: string }[] } | undefined;
      service.getTransformationCardsPaginated().subscribe(r => (result = r));

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.flush(mockResponse);

      expect(result?.cards).toHaveLength(1);
      expect(result?.cards[0].name).toBe('Wolf Form');
    });
  });
});
