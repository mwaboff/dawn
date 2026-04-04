import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ExpansionService } from './expansion.service';
import { ExpansionOption } from '../models/expansion-api.model';

const baseUrl = 'http://localhost:8080/api/dh/expansions';

describe('ExpansionService', () => {
  let service: ExpansionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpansionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint with pagination params', () => {
    service.getExpansions().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('100');
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
  });

  it('should send withCredentials: true', () => {
    service.getExpansions().subscribe();

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 100 });
  });

  it('should extract content from paginated response', () => {
    const mockData = {
      content: [
        { id: 1, name: 'Core Set' },
        { id: 2, name: 'Expansion 1' },
      ],
      totalElements: 2,
      totalPages: 1,
      currentPage: 0,
      pageSize: 100,
    };

    let result: ExpansionOption[] | undefined;
    service.getExpansions().subscribe(data => (result = data));

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush(mockData);

    expect(result).toHaveLength(2);
    expect(result![0].id).toBe(1);
    expect(result![0].name).toBe('Core Set');
  });

  it('should cache the result and not make a second HTTP call', () => {
    service.getExpansions().subscribe();
    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush({ content: [{ id: 1, name: 'Core Set' }], totalElements: 1, totalPages: 1, currentPage: 0, pageSize: 100 });

    service.getExpansions().subscribe();
    httpTesting.expectNone(r => r.url === baseUrl);
  });

  it('should propagate HTTP errors', () => {
    let error: HttpErrorResponse | undefined;
    service.getExpansions().subscribe({ error: e => (error = e) });

    const req = httpTesting.expectOne(r => r.url === baseUrl);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error?.status).toBe(500);
  });
});
