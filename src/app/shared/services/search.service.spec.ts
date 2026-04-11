import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { SearchService } from './search.service';
import { SearchResponse } from '../../features/reference/models/search.model';

function buildSearchResponse(overrides: Partial<SearchResponse> = {}): SearchResponse {
  return {
    results: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    query: 'test',
    ...overrides,
  };
}

describe('SearchService', () => {
  let service: SearchService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/search';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SearchService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct URL', () => {
    service.search({ q: 'flame' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(buildSearchResponse());
  });

  it('should always include q, expand=all, page, and size params', () => {
    service.search({ q: 'sword' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('q')).toBe('sword');
    expect(req.request.params.get('expand')).toBe('all');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(buildSearchResponse());
  });

  it('should default to page 0 and size 20', () => {
    service.search({ q: 'sword' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(buildSearchResponse());
  });

  it('should send custom page and size', () => {
    service.search({ q: 'sword', page: 2, size: 10 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(buildSearchResponse());
  });

  it('should send types as comma-separated string', () => {
    service.search({ q: 'dragon', types: ['WEAPON', 'ADVERSARY'] }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('types')).toBe('WEAPON,ADVERSARY');
    req.flush(buildSearchResponse());
  });

  it('should send tier filter', () => {
    service.search({ q: 'sword', tier: 2 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('tier')).toBe('2');
    req.flush(buildSearchResponse());
  });

  it('should send expansionId filter', () => {
    service.search({ q: 'sword', expansionId: 5 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('expansionId')).toBe('5');
    req.flush(buildSearchResponse());
  });

  it('should send isOfficial filter', () => {
    service.search({ q: 'sword', isOfficial: true }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('isOfficial')).toBe('true');
    req.flush(buildSearchResponse());
  });

  it('should send isOfficial=false filter', () => {
    service.search({ q: 'sword', isOfficial: false }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('isOfficial')).toBe('false');
    req.flush(buildSearchResponse());
  });

  it('should send cardType filter', () => {
    service.search({ q: 'fire', cardType: 'ANCESTRY' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('cardType')).toBe('ANCESTRY');
    req.flush(buildSearchResponse());
  });

  it('should send featureType filter', () => {
    service.search({ q: 'fire', featureType: 'CLASS_FEATURE' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('featureType')).toBe('CLASS_FEATURE');
    req.flush(buildSearchResponse());
  });

  it('should send adversaryType filter', () => {
    service.search({ q: 'dragon', adversaryType: 'BOSS' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('adversaryType')).toBe('BOSS');
    req.flush(buildSearchResponse());
  });

  it('should send domainCardType filter', () => {
    service.search({ q: 'fire', domainCardType: 'SPELL' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('domainCardType')).toBe('SPELL');
    req.flush(buildSearchResponse());
  });

  it('should send associatedDomainId filter', () => {
    service.search({ q: 'fire', associatedDomainId: 3 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('associatedDomainId')).toBe('3');
    req.flush(buildSearchResponse());
  });

  it('should send trait filter', () => {
    service.search({ q: 'sword', trait: 'AGILITY' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('trait')).toBe('AGILITY');
    req.flush(buildSearchResponse());
  });

  it('should send range filter', () => {
    service.search({ q: 'bow', range: 'RANGED' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('range')).toBe('RANGED');
    req.flush(buildSearchResponse());
  });

  it('should send burden filter', () => {
    service.search({ q: 'shield', burden: 'ONE_HANDED' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('burden')).toBe('ONE_HANDED');
    req.flush(buildSearchResponse());
  });

  it('should send isConsumable filter', () => {
    service.search({ q: 'potion', isConsumable: true }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('isConsumable')).toBe('true');
    req.flush(buildSearchResponse());
  });

  it('should not include optional filter params when not provided', () => {
    service.search({ q: 'sword' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    const optionalParams = [
      'types', 'tier', 'expansionId', 'isOfficial', 'cardType', 'featureType',
      'adversaryType', 'domainCardType', 'associatedDomainId', 'trait', 'range',
      'burden', 'isConsumable',
    ];
    for (const param of optionalParams) {
      expect(req.request.params.has(param), `should not have param: ${param}`).toBe(false);
    }
    req.flush(buildSearchResponse());
  });

  it('should not include types param when types array is empty', () => {
    service.search({ q: 'sword', types: [] }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('types')).toBe(false);
    req.flush(buildSearchResponse());
  });

  it('should send withCredentials: true', () => {
    service.search({ q: 'sword' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildSearchResponse());
  });

  it('should return the SearchResponse from the API', () => {
    const mockResponse = buildSearchResponse({
      results: [{ type: 'WEAPON', id: 42, name: 'Flame Sword', relevanceScore: 0.076, expandedEntity: null }],
      totalElements: 1,
      totalPages: 1,
      currentPage: 0,
      query: 'flame',
    });

    let result: SearchResponse | undefined;
    service.search({ q: 'flame' }).subscribe(r => (result = r));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result!.results).toHaveLength(1);
    expect(result!.results[0].name).toBe('Flame Sword');
    expect(result!.totalElements).toBe(1);
  });

  it('should propagate HTTP 400 errors', () => {
    let error: HttpErrorResponse | undefined;
    service.search({ q: 'test' }).subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    expect(error?.status).toBe(400);
  });

  it('should propagate HTTP 401 errors', () => {
    let error: HttpErrorResponse | undefined;
    service.search({ q: 'test' }).subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(error?.status).toBe(401);
  });
});
