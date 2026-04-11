import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CostTagLookupService } from './cost-tag-lookup.service';
import { LookupOption } from '../models/lookup-option.model';

const baseUrl = 'http://localhost:8080/api/dh/card-cost-tags';

describe('CostTagLookupService', () => {
  let service: CostTagLookupService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CostTagLookupService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should call the correct endpoint', () => {
    service.list().subscribe();

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send withCredentials: true', () => {
    service.list().subscribe();

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('should map items to LookupOption with label combining label and category', () => {
    const mockItems = [
      { id: 1, label: 'Concentrate', category: 'SPELL' },
      { id: 2, label: 'Ongoing', category: 'EFFECT' },
    ];

    let result: LookupOption[] | undefined;
    service.list().subscribe(data => (result = data));

    const req = httpTesting.expectOne(baseUrl);
    req.flush(mockItems);

    expect(result).toHaveLength(2);
    expect(result![0]).toEqual({ id: 1, label: 'Concentrate (SPELL)' });
    expect(result![1]).toEqual({ id: 2, label: 'Ongoing (EFFECT)' });
  });
});
