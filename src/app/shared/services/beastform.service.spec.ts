import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { BeastformService } from './beastform.service';
import { PaginatedCards, PaginatedResponse } from '../models/api.model';
import { BeastformResponse } from '../models/beastform-api.model';

function buildBeastformResponse(overrides: Partial<BeastformResponse> = {}): BeastformResponse {
  return {
    id: 1,
    name: 'Agile Scout',
    attackRange: 'MELEE',
    attackTrait: 'AGILITY',
    damage: { diceType: 'D6', damageType: 'PHYSICAL', notation: '1d6 phy' },
    expansionId: 1,
    isOfficial: true,
    isPublic: false,
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: BeastformResponse[]): PaginatedResponse<BeastformResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('BeastformService', () => {
  let service: BeastformService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/beastforms';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BeastformService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with default query params', () => {
    service.getBeastformsPaginated().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20' &&
        r.params.get('expand') === 'features',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should call correct URL with custom filters', () => {
    service.getBeastformsPaginated({ page: 1, expansionId: 2, isOfficial: true, isPublic: false }).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '1' &&
        r.params.get('expansionId') === '2' &&
        r.params.get('isOfficial') === 'true' &&
        r.params.get('isPublic') === 'false',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should not include optional params when undefined', () => {
    service.getBeastformsPaginated({ page: 0 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('expansionId')).toBe(false);
    expect(req.request.params.has('isOfficial')).toBe(false);
    expect(req.request.params.has('isPublic')).toBe(false);
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getBeastformsPaginated().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should map response to PaginatedCards with cards and pagination metadata', () => {
    const mockResponse: PaginatedResponse<BeastformResponse> = {
      content: [
        buildBeastformResponse({ id: 1, name: 'Agile Scout' }),
        buildBeastformResponse({ id: 2, name: 'Nimble Grazer' }),
      ],
      currentPage: 1,
      pageSize: 20,
      totalElements: 25,
      totalPages: 2,
    };

    let result: PaginatedCards | undefined;
    service.getBeastformsPaginated({ page: 1 }).subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result!.cards).toHaveLength(2);
    expect(result!.cards[0].name).toBe('Agile Scout');
    expect(result!.cards[0].cardType).toBe('beastform');
    expect(result!.cards[1].name).toBe('Nimble Grazer');
    expect(result!.currentPage).toBe(1);
    expect(result!.totalPages).toBe(2);
    expect(result!.totalElements).toBe(25);
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getBeastformsPaginated().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
