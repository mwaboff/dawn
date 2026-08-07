import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { WeaponService } from './weapon.service';
import { PaginatedCards } from '../models/api.model';
import { WeaponResponse } from '../models/weapon-api.model';
import { PaginatedResponse } from '../models/api.model';

function buildWeaponResponse(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    isPublic: false,
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

  it('should post custom weapons to /custom, not the admin collection endpoint', () => {
    // The bare collection is the admin import path and 403s for regular users, so hitting it
    // here would make creation fail for exactly the people the feature is for.
    service
      .createCustomWeapon({
        name: 'My Blade',
        tier: 1,
        isPrimary: true,
        trait: 'AGILITY',
        range: 'MELEE',
        burden: 'ONE_HANDED',
        damage: { diceType: 'D8', damageType: 'PHYSICAL' },
      })
      .subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/custom`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body.name).toBe('My Blade');
    req.flush(buildWeaponResponse());
  });

  it('should not send isOfficial or expansionId when creating a custom weapon', () => {
    service
      .createCustomWeapon({
        name: 'Plain',
        tier: 1,
        isPrimary: true,
        trait: 'AGILITY',
        range: 'MELEE',
        burden: 'ONE_HANDED',
        damage: { diceType: 'D8', damageType: 'PHYSICAL' },
      })
      .subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/custom`);
    expect(req.request.body.isOfficial).toBeUndefined();
    expect(req.request.body.expansionId).toBeUndefined();
    req.flush(buildWeaponResponse());
  });

  it('should PUT updates to the weapon by id', () => {
    service.updateWeapon(7, { name: 'Renamed' }).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildWeaponResponse({ id: 7, name: 'Renamed' }));
  });

  it('should POST to the copy endpoint with an empty body', () => {
    service.copyWeapon(3).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/3/copy`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildWeaponResponse({ id: 99, name: 'Broadsword (Copy)' }));
  });


  it('should forward name and sort as query params', () => {
    service.getWeaponsRaw({ name: 'longs', sort: 'NAME' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl && r.params.get('name') === 'longs');
    expect(req.request.params.get('sort')).toBe('NAME');
    req.flush(buildPaginatedResponse([]));
  });

  it('should omit name and sort when not requested', () => {
    service.getWeaponsRaw({}).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('name')).toBe(false);
    expect(req.request.params.has('sort')).toBe(false);
    req.flush(buildPaginatedResponse([]));
  });


  it('should GET one weapon by id with the relationships an editor needs', () => {
    // A missing expand here does not fail loudly -- it comes back as an item with no features,
    // which the next save would then persist as the truth.
    service.getWeaponById(7).subscribe();

    const req = httpTesting.expectOne(r => r.url === `${baseUrl}/7`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.params.get('expand')).toBe('expansion,features,costTags,modifiers');
    req.flush(buildWeaponResponse({ id: 7 }));
  });

  it('should surface errors from getWeaponById', () => {
    let error: HttpErrorResponse | undefined;
    service.getWeaponById(7).subscribe({ error: e => (error = e) });

    httpTesting
      .expectOne(r => r.url === `${baseUrl}/7`)
      .flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(error?.status).toBe(404);
  });
});
