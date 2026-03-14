import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { AncestryService } from './ancestry.service';
import { AncestryCardResponse } from '../models/ancestry-api.model';
import { PaginatedResponse } from '../models/api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

function buildAncestryCardResponse(overrides: Partial<AncestryCardResponse> = {}): AncestryCardResponse {
  return {
    id: 1,
    name: 'Clank',
    description: 'Clanks are sentient mechanical beings',
    cardType: 'ANCESTRY',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: AncestryCardResponse[]): PaginatedResponse<AncestryCardResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('AncestryService', () => {
  let service: AncestryService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/cards/ancestry';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AncestryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with default query params', () => {
    service.getAncestries().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20' &&
        r.params.get('expand') === 'expansion,features,costTags',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should call correct URL with custom page and size', () => {
    service.getAncestries(2, 50).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '2' &&
        r.params.get('size') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getAncestries().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should map response content through mapper', () => {
    const mockResponse = buildPaginatedResponse([
      buildAncestryCardResponse({ id: 1, name: 'Clank' }),
      buildAncestryCardResponse({ id: 2, name: 'Firbolg' }),
    ]);

    let result: CardData[] | undefined;
    service.getAncestries().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe('Clank');
    expect(result![0].cardType).toBe('ancestry');
    expect(result![1].name).toBe('Firbolg');
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getAncestries().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
