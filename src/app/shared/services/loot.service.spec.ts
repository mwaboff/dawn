import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { LootService, PaginatedCards } from './loot.service';
import { LootApiResponse } from '../models/loot-api.model';
import { PaginatedResponse } from '../models/api.model';

const baseUrl = 'http://localhost:8080/api/dh/loot';

function buildLootResponse(overrides: Partial<LootApiResponse> = {}): LootApiResponse {
  return {
    id: 1,
    name: 'Health Potion',
    ...overrides,
  };
}

function buildPaginatedResponse(content: LootApiResponse[]): PaginatedResponse<LootApiResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('LootService', () => {
  let service: LootService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LootService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint with expand param', () => {
    service.getLoot().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl && r.params.get('expand') === 'features,costTags',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getLoot().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should include tier filter param when provided', () => {
    service.getLoot({ tier: 2 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl && r.params.get('tier') === '2');
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should include isConsumable filter param when provided', () => {
    service.getLoot({ isConsumable: true }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl && r.params.get('isConsumable') === 'true');
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should not include optional params when not provided', () => {
    service.getLoot().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('tier')).toBe(false);
    expect(req.request.params.has('isConsumable')).toBe(false);
    req.flush(buildPaginatedResponse([]));
  });

  it('should return mapped PaginatedCards with pagination metadata', () => {
    const mockResponse: PaginatedResponse<LootApiResponse> = {
      content: [
        buildLootResponse({ id: 1, name: 'Health Potion' }),
        buildLootResponse({ id: 2, name: 'Mana Potion' }),
      ],
      currentPage: 0,
      pageSize: 20,
      totalElements: 2,
      totalPages: 1,
    };

    let result: PaginatedCards | undefined;
    service.getLoot().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result!.cards).toHaveLength(2);
    expect(result!.cards[0].name).toBe('Health Potion');
    expect(result!.cards[1].name).toBe('Mana Potion');
    expect(result!.currentPage).toBe(0);
    expect(result!.totalPages).toBe(1);
    expect(result!.totalElements).toBe(2);
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getLoot().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
