import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Reference } from './reference';
import { SearchService } from '../../shared/services/search.service';
import { CodexBrowseService } from './services/codex-browse.service';
import { SearchResponse } from './models/search.model';

const MOCK_SEARCH_RESPONSE: SearchResponse = {
  results: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20, query: 'test',
};

const MOCK_BROWSE_RESULT = {
  cards: [], adversaries: [], currentPage: 0, totalPages: 1, totalElements: 0,
};

function buildTestBed(queryParams: Record<string, string> = {}) {
  const searchSpy = { search: vi.fn().mockReturnValue(of(MOCK_SEARCH_RESPONSE)) };
  const browseSpy = { browse: vi.fn().mockReturnValue(of(MOCK_BROWSE_RESULT)) };
  const routeStub = { snapshot: { queryParams } };

  TestBed.configureTestingModule({
    imports: [Reference],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: SearchService, useValue: searchSpy },
      { provide: CodexBrowseService, useValue: browseSpy },
      { provide: ActivatedRoute, useValue: routeStub },
    ],
  });

  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);

  return { searchSpy, browseSpy, router };
}

describe('Reference', () => {
  let fixture: ComponentFixture<Reference>;
  let component: Reference;
  let searchSpy: { search: ReturnType<typeof vi.fn> };
  let browseSpy: { browse: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    const spies = buildTestBed();
    searchSpy = spies.searchSpy;
    browseSpy = spies.browseSpy;
    router = spies.router;

    fixture = TestBed.createComponent(Reference);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('viewMode computation', () => {
    it('returns landing when query and activeType are both empty', () => {
      expect(component.viewMode()).toBe('landing');
    });

    it('returns mixedSearch when query is set and no type is selected', () => {
      component.query.set('flame');
      expect(component.viewMode()).toBe('mixedSearch');
    });

    it('returns focusedSearch when query and activeType are both set', () => {
      component.query.set('flame');
      component.activeType.set('WEAPON');
      expect(component.viewMode()).toBe('focusedSearch');
    });

    it('returns focusedBrowse when activeType is set but query is empty', () => {
      component.activeType.set('WEAPON');
      expect(component.viewMode()).toBe('focusedBrowse');
    });

    it('returns landing when query is whitespace-only and no type', () => {
      component.query.set('   ');
      expect(component.viewMode()).toBe('landing');
    });

    it('transitions from mixedSearch to landing when query cleared', () => {
      component.query.set('flame');
      expect(component.viewMode()).toBe('mixedSearch');
      component.query.set('');
      expect(component.viewMode()).toBe('landing');
    });

    it('transitions from focusedSearch to focusedBrowse when query cleared', () => {
      component.query.set('flame');
      component.activeType.set('WEAPON');
      expect(component.viewMode()).toBe('focusedSearch');
      component.query.set('');
      expect(component.viewMode()).toBe('focusedBrowse');
    });

    it('transitions from focusedBrowse to landing when type cleared', () => {
      component.activeType.set('WEAPON');
      expect(component.viewMode()).toBe('focusedBrowse');
      component.activeType.set(null);
      expect(component.viewMode()).toBe('landing');
    });
  });

  describe('search debounce and min-length gating', () => {
    it('does not call SearchService before 250ms debounce', () => {
      vi.useFakeTimers();
      component.query.set('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(100);
      expect(searchSpy.search).not.toHaveBeenCalled();
    });

    it('calls SearchService after 250ms debounce with 3+ char query', () => {
      vi.useFakeTimers();
      component.query.set('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      expect(searchSpy.search).toHaveBeenCalledWith(expect.objectContaining({ q: 'sword' }));
    });

    it('does not call SearchService when query is fewer than 3 chars', () => {
      vi.useFakeTimers();
      component.query.set('sw');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      expect(searchSpy.search).not.toHaveBeenCalled();
    });

    it('does not call SearchService when query is exactly 2 chars', () => {
      vi.useFakeTimers();
      component.query.set('ab');
      fixture.detectChanges();
      vi.advanceTimersByTime(500);
      expect(searchSpy.search).not.toHaveBeenCalled();
    });

    it('calls SearchService when query is exactly 3 chars', () => {
      vi.useFakeTimers();
      component.query.set('abc');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      expect(searchSpy.search).toHaveBeenCalledOnce();
    });

    it('debounces rapid successive inputs to a single call', () => {
      vi.useFakeTimers();
      component.query.set('s');
      fixture.detectChanges();
      vi.advanceTimersByTime(50);
      component.query.set('sw');
      fixture.detectChanges();
      vi.advanceTimersByTime(50);
      component.query.set('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      expect(searchSpy.search).toHaveBeenCalledOnce();
    });
  });

  describe('focusedBrowse — immediate CodexBrowseService dispatch', () => {
    it('calls CodexBrowseService immediately (no debounce) when type is set and query empty', () => {
      vi.useFakeTimers();
      component.activeType.set('WEAPON');
      fixture.detectChanges();
      vi.advanceTimersByTime(0);
      expect(browseSpy.browse).toHaveBeenCalledWith('WEAPON', {}, 0);
    });

    it('passes current filters to browse service', () => {
      component.filters.set({ tier: 2 });
      component.activeType.set('WEAPON');
      fixture.detectChanges();
      expect(browseSpy.browse).toHaveBeenCalledWith('WEAPON', { tier: 2 }, 0);
    });

    it('passes current page to browse service', () => {
      component.currentPage.set(2);
      component.activeType.set('WEAPON');
      fixture.detectChanges();
      expect(browseSpy.browse).toHaveBeenCalledWith('WEAPON', {}, 2);
    });

    it('does not call SearchService in focusedBrowse mode', () => {
      component.activeType.set('ARMOR');
      fixture.detectChanges();
      expect(searchSpy.search).not.toHaveBeenCalled();
    });
  });

  describe('landing state', () => {
    it('clears results signal when returning to landing', () => {
      component.query.set('sword');
      component.query.set('');
      fixture.detectChanges();
      expect(component.results()).toEqual([]);
    });

    it('clears browseResult when returning to landing', () => {
      component.activeType.set('WEAPON');
      fixture.detectChanges();
      component.activeType.set(null);
      fixture.detectChanges();
      expect(component.browseResult()).toBeNull();
    });

    it('does not call any service in landing state', () => {
      expect(searchSpy.search).not.toHaveBeenCalled();
      expect(browseSpy.browse).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('sets error signal true when SearchService fails', () => {
      vi.useFakeTimers();
      searchSpy.search.mockReturnValue(throwError(() => new Error('Network error')));
      component.query.set('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      expect(component.error()).toBe(true);
      expect(component.loading()).toBe(false);
    });

    it('sets error signal true when CodexBrowseService fails', () => {
      browseSpy.browse.mockReturnValue(throwError(() => new Error('Network error')));
      component.activeType.set('WEAPON');
      fixture.detectChanges();
      expect(component.error()).toBe(true);
      expect(component.loading()).toBe(false);
    });
  });

  describe('URL sync', () => {
    it('calls router.navigate with q param when query changes', () => {
      component.onQueryChanged('flame');
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: expect.objectContaining({ q: 'flame' }),
          queryParamsHandling: 'merge',
        })
      );
    });

    it('sets q to null when query is cleared', () => {
      component.onQueryChanged('');
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({ queryParams: expect.objectContaining({ q: null }) })
      );
    });

    it('syncs type param when type is selected', () => {
      component.onTypeSelected('WEAPON');
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({ queryParams: expect.objectContaining({ type: 'WEAPON' }) })
      );
    });

    it('sets type to null when type is cleared', () => {
      component.onTypeSelected(null);
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({ queryParams: expect.objectContaining({ type: null }) })
      );
    });

    it('syncs page param when page > 0', () => {
      component.onPageChanged(3);
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({ queryParams: expect.objectContaining({ page: 3 }) })
      );
    });

    it('sets page to null when page is 0', () => {
      component.onPageChanged(0);
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({ queryParams: expect.objectContaining({ page: null }) })
      );
    });

    it('serializes non-empty filters as JSON string', () => {
      component.onFiltersChanged({ tier: 2 });
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: expect.objectContaining({ filters: JSON.stringify({ tier: 2 }) }),
        })
      );
    });

    it('sets filters to null when filters are empty', () => {
      component.onFiltersChanged({});
      expect(router.navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({ queryParams: expect.objectContaining({ filters: null }) })
      );
    });
  });

  describe('URL initial state hydration', () => {
    it('reads query, type, and page from route snapshot on init', () => {
      expect(component.query()).toBe('');
      expect(component.activeType()).toBeNull();
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('filter auto-promotion (mixedSearch → focusedSearch)', () => {
    it('promotes to ADVERSARY when adversaryType filter applied in mixed search', () => {
      component.query.set('dragon');
      expect(component.viewMode()).toBe('mixedSearch');
      component.onFiltersChanged({ adversaryType: 'BOSS' });
      expect(component.activeType()).toBe('ADVERSARY');
      expect(component.viewMode()).toBe('focusedSearch');
    });

    it('promotes to WEAPON when trait filter applied in mixed search', () => {
      component.query.set('flame');
      component.onFiltersChanged({ trait: 'AGILITY' });
      expect(component.activeType()).toBe('WEAPON');
    });

    it('promotes to WEAPON when range filter applied in mixed search', () => {
      component.query.set('flame');
      component.onFiltersChanged({ range: 'MELEE' });
      expect(component.activeType()).toBe('WEAPON');
    });

    it('promotes to WEAPON when burden filter applied in mixed search', () => {
      component.query.set('flame');
      component.onFiltersChanged({ burden: 'ONE_HANDED' });
      expect(component.activeType()).toBe('WEAPON');
    });

    it('promotes to LOOT when isConsumable filter applied in mixed search', () => {
      component.query.set('potion');
      component.onFiltersChanged({ isConsumable: true });
      expect(component.activeType()).toBe('LOOT');
    });

    it('promotes to DOMAIN_CARD when domainCardType filter applied in mixed search', () => {
      component.query.set('ability');
      component.onFiltersChanged({ domainCardType: 'SPELL' });
      expect(component.activeType()).toBe('DOMAIN_CARD');
    });

    it('does NOT promote when universal filter (tier) applied in mixed search', () => {
      component.query.set('flame');
      component.onFiltersChanged({ tier: 2 });
      expect(component.activeType()).toBeNull();
      expect(component.viewMode()).toBe('mixedSearch');
    });

    it('does NOT promote when universal filter (expansionId) applied in mixed search', () => {
      component.query.set('flame');
      component.onFiltersChanged({ expansionId: 1 });
      expect(component.activeType()).toBeNull();
    });

    it('does NOT promote when already in focusedSearch', () => {
      component.query.set('flame');
      component.activeType.set('ARMOR');
      component.onFiltersChanged({ adversaryType: 'BOSS' });
      expect(component.activeType()).toBe('ARMOR');
    });
  });

  describe('filter preservation across search/browse transitions', () => {
    it('preserves filters when clearing query while type focused (focusedSearch → focusedBrowse)', () => {
      component.query.set('flame');
      component.activeType.set('WEAPON');
      component.filters.set({ tier: 2 });
      fixture.detectChanges();
      expect(component.viewMode()).toBe('focusedSearch');

      component.query.set('');
      fixture.detectChanges();
      expect(component.viewMode()).toBe('focusedBrowse');
      expect(component.filters()).toEqual({ tier: 2 });
      expect(browseSpy.browse).toHaveBeenCalledWith('WEAPON', { tier: 2 }, 0);
    });

    it('preserves filters when adding query while type focused (focusedBrowse → focusedSearch)', () => {
      component.activeType.set('WEAPON');
      component.filters.set({ tier: 1 });
      fixture.detectChanges();
      expect(component.viewMode()).toBe('focusedBrowse');

      component.query.set('sword');
      fixture.detectChanges();
      expect(component.viewMode()).toBe('focusedSearch');
      expect(component.filters()).toEqual({ tier: 1 });
    });
  });

  describe('onQueryChanged', () => {
    it('resets currentPage to 0', () => {
      component.currentPage.set(3);
      component.onQueryChanged('new query');
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('onTypeSelected', () => {
    it('resets currentPage to 0', () => {
      component.currentPage.set(2);
      component.onTypeSelected('ARMOR');
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('onFiltersChanged', () => {
    it('resets currentPage to 0', () => {
      component.currentPage.set(5);
      component.onFiltersChanged({ tier: 1 });
      expect(component.currentPage()).toBe(0);
    });
  });
});

describe('Reference — URL hydration with pre-set query params', () => {
  function buildHydrationTestBed(queryParams: Record<string, string>) {
    const searchSpy = { search: vi.fn().mockReturnValue(of(MOCK_SEARCH_RESPONSE)) };
    const browseSpy = { browse: vi.fn().mockReturnValue(of(MOCK_BROWSE_RESULT)) };

    TestBed.configureTestingModule({
      imports: [Reference],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SearchService, useValue: searchSpy },
        { provide: CodexBrowseService, useValue: browseSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
      ],
    });

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(Reference);
    f.detectChanges();
    return f.componentInstance;
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads query from route snapshot on init', () => {
    const c = buildHydrationTestBed({ q: 'sword' });
    expect(c.query()).toBe('sword');
  });

  it('reads type from route snapshot on init', () => {
    const c = buildHydrationTestBed({ type: 'WEAPON' });
    expect(c.activeType()).toBe('WEAPON');
  });

  it('reads page from route snapshot on init', () => {
    const c = buildHydrationTestBed({ page: '3' });
    expect(c.currentPage()).toBe(3);
  });

  it('parses JSON filters from route snapshot', () => {
    const c = buildHydrationTestBed({ filters: JSON.stringify({ tier: 3 }) });
    expect(c.filters()).toEqual({ tier: 3 });
  });

  it('ignores malformed filters param gracefully', () => {
    const c = buildHydrationTestBed({ filters: 'not-valid-json' });
    expect(c.filters()).toEqual({});
  });
});
