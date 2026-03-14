import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ArmorService } from './armor.service';
import { ArmorResponse } from '../models/armor-api.model';
import { PaginatedResponse, PaginatedCards } from '../models/api.model';

function buildArmorResponse(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 1,
    name: 'Leather Armor',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    baseMajorThreshold: 7,
    baseSevereThreshold: 13,
    baseScore: 2,
    featureIds: [],
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: ArmorResponse[]): PaginatedResponse<ArmorResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('ArmorService', () => {
  let service: ArmorService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/armors';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArmorService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with default query params', () => {
    service.getArmors().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20' &&
        r.params.get('expand') === 'expansion,features,costTags,modifiers',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should call correct URL with custom options', () => {
    service.getArmors({ page: 1, size: 10, tier: 2 }).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '10' &&
        r.params.get('tier') === '2',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should not include tier param when undefined', () => {
    service.getArmors({ page: 0, size: 20 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('tier')).toBe(false);
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getArmors().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should map response to PaginatedCards with cards and pagination metadata', () => {
    const mockResponse: PaginatedResponse<ArmorResponse> = {
      content: [
        buildArmorResponse({ id: 1, name: 'Leather Armor' }),
        buildArmorResponse({ id: 2, name: 'Chainmail' }),
      ],
      currentPage: 1,
      pageSize: 20,
      totalElements: 25,
      totalPages: 2,
    };

    let result: PaginatedCards | undefined;
    service.getArmors({ page: 1 }).subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result!.cards).toHaveLength(2);
    expect(result!.cards[0].name).toBe('Leather Armor');
    expect(result!.cards[0].cardType).toBe('armor');
    expect(result!.cards[1].name).toBe('Chainmail');
    expect(result!.currentPage).toBe(1);
    expect(result!.totalPages).toBe(2);
    expect(result!.totalElements).toBe(25);
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getArmors().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
