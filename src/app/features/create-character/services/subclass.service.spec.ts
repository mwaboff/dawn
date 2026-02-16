import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { SubclassService } from './subclass.service';
import { SubclassCardResponse } from '../models/subclass-api.model';
import { PaginatedResponse } from '../models/class-api.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildSubclassCardResponse(overrides: Partial<SubclassCardResponse> = {}): SubclassCardResponse {
  return {
    id: 1,
    name: 'Troubadour',
    description: 'A musical warrior',
    cardType: 'SUBCLASS',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    subclassPathId: 10,
    level: 'FOUNDATION',
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: SubclassCardResponse[]): PaginatedResponse<SubclassCardResponse> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 };
}

describe('SubclassService', () => {
  let service: SubclassService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/cards/subclass';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubclassService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with query params including associatedClassId', () => {
    service.getSubclasses(5, 1, 50).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '50' &&
        r.params.get('expand') === 'features,costTags' &&
        r.params.get('associatedClassId') === '5',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getSubclasses(1).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should map response content through mapper', () => {
    const mockResponse = buildPaginatedResponse([
      buildSubclassCardResponse({ id: 1, name: 'Troubadour' }),
      buildSubclassCardResponse({ id: 2, name: 'Blade' }),
    ]);

    let result: CardData[] | undefined;
    service.getSubclasses(1).subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe('Troubadour');
    expect(result![0].cardType).toBe('subclass');
    expect(result![1].name).toBe('Blade');
  });

  it('should cache results per classId', () => {
    let result: CardData[] | undefined;
    service.getSubclasses(1).subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(buildPaginatedResponse([buildSubclassCardResponse()]));

    expect(result).toHaveLength(1);
  });

  it('should return cached data on second call for same classId', () => {
    let firstResult: CardData[] | undefined;
    let secondResult: CardData[] | undefined;

    service.getSubclasses(1).subscribe(data => (firstResult = data));
    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(buildPaginatedResponse([buildSubclassCardResponse()]));

    service.getSubclasses(1).subscribe(data => (secondResult = data));
    httpTesting.expectNone(baseUrl);

    expect(secondResult).toEqual(firstResult);
  });

  it('should fetch fresh data for different classId', () => {
    service.getSubclasses(1).subscribe();
    const req1 = httpTesting.expectOne(r => r.url === baseUrl && r.params.get('associatedClassId') === '1');
    req1.flush(buildPaginatedResponse([buildSubclassCardResponse()]));

    service.getSubclasses(2).subscribe();
    const req2 = httpTesting.expectOne(r => r.url === baseUrl && r.params.get('associatedClassId') === '2');
    req2.flush(buildPaginatedResponse([buildSubclassCardResponse({ id: 2, name: 'Blade' })]));
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getSubclasses(1).subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });

  it('should clear cache when clearCache is called', () => {
    service.getSubclasses(1).subscribe();
    const req1 = httpTesting.expectOne(r => r.url === baseUrl);
    req1.flush(buildPaginatedResponse([buildSubclassCardResponse()]));

    service.clearCache();

    service.getSubclasses(1).subscribe();
    const req2 = httpTesting.expectOne(r => r.url === baseUrl);
    req2.flush(buildPaginatedResponse([buildSubclassCardResponse()]));
  });
});
