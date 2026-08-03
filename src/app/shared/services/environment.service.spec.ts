import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { EnvironmentService } from './environment.service';
import { PaginatedCards, PaginatedResponse } from '../models/api.model';
import { EnvironmentResponse } from '../models/environment-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

function buildEnvironmentResponse(overrides: Partial<EnvironmentResponse> = {}): EnvironmentResponse {
  return {
    id: 1,
    name: 'Sundered Ruins',
    tier: 2,
    environmentType: 'EXPLORATION',
    difficulty: 12,
    isOfficial: true,
    isPublic: false,
    expansionId: 1,
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: EnvironmentResponse[]): PaginatedResponse<EnvironmentResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/environments';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EnvironmentService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with default query params', () => {
    service.getEnvironmentsPaginated().subscribe();

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
    service.getEnvironmentsPaginated({ page: 1, tier: 3, environmentType: 'SOCIAL', isOfficial: true, expansionId: 2 }).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '1' &&
        r.params.get('tier') === '3' &&
        r.params.get('environmentType') === 'SOCIAL' &&
        r.params.get('isOfficial') === 'true' &&
        r.params.get('expansionId') === '2',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should not include optional params when undefined', () => {
    service.getEnvironmentsPaginated({ page: 0 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('tier')).toBe(false);
    expect(req.request.params.has('environmentType')).toBe(false);
    expect(req.request.params.has('isOfficial')).toBe(false);
    expect(req.request.params.has('expansionId')).toBe(false);
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getEnvironmentsPaginated().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should map response to PaginatedCards with cards and pagination metadata', () => {
    const mockResponse: PaginatedResponse<EnvironmentResponse> = {
      content: [
        buildEnvironmentResponse({ id: 1, name: 'Sundered Ruins' }),
        buildEnvironmentResponse({ id: 2, name: 'The Long Road' }),
      ],
      currentPage: 1,
      pageSize: 20,
      totalElements: 25,
      totalPages: 2,
    };

    let result: PaginatedCards | undefined;
    service.getEnvironmentsPaginated({ page: 1 }).subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result!.cards).toHaveLength(2);
    expect(result!.cards[0].name).toBe('Sundered Ruins');
    expect(result!.cards[0].cardType).toBe('environment');
    expect(result!.cards[1].name).toBe('The Long Road');
    expect(result!.currentPage).toBe(1);
    expect(result!.totalPages).toBe(2);
    expect(result!.totalElements).toBe(25);
  });

  describe('getEnvironment', () => {
    it('should call correct URL with expand=features', () => {
      service.getEnvironment(7).subscribe();

      const req = httpTesting.expectOne(
        r => r.url === `${baseUrl}/7` && r.params.get('expand') === 'features',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(buildEnvironmentResponse({ id: 7 }));
    });

    it('should map the response to CardData', () => {
      let result: CardData | undefined;
      service.getEnvironment(7).subscribe(card => (result = card));

      const req = httpTesting.expectOne(r => r.url === `${baseUrl}/7`);
      req.flush(buildEnvironmentResponse({ id: 7, name: 'Sundered Ruins' }));

      expect(result?.id).toBe(7);
      expect(result?.name).toBe('Sundered Ruins');
      expect(result?.cardType).toBe('environment');
    });

    it('should propagate HTTP errors', () => {
      let error: HttpErrorResponse | undefined;
      service.getEnvironment(7).subscribe({ error: e => (error = e) });

      const req = httpTesting.expectOne(r => r.url === `${baseUrl}/7`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getEnvironmentsPaginated().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
