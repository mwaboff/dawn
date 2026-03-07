import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { WeaponService, PaginatedCards } from './weapon.service';
import { WeaponResponse } from '../models/weapon-api.model';
import { PaginatedResponse } from '../../../shared/models/api.model';

function buildWeaponResponse(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    name: 'Broadsword',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    isPrimary: true,
    trait: 'STRENGTH',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceCount: 1, diceType: 'D8', modifier: 0, damageType: 'PHYSICAL', notation: '1d8' },
    featureIds: [],
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: WeaponResponse[]): PaginatedResponse<WeaponResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('WeaponService', () => {
  let service: WeaponService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/weapons';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeaponService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with default query params', () => {
    service.getWeapons().subscribe();

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
    service.getWeapons({ page: 1, size: 10, isPrimary: true, tier: 2, damageType: 'MAGIC' }).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '10' &&
        r.params.get('isPrimary') === 'true' &&
        r.params.get('tier') === '2' &&
        r.params.get('damageType') === 'MAGIC',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should not include optional params when undefined', () => {
    service.getWeapons({ page: 0, size: 20 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('isPrimary')).toBe(false);
    expect(req.request.params.has('tier')).toBe(false);
    expect(req.request.params.has('damageType')).toBe(false);
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getWeapons().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should map response to PaginatedCards with cards and pagination metadata', () => {
    const mockResponse: PaginatedResponse<WeaponResponse> = {
      content: [
        buildWeaponResponse({ id: 1, name: 'Broadsword' }),
        buildWeaponResponse({ id: 2, name: 'Staff' }),
      ],
      currentPage: 1,
      pageSize: 20,
      totalElements: 25,
      totalPages: 2,
    };

    let result: PaginatedCards | undefined;
    service.getWeapons({ page: 1 }).subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result!.cards).toHaveLength(2);
    expect(result!.cards[0].name).toBe('Broadsword');
    expect(result!.cards[0].cardType).toBe('weapon');
    expect(result!.cards[1].name).toBe('Staff');
    expect(result!.currentPage).toBe(1);
    expect(result!.totalPages).toBe(2);
    expect(result!.totalElements).toBe(25);
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getWeapons().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
