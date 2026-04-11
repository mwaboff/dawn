import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DomainService } from './domain.service';
import { environment } from '../../../environments/environment';

const DOMAINS_URL = `${environment.apiUrl}/dh/domains`;
const DOMAIN_CARDS_URL = `${environment.apiUrl}/dh/cards/domain`;

describe('DomainService', () => {
  let service: DomainService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DomainService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DomainService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  describe('loadDomainLookup', () => {
    it('should fetch domains and build name-to-id map', () => {
      let result: Map<string, number> | undefined;

      service.loadDomainLookup().subscribe(map => {
        result = map;
      });

      const req = httpMock.expectOne(r => r.url === DOMAINS_URL);
      req.flush({
        content: [
          { id: 1, name: 'Arcana' },
          { id: 2, name: 'Blade' },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 100,
        number: 0,
      });

      expect(result!.get('Arcana')).toBe(1);
      expect(result!.get('Blade')).toBe(2);
    });

    it('should return cached map on second call without new HTTP request', () => {
      service.loadDomainLookup().subscribe();
      const req = httpMock.expectOne(r => r.url === DOMAINS_URL);
      req.flush({ content: [{ id: 1, name: 'Arcana' }], totalElements: 1, totalPages: 1, size: 100, number: 0 });

      service.loadDomainLookup().subscribe();
      httpMock.expectNone(DOMAINS_URL);
    });
  });

  describe('resolveDomainIds', () => {
    it('should resolve domain names to IDs after loading lookup', () => {
      service.loadDomainLookup().subscribe();
      const req = httpMock.expectOne(r => r.url === DOMAINS_URL);
      req.flush({
        content: [
          { id: 3, name: 'Codex' },
          { id: 5, name: 'Grace' },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 100,
        number: 0,
      });

      const ids = service.resolveDomainIds(['Codex', 'Grace']);

      expect(ids).toEqual([3, 5]);
    });

    it('should omit unknown domain names', () => {
      service.loadDomainLookup().subscribe();
      const req = httpMock.expectOne(r => r.url === DOMAINS_URL);
      req.flush({ content: [{ id: 3, name: 'Codex' }], totalElements: 1, totalPages: 1, size: 100, number: 0 });

      const ids = service.resolveDomainIds(['Codex', 'Unknown']);

      expect(ids).toEqual([3]);
    });
  });

  describe('getDomainCards', () => {
    it('should fetch domain cards with correct params', () => {
      let result: unknown;

      service.getDomainCards([3, 5]).subscribe(cards => {
        result = cards;
      });

      const req = httpMock.expectOne(r => r.url === DOMAIN_CARDS_URL);
      expect(req.request.params.has('levels')).toBe(false);
      expect(req.request.params.get('associatedDomainIds')).toBe('3,5');
      expect(req.request.params.get('expand')).toBe('features,costTags,associatedDomain');

      req.flush({
        content: [
          {
            id: 10,
            name: 'Rune Ward',
            description: 'A protective rune',
            cardType: 'DOMAIN',
            expansionId: 1,
            isOfficial: true,
            featureIds: [],
            features: [],
            costTagIds: [],
            costTags: [],
            associatedDomainId: 3,
            associatedDomain: { id: 3, name: 'Codex', description: '', expansionId: 1 },
            level: 1,
            recallCost: 0,
            type: 'SPELL',
            createdAt: '2025-01-01T00:00:00Z',
            lastModifiedAt: '2025-01-01T00:00:00Z',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 100,
        number: 0,
      });

      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBe(1);
    });

    it('should use withCredentials', () => {
      service.getDomainCards([1]).subscribe();

      const req = httpMock.expectOne(r => r.url === DOMAIN_CARDS_URL);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0 });
    });
  });

  describe('getDomainCardsForNames', () => {
    it('should load lookup and fetch cards in sequence', () => {
      let result: unknown[] | undefined;

      service.getDomainCardsForNames(['Codex']).subscribe(cards => {
        result = cards;
      });

      const domainReq = httpMock.expectOne(r => r.url === DOMAINS_URL);
      domainReq.flush({
        content: [{ id: 3, name: 'Codex' }],
        totalElements: 1,
        totalPages: 1,
        size: 100,
        number: 0,
      });

      const cardReq = httpMock.expectOne(r => r.url === DOMAIN_CARDS_URL);
      expect(cardReq.request.params.get('associatedDomainIds')).toBe('3');
      cardReq.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0 });

      expect(result).toEqual([]);
    });
  });

  describe('getDomainCardsBrowse', () => {
    it('forwards level as the "levels" query param', () => {
      service.getDomainCardsBrowse({ level: 5 }).subscribe();

      const req = httpMock.expectOne(r => r.url === DOMAIN_CARDS_URL);
      expect(req.request.params.get('levels')).toBe('5');
      req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0 });
    });

    it('omits the "levels" query param when level is undefined', () => {
      service.getDomainCardsBrowse({ tier: 2 }).subscribe();

      const req = httpMock.expectOne(r => r.url === DOMAIN_CARDS_URL);
      expect(req.request.params.has('levels')).toBe(false);
      req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0 });
    });
  });

  describe('getDomainOptions', () => {
    it('should fetch domains with page=0 and size=100', () => {
      service.getDomainOptions().subscribe();

      const req = httpMock.expectOne(
        r => r.url === DOMAINS_URL && r.params.get('page') === '0' && r.params.get('size') === '100',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0 });
    });

    it('should send withCredentials: true', () => {
      service.getDomainOptions().subscribe();

      const req = httpMock.expectOne(r => r.url === DOMAINS_URL);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0 });
    });

    it('should map response to LookupOption[]', () => {
      let result: unknown;
      service.getDomainOptions().subscribe(opts => (result = opts));

      const req = httpMock.expectOne(r => r.url === DOMAINS_URL);
      req.flush({
        content: [
          { id: 1, name: 'Arcana' },
          { id: 2, name: 'Blade' },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 100,
        number: 0,
      });

      expect(result).toEqual([
        { id: 1, label: 'Arcana' },
        { id: 2, label: 'Blade' },
      ]);
    });
  });

  describe('clearCache', () => {
    it('should re-fetch after clearCache', () => {
      service.loadDomainLookup().subscribe();
      const req1 = httpMock.expectOne(r => r.url === DOMAINS_URL);
      req1.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0 });

      service.clearCache();

      service.loadDomainLookup().subscribe();
      const req2 = httpMock.expectOne(r => r.url === DOMAINS_URL);
      req2.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0 });
    });
  });
});
