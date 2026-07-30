import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FeatureLookupService } from './feature-lookup.service';
import { LookupOption } from '../models/lookup-option.model';
import { PaginatedCards } from '../models/api.model';
import { FeatureResponse } from '../models/feature-api.model';

const baseUrl = 'http://localhost:8080/api/dh/features';

function buildFeatureResponse(overrides: Partial<FeatureResponse> = {}): FeatureResponse {
  return {
    id: 1,
    name: 'Barrier',
    description: 'A tier 1 barrier feature.',
    featureType: 'OTHER',
    expansionId: 1,
    costTagIds: [],
    modifierIds: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('FeatureLookupService', () => {
  let service: FeatureLookupService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeatureLookupService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint with featureType param', () => {
    service.list({ featureType: 'DOMAIN' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('featureType')).toBe('DOMAIN');
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
  });

  it('should send withCredentials: true', () => {
    service.list({ featureType: 'CLASS' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
  });

  it('should map response content to LookupOption with id and label from name', () => {
    const mockContent = [
      { id: 1, name: 'Fireball' },
      { id: 2, name: 'Ice Shield' },
    ];

    let result: LookupOption[] | undefined;
    service.list({ featureType: 'DOMAIN' }).subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush({ content: mockContent, totalElements: 2, totalPages: 1, currentPage: 0, pageSize: 100 });

    expect(result).toHaveLength(2);
    expect(result![0]).toEqual({ id: 1, label: 'Fireball' });
    expect(result![1]).toEqual({ id: 2, label: 'Ice Shield' });
  });

  describe('getFeaturesPaginated', () => {
    it('should call correct URL with default query params and no featureType filter', () => {
      service.getFeaturesPaginated().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl &&
          r.params.get('page') === '0' &&
          r.params.get('size') === '20' &&
          r.params.get('expand') === 'costTags' &&
          r.params.get('featureType') === null,
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 });
    });

    it('should include expansionId and featureType params when provided', () => {
      service.getFeaturesPaginated({ page: 2, size: 10, expansionId: 5, featureType: 'OTHER' }).subscribe();

      const req = httpTesting.expectOne(
        r => r.url === baseUrl &&
          r.params.get('page') === '2' &&
          r.params.get('size') === '10' &&
          r.params.get('expansionId') === '5' &&
          r.params.get('featureType') === 'OTHER',
      );
      req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 2, pageSize: 10 });
    });

    it('should surface unattached features (no owning card) discoverably, including same-name variants', () => {
      const barrierVariants = [
        buildFeatureResponse({ id: 10, name: 'Barrier', description: 'Tier 1: Mark 2 Stress.' }),
        buildFeatureResponse({ id: 11, name: 'Barrier', description: 'Tier 2: Mark 3 Stress.' }),
      ];

      let result: PaginatedCards | undefined;
      service.getFeaturesPaginated().subscribe(r => (result = r));

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      req.flush({ content: barrierVariants, totalElements: 2, totalPages: 1, currentPage: 0, pageSize: 20 });

      expect(result!.cards).toHaveLength(2);
      expect(result!.cards[0].name).toBe('Barrier');
      expect(result!.cards[0].description).toBe('Tier 1: Mark 2 Stress.');
      expect(result!.cards[1].description).toBe('Tier 2: Mark 3 Stress.');
      expect(result!.cards[0].cardType).toBe('feature');
    });

    it('should send withCredentials: true', () => {
      service.getFeaturesPaginated().subscribe();

      const req = httpTesting.expectOne(r => r.url === baseUrl);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 });
    });
  });
});
