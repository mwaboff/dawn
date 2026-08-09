import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { CatalogResult, ItemCatalogService } from './item-catalog.service';

const WEAPONS_URL = 'http://localhost:8080/api/dh/weapons';
const ARMORS_URL = 'http://localhost:8080/api/dh/armors';
const LOOT_URL = 'http://localhost:8080/api/dh/loot';

function page(content: unknown[], totalElements = content.length) {
  return { content, currentPage: 0, totalPages: 1, totalElements, pageSize: 25 };
}

describe('ItemCatalogService', () => {
  let service: ItemCatalogService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ItemCatalogService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('queries all three catalogues for an all-types search', () => {
    service.find({ term: 'flame', types: ['weapon', 'armor', 'loot'], customOnly: false }).subscribe();

    httpTesting.expectOne(r => r.url === WEAPONS_URL).flush(page([]));
    httpTesting.expectOne(r => r.url === ARMORS_URL).flush(page([]));
    httpTesting.expectOne(r => r.url === LOOT_URL).flush(page([]));
  });

  it('queries only the requested catalogue when a type filter is set', () => {
    service.find({ term: '', types: ['loot'], customOnly: false }).subscribe();

    httpTesting.expectNone(r => r.url === WEAPONS_URL);
    httpTesting.expectNone(r => r.url === ARMORS_URL);
    httpTesting.expectOne(r => r.url === LOOT_URL).flush(page([]));
  });

  it('passes the term as a name filter and sorts by name', () => {
    service.find({ term: 'broad', types: ['weapon'], customOnly: false }).subscribe();

    const req = httpTesting.expectOne(r => r.url === WEAPONS_URL);
    expect(req.request.params.get('name')).toBe('broad');
    expect(req.request.params.get('sort')).toBe('NAME');
    req.flush(page([]));
  });

  it('omits the name filter for a blank term, so the opening state browses everything', () => {
    service.find({ term: '', types: ['weapon'], customOnly: false }).subscribe();

    const req = httpTesting.expectOne(r => r.url === WEAPONS_URL);
    expect(req.request.params.has('name')).toBe(false);
    req.flush(page([]));
  });

  it('asks for non-official content only when the custom filter is on', () => {
    service.find({ term: '', types: ['armor'], customOnly: true }).subscribe();

    const req = httpTesting.expectOne(r => r.url === ARMORS_URL);
    expect(req.request.params.get('isOfficial')).toBe('false');
    req.flush(page([]));
  });

  it('leaves isOfficial off entirely when the custom filter is off', () => {
    service.find({ term: '', types: ['armor'], customOnly: false }).subscribe();

    const req = httpTesting.expectOne(r => r.url === ARMORS_URL);
    expect(req.request.params.has('isOfficial')).toBe(false);
    req.flush(page([]));
  });

  it('tags each hit with the type it came from, in the requested order', () => {
    let result: CatalogResult | null = null;
    service.find({ term: '', types: ['weapon', 'loot'], customOnly: false }).subscribe(r => (result = r));

    httpTesting.expectOne(r => r.url === WEAPONS_URL).flush(page([{ id: 1, name: 'Dagger' }]));
    httpTesting.expectOne(r => r.url === LOOT_URL).flush(page([{ id: 2, name: 'Rope' }]));

    expect(result!.hits.map(hit => hit.type)).toEqual(['weapon', 'loot']);
    expect(result!.hits[1].item.name).toBe('Rope');
  });

  it('reports how many matches each type really has, not just how many came back', () => {
    let result: CatalogResult | null = null;
    service.find({ term: '', types: ['weapon'], customOnly: false }).subscribe(r => (result = r));

    httpTesting.expectOne(r => r.url === WEAPONS_URL).flush(page([{ id: 1, name: 'Dagger' }], 112));

    expect(result!.totals.get('weapon')).toBe(112);
  });

  it('emits an empty result rather than hanging when no type is selected', () => {
    let result: CatalogResult | null = null;
    service.find({ term: 'x', types: [], customOnly: false }).subscribe(r => (result = r));

    expect(result!.hits).toEqual([]);
    expect(result!.totals.size).toBe(0);
  });

  it('propagates a failure so the caller can show an error state', () => {
    let errored = false;
    service.find({ term: '', types: ['weapon'], customOnly: false }).subscribe({ error: () => (errored = true) });

    httpTesting
      .expectOne(r => r.url === WEAPONS_URL)
      .flush('boom', new HttpErrorResponse({ status: 500, statusText: 'Server Error' }));

    expect(errored).toBe(true);
  });
});
