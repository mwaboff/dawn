import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { SubclassPathService } from './subclass-path.service';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { LookupOption } from '../models/lookup-option.model';

const baseUrl = 'http://localhost:8080/api/dh/subclass-paths';

function buildSubclassPathResponse(overrides: Partial<SubclassPathApiResponse> = {}): SubclassPathApiResponse {
  return {
    id: 1,
    name: 'Beastbound',
    associatedClassId: 1,
    expansionId: 1,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: SubclassPathApiResponse[]) {
  return {
    content,
    currentPage: 0,
    pageSize: 100,
    totalElements: content.length,
    totalPages: 1,
  };
}

describe('SubclassPathService', () => {
  let service: SubclassPathService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubclassPathService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint with expand param', () => {
    service.getSubclassPaths().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl && r.params.get('expand') === 'associatedClass,associatedDomains,expansion',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getSubclassPaths().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should return mapped CardData array', () => {
    const mockData: SubclassPathApiResponse[] = [
      buildSubclassPathResponse({ id: 1, name: 'Beastbound' }),
      buildSubclassPathResponse({ id: 2, name: 'Nightwalker' }),
    ];

    let result: CardData[] | undefined;
    service.getSubclassPaths().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(buildPaginatedResponse(mockData));

    expect(result).toHaveLength(2);
    expect(result![0].id).toBe(1);
    expect(result![0].name).toBe('Beastbound');
    expect(result![1].name).toBe('Nightwalker');
  });

  describe('getOptions', () => {
    it('should fetch subclass paths with page=0 and size=100', () => {
      service.getOptions().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl && r.params.get('page') === '0' && r.params.get('size') === '100',
      );
      expect(req.request.method).toBe('GET');
      req.flush(buildPaginatedResponse([]));
    });

    it('should send withCredentials: true', () => {
      service.getOptions().subscribe();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildPaginatedResponse([]));
    });

    it('should map response to LookupOption[]', () => {
      let result: LookupOption[] | undefined;
      service.getOptions().subscribe(opts => (result = opts));

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.flush(buildPaginatedResponse([
        buildSubclassPathResponse({ id: 1, name: 'Beastbound' }),
        buildSubclassPathResponse({ id: 2, name: 'Nightwalker' }),
      ]));

      expect(result).toEqual([
        { id: 1, label: 'Beastbound' },
        { id: 2, label: 'Nightwalker' },
      ]);
    });

    it('should include classId param when provided', () => {
      service.getOptions(5).subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl && r.params.get('classId') === '5',
      );
      expect(req.request.params.get('classId')).toBe('5');
      req.flush(buildPaginatedResponse([]));
    });

    it('should omit classId param when not provided', () => {
      service.getOptions().subscribe();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.params.has('classId')).toBe(false);
      req.flush(buildPaginatedResponse([]));
    });
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getSubclassPaths().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(error?.status).toBe(404);
  });
});
