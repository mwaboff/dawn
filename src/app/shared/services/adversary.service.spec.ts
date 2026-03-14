import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { AdversaryService, PaginatedAdversaries } from './adversary.service';
import { AdversaryApiResponse } from '../models/adversary-api.model';

const baseUrl = 'http://localhost:8080/api/dh/adversaries';

function buildAdversaryResponse(overrides: Partial<AdversaryApiResponse> = {}): AdversaryApiResponse {
  return {
    id: 1,
    name: 'Goblin Scout',
    tier: 1,
    adversaryType: 'MINION',
    ...overrides,
  };
}

function buildPaginatedResponse(content: AdversaryApiResponse[]) {
  return {
    content,
    currentPage: 0,
    pageSize: 20,
    totalElements: content.length,
    totalPages: 1,
  };
}

describe('AdversaryService', () => {
  let service: AdversaryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdversaryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint with expand param', () => {
    service.getAdversaries().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl && r.params.get('expand') === 'features,experiences',
    );
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should send withCredentials: true', () => {
    service.getAdversaries().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush(buildPaginatedResponse([]));
  });

  it('should include tier filter when provided', () => {
    service.getAdversaries({ tier: 2 }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl && r.params.get('tier') === '2');
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should include adversaryType filter when provided', () => {
    service.getAdversaries({ adversaryType: 'SOLO' }).subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl && r.params.get('adversaryType') === 'SOLO');
    expect(req.request.method).toBe('GET');
    req.flush(buildPaginatedResponse([]));
  });

  it('should not include optional params when not provided', () => {
    service.getAdversaries().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.params.has('tier')).toBe(false);
    expect(req.request.params.has('adversaryType')).toBe(false);
    req.flush(buildPaginatedResponse([]));
  });

  it('should return mapped PaginatedAdversaries', () => {
    const mockData: AdversaryApiResponse[] = [
      buildAdversaryResponse({ id: 1, name: 'Goblin Scout' }),
      buildAdversaryResponse({ id: 2, name: 'Orc Warrior', adversaryType: 'STANDARD' }),
    ];

    let result: PaginatedAdversaries | undefined;
    service.getAdversaries().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(buildPaginatedResponse(mockData));

    expect(result!.adversaries).toHaveLength(2);
    expect(result!.adversaries[0].id).toBe(1);
    expect(result!.adversaries[0].name).toBe('Goblin Scout');
    expect(result!.adversaries[1].name).toBe('Orc Warrior');
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getAdversaries().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
