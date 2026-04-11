import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FeatureLookupService } from './feature-lookup.service';
import { LookupOption } from '../models/lookup-option.model';

const baseUrl = 'http://localhost:8080/api/dh/features';

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
});
