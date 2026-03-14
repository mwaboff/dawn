import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { SubclassPathService } from './subclass-path.service';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

const baseUrl = 'http://localhost:8080/api/dh/subclass-paths';

function buildSubclassPathResponse(overrides: Partial<SubclassPathApiResponse> = {}): SubclassPathApiResponse {
  return {
    id: 1,
    name: 'Beastbound',
    ...overrides,
  };
}

describe('SubclassPathService', () => {
  let service: SubclassPathService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubclassPathService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint with expand param', () => {
    service.getSubclassPaths().subscribe();

    const req = httpTesting.expectOne(
      r => r.url === baseUrl && r.params.get('expand') === 'associatedDomains,spellcastingTrait',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send withCredentials: true', () => {
    service.getSubclassPaths().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should return mapped CardData array', () => {
    const mockData: SubclassPathApiResponse[] = [
      buildSubclassPathResponse({ id: 1, name: 'Beastbound' }),
      buildSubclassPathResponse({ id: 2, name: 'Nightwalker' }),
    ];

    let result: CardData[] | undefined;
    service.getSubclassPaths().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockData);

    expect(result).toHaveLength(2);
    expect(result![0].id).toBe(1);
    expect(result![0].name).toBe('Beastbound');
    expect(result![1].name).toBe('Nightwalker');
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getSubclassPaths().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(error?.status).toBe(404);
  });
});
