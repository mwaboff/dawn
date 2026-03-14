import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { CompanionService } from './companion.service';
import { CompanionApiResponse } from '../models/companion-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

const baseUrl = 'http://localhost:8080/api/dh/companions';

function buildCompanionResponse(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 1,
    name: 'Forest Wolf',
    ...overrides,
  };
}

describe('CompanionService', () => {
  let service: CompanionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint', () => {
    service.getCompanions().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send withCredentials: true', () => {
    service.getCompanions().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should return mapped CardData array', () => {
    const mockData: CompanionApiResponse[] = [
      buildCompanionResponse({ id: 1, name: 'Forest Wolf' }),
      buildCompanionResponse({ id: 2, name: 'Shadow Cat', companionType: 'BEAST' }),
    ];

    let result: CardData[] | undefined;
    service.getCompanions().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockData);

    expect(result).toHaveLength(2);
    expect(result![0].id).toBe(1);
    expect(result![0].name).toBe('Forest Wolf');
    expect(result![1].name).toBe('Shadow Cat');
  });

  it('should return empty array when no companions', () => {
    let result: CardData[] | undefined;
    service.getCompanions().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush([]);

    expect(result).toEqual([]);
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getCompanions().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(error?.status).toBe(404);
  });
});
