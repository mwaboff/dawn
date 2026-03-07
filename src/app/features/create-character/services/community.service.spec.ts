import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { CommunityService } from './community.service';
import { CommunityCardResponse } from '../models/community-api.model';
import { PaginatedResponse } from '../../../shared/models/api.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

function buildCommunityCardResponse(overrides: Partial<CommunityCardResponse> = {}): CommunityCardResponse {
  return {
    id: 1,
    name: 'Highborne',
    description: 'Being part of a highborne community means elegance and prestige',
    cardType: 'COMMUNITY',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildPaginatedResponse(content: CommunityCardResponse[]): PaginatedResponse<CommunityCardResponse> {
  return { content, currentPage: 0, pageSize: 20, totalElements: content.length, totalPages: 1 };
}

describe('CommunityService', () => {
  let service: CommunityService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/dh/cards/community';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CommunityService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with default query params', () => {
    service.getCommunities().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20' &&
        r.params.get('expand') === 'expansion,features,costTags',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should call correct URL with custom page and size', () => {
    service.getCommunities(2, 50).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl &&
        r.params.get('page') === '2' &&
        r.params.get('size') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getCommunities().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should map response content through mapper', () => {
    const mockResponse = buildPaginatedResponse([
      buildCommunityCardResponse({ id: 1, name: 'Highborne' }),
      buildCommunityCardResponse({ id: 2, name: 'Orderborne' }),
    ]);

    let result: CardData[] | undefined;
    service.getCommunities().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe('Highborne');
    expect(result![0].cardType).toBe('community');
    expect(result![1].name).toBe('Orderborne');
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getCommunities().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
