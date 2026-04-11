import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ClassService } from './class.service';
import { ClassResponse } from '../models/class-api.model';
import { PaginatedResponse } from '../models/api.model';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { LookupOption } from '../models/lookup-option.model';

function buildClassResponse(overrides: Partial<ClassResponse> = {}): ClassResponse {
  return {
    id: 1,
    name: 'Warrior',
    description: 'A mighty fighter',
    startingEvasion: 8,
    startingHitPoints: 6,
    hopeFeatures: [],
    classFeatures: [],
    isOfficial: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ClassService', () => {
  let service: ClassService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClassService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call correct URL with query params', () => {
    service.getClasses(1, 50).subscribe();

    const req = httpTesting.expectOne(
      r => r.url === 'http://localhost:8080/api/dh/classes' &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '50' &&
        r.params.get('expand') === 'associatedDomains,classFeatures,hopeFeatures,costTags'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], currentPage: 1, pageSize: 50, totalElements: 0, totalPages: 0 });
  });

  it('should send withCredentials: true', () => {
    service.getClasses().subscribe();

    const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/classes');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], currentPage: 0, pageSize: 20, totalElements: 0, totalPages: 0 });
  });

  it('should map response content through mapper', () => {
    const mockResponse: PaginatedResponse<ClassResponse> = {
      content: [
        buildClassResponse({ id: 1, name: 'Warrior' }),
        buildClassResponse({ id: 2, name: 'Ranger' }),
      ],
      currentPage: 0,
      pageSize: 20,
      totalElements: 2,
      totalPages: 1,
    };

    let result: CardData[] | undefined;
    service.getClasses().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/classes');
    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe('Warrior');
    expect(result![0].cardType).toBe('class');
    expect(result![1].name).toBe('Ranger');
  });

  describe('getClassOptions', () => {
    it('should fetch classes with page=0 and size=100', () => {
      service.getClassOptions().subscribe();

      const req = httpTesting.expectOne(
        r => r.url === 'http://localhost:8080/api/dh/classes' &&
          r.params.get('page') === '0' &&
          r.params.get('size') === '100',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], currentPage: 0, pageSize: 100, totalElements: 0, totalPages: 0 });
    });

    it('should send withCredentials: true', () => {
      service.getClassOptions().subscribe();

      const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/classes');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ content: [], currentPage: 0, pageSize: 100, totalElements: 0, totalPages: 0 });
    });

    it('should map response to LookupOption[]', () => {
      let result: LookupOption[] | undefined;
      service.getClassOptions().subscribe(opts => (result = opts));

      const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/classes');
      req.flush({
        content: [
          buildClassResponse({ id: 1, name: 'Warrior' }),
          buildClassResponse({ id: 2, name: 'Ranger' }),
        ],
        currentPage: 0,
        pageSize: 100,
        totalElements: 2,
        totalPages: 1,
      });

      expect(result).toEqual([
        { id: 1, label: 'Warrior' },
        { id: 2, label: 'Ranger' },
      ]);
    });
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getClasses().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === 'http://localhost:8080/api/dh/classes');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
