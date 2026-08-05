import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap, NavigationExtras, ParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CardSearch } from './card-search';
import { CodexBrowseService } from '../../../shared/services/codex-browse.service';
import { ExpansionService } from '../../../shared/services/expansion.service';
import { SearchService } from '../../../shared/services/search.service';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { BrowseResult, SearchResponse } from '../../../shared/models/search.model';
import { DEFAULT_PAGE_SIZE } from './card-table.model';

const mockCards: CardData[] = [
  { id: 1, name: 'Longsword', description: 'A blade', cardType: 'weapon', metadata: { tier: 1, trait: 'AGILITY' } },
  { id: 2, name: 'Dagger', description: 'A small blade', cardType: 'weapon', metadata: { tier: 2, trait: 'FINESSE' } },
];

const mockAdversaries: AdversaryData[] = [
  { id: 10, name: 'Goblin', tier: 1, adversaryType: 'MINION' },
];

const mockBrowseResult: BrowseResult = {
  cards: mockCards, adversaries: [], currentPage: 0, totalPages: 1, totalElements: 2,
};

function mockSearchResponse(results: SearchResponse['results'] = []): SearchResponse {
  return { results, totalElements: results.length, totalPages: 1, currentPage: 0, pageSize: 20, query: 'q' };
}

describe('CardSearch', () => {
  let component: CardSearch;
  let fixture: ComponentFixture<CardSearch>;
  let browseService: CodexBrowseService;
  let searchService: SearchService;
  let expansionService: ExpansionService;
  let queryParams: Record<string, string>;
  let queryParamMap$: BehaviorSubject<ParamMap>;

  /** Mirrors the router's `queryParamsHandling: 'merge'` so state round-trips through the URL. */
  function applyNavigation(extras?: NavigationExtras): void {
    for (const [key, value] of Object.entries(extras?.queryParams ?? {})) {
      if (value === null || value === undefined) delete queryParams[key];
      else queryParams[key] = String(value);
    }
    queryParamMap$.next(convertToParamMap({ ...queryParams }));
  }

  function setParams(params: Record<string, string>): void {
    queryParams = { ...params };
    queryParamMap$.next(convertToParamMap({ ...queryParams }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    queryParams = {};
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [CardSearch],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap$.asObservable() } },
      ],
    }).compileComponents();

    browseService = TestBed.inject(CodexBrowseService);
    searchService = TestBed.inject(SearchService);
    expansionService = TestBed.inject(ExpansionService);

    // Stubbed before the component is created: the expansion lookup is kicked off
    // in the constructor.
    vi.spyOn(expansionService, 'getExpansions').mockReturnValue(
      of([{ id: 1, name: 'Core Set' }, { id: 2, name: 'Hope & Fear' }]));

    fixture = TestBed.createComponent(CardSearch);
    component = fixture.componentInstance;

    vi.spyOn(browseService, 'browse').mockReturnValue(of(mockBrowseResult));
    vi.spyOn(searchService, 'search').mockReturnValue(of(mockSearchResponse()));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation((_commands, extras) => {
      applyNavigation(extras);
      return Promise.resolve(true);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('category pills', () => {
    it('renders a pill per category plus an All Types pill', () => {
      fixture.detectChanges();
      const labels = Array.from(fixture.nativeElement.querySelectorAll('.category-pill'))
        .map(el => (el as HTMLElement).textContent?.trim());
      expect(labels).toContain('All Types');
      expect(labels).toContain('Features');
      expect(labels).toContain('Environments');
      expect(labels).toContain('Beastforms');
    });

    it('shows the empty message when no category is selected', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.search-empty')?.textContent).toContain('Select a category');
    });
  });

  describe('URL-synced state', () => {
    it('browses the category named in the type query param on load', () => {
      setParams({ type: 'weapon' });
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 0, DEFAULT_PAGE_SIZE);
    });

    it('restores page and size from the URL without user interaction', () => {
      setParams({ type: 'weapon', page: '2', size: '100' });
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 2, 100);
    });

    it('falls back to defaults for a malformed URL', () => {
      setParams({ type: 'not-a-category', page: 'abc', size: '7' });
      expect(component.activeCategory()).toBeNull();
      expect(component.state().page).toBe(0);
      expect(component.state().size).toBe(DEFAULT_PAGE_SIZE);
    });

    it('writes the selected category into the URL', () => {
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      expect(queryParams['type']).toBe('weapon');
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 0, DEFAULT_PAGE_SIZE);
    });

    it('resets page, query and sort when the category changes', () => {
      setParams({ type: 'weapon', page: '3', q: 'sword', sort: 'tier', dir: 'desc' });
      component.onCategorySelected('armor');
      fixture.detectChanges();
      expect(queryParams).toEqual({ type: 'armor' });
    });

    it('writes the page size into the URL', () => {
      setParams({ type: 'weapon' });
      component.onPageSizeChanged('100');
      fixture.detectChanges();
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 0, 100);
    });
  });

  describe('table rendering', () => {
    it('renders one row per card with a routerLink anchor to the card editor', () => {
      setParams({ type: 'weapon' });
      const links = fixture.nativeElement.querySelectorAll('.card-row__link');
      expect(links.length).toBe(2);
      expect(links[0].getAttribute('href')).toBe('/admin/cards/weapon/1');
      expect(links[0].textContent.trim()).toBe('Longsword');
    });

    it('renders type-specific columns for the active category', () => {
      setParams({ type: 'weapon' });
      const headers = Array.from(fixture.nativeElement.querySelectorAll('th'))
        .map(el => (el as HTMLElement).textContent?.trim().replace(/\s*[▲▼]$/, ''));
      expect(headers).toEqual(['ID', 'Name', 'Tier', 'Trait', 'Range', 'Burden', 'Damage', 'Expansion']);
    });

    it('renders adversary rows linking to the adversary editor', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(
        of({ cards: [], adversaries: mockAdversaries, currentPage: 0, totalPages: 1, totalElements: 1 }));
      setParams({ type: 'adversary' });
      const link = fixture.nativeElement.querySelector('.card-row__link');
      expect(link.getAttribute('href')).toBe('/admin/cards/adversary/10');
    });

    it('collapses the level cards of one subclass path into a single row', () => {
      const subclassCards: CardData[] = ['FOUNDATION', 'SPECIALIZATION', 'MASTERY'].map((level, i) => ({
        id: 100 + i, name: `Warden ${level}`, description: '', cardType: 'subclass' as const,
        metadata: { subclassPathId: 42, subclassPathName: 'Warden of the Elements', level },
      }));
      vi.spyOn(browseService, 'browse').mockReturnValue(
        of({ ...mockBrowseResult, cards: subclassCards, totalElements: 3 }));
      setParams({ type: 'subclass' });

      const links = fixture.nativeElement.querySelectorAll('.card-row__link');
      expect(links.length).toBe(1);
      expect(links[0].getAttribute('href')).toBe('/admin/cards/subclass-path/42');
      expect(links[0].textContent.trim()).toBe('Warden of the Elements');
    });

    it('notes the collapsed row count next to the item range', () => {
      const subclassCards: CardData[] = ['FOUNDATION', 'MASTERY'].map((level, i) => ({
        id: 100 + i, name: `Warden ${level}`, description: '', cardType: 'subclass' as const,
        metadata: { subclassPathId: 42, subclassPathName: 'Warden', level },
      }));
      vi.spyOn(browseService, 'browse').mockReturnValue(
        of({ ...mockBrowseResult, cards: subclassCards, totalElements: 2 }));
      setParams({ type: 'subclass' });
      expect(fixture.nativeElement.querySelector('.toolbar__count').textContent).toContain('1–2 of 2 · 1 rows');
    });

    it('links subclass rows to their parent path editor', () => {
      const subclassCards: CardData[] = [
        { id: 5, name: 'Warden', description: '', cardType: 'subclass', metadata: { subclassPathId: 42 } },
      ];
      vi.spyOn(browseService, 'browse').mockReturnValue(
        of({ ...mockBrowseResult, cards: subclassCards, totalElements: 1 }));
      setParams({ type: 'subclass' });
      expect(fixture.nativeElement.querySelector('.card-row__link').getAttribute('href'))
        .toBe('/admin/cards/subclass-path/42');
    });

    it('falls back to the card route when a subclass row has no path id', () => {
      const subclassCards: CardData[] = [{ id: 5, name: 'Warden', description: '', cardType: 'subclass' }];
      vi.spyOn(browseService, 'browse').mockReturnValue(
        of({ ...mockBrowseResult, cards: subclassCards, totalElements: 1 }));
      setParams({ type: 'subclass' });
      expect(fixture.nativeElement.querySelector('.card-row__link').getAttribute('href'))
        .toBe('/admin/cards/subclass/5');
    });

    it('lists unattached features so they stay discoverable', () => {
      const featureCards: CardData[] = [
        { id: 100, name: 'Shadowblighted', description: 'Add to any adversary.', cardType: 'feature' },
        { id: 101, name: 'Terranamancer', description: 'Add to any adversary.', cardType: 'feature' },
      ];
      vi.spyOn(browseService, 'browse').mockReturnValue(
        of({ cards: featureCards, adversaries: [], currentPage: 0, totalPages: 1, totalElements: 2 }));
      setParams({ type: 'feature' });
      expect(browseService.browse).toHaveBeenCalledWith('FEATURE', {}, 0, DEFAULT_PAGE_SIZE);
      expect(fixture.nativeElement.querySelectorAll('.card-row').length).toBe(2);
    });

    it('shows the result range', () => {
      setParams({ type: 'weapon' });
      expect(fixture.nativeElement.querySelector('.toolbar__count').textContent).toContain('1–2 of 2');
    });
  });

  describe('expansion column', () => {
    it('resolves the expansion name from the cached lookup', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(of({
        ...mockBrowseResult,
        cards: [{ id: 1, name: 'Longsword', description: '', cardType: 'weapon', metadata: { expansionId: 2 } }],
        totalElements: 1,
      }));
      setParams({ type: 'weapon' });
      const cells = Array.from(fixture.nativeElement.querySelectorAll('td'))
        .map(el => (el as HTMLElement).textContent?.trim());
      expect(cells).toContain('Hope & Fear');
    });

    it('prefers a name the API already sent over the lookup', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(of({
        ...mockBrowseResult,
        cards: [{
          id: 1, name: 'Warden', description: '', cardType: 'subclass' as const,
          metadata: { expansionId: 1, expansionName: 'Void' },
        }],
        totalElements: 1,
      }));
      setParams({ type: 'subclass' });
      const cells = Array.from(fixture.nativeElement.querySelectorAll('td'))
        .map(el => (el as HTMLElement).textContent?.trim());
      expect(cells).toContain('Void');
    });

    it('falls back to the raw id when the lookup fails', () => {
      vi.spyOn(expansionService, 'getExpansions').mockReturnValue(throwError(() => new Error('down')));
      vi.spyOn(browseService, 'browse').mockReturnValue(of({
        ...mockBrowseResult,
        cards: [{ id: 1, name: 'Longsword', description: '', cardType: 'weapon', metadata: { expansionId: 9 } }],
        totalElements: 1,
      }));
      const local = TestBed.createComponent(CardSearch);
      queryParams = { type: 'weapon' };
      queryParamMap$.next(convertToParamMap({ ...queryParams }));
      local.detectChanges();
      const cells = Array.from(local.nativeElement.querySelectorAll('td'))
        .map(el => (el as HTMLElement).textContent?.trim());
      expect(cells).toContain('#9');
    });

    it('leaves the cell blank when the entity has no expansion', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(of({
        ...mockBrowseResult,
        cards: [{ id: 1, name: 'Longsword', description: '', cardType: 'weapon' }],
        totalElements: 1,
      }));
      setParams({ type: 'weapon' });
      const expansionCell = fixture.nativeElement.querySelectorAll('.card-row td');
      expect(expansionCell[expansionCell.length - 1].textContent.trim()).toBe('');
    });
  });

  describe('sorting', () => {
    it('writes the sort column and ascending direction into the URL', () => {
      setParams({ type: 'weapon' });
      component.onSortChanged('name');
      fixture.detectChanges();
      expect(queryParams['sort']).toBe('name');
      expect(queryParams['dir']).toBe('asc');
    });

    it('toggles to descending when the same column is clicked again', () => {
      setParams({ type: 'weapon', sort: 'name', dir: 'asc' });
      component.onSortChanged('name');
      fixture.detectChanges();
      expect(queryParams['dir']).toBe('desc');
    });

    it('reorders the rendered rows', () => {
      setParams({ type: 'weapon', sort: 'name', dir: 'asc' });
      const names = Array.from(fixture.nativeElement.querySelectorAll('.card-row__link'))
        .map(el => (el as HTMLElement).textContent?.trim());
      expect(names).toEqual(['Dagger', 'Longsword']);
    });

    it('does not refetch when only the sort changes', () => {
      setParams({ type: 'weapon' });
      (browseService.browse as ReturnType<typeof vi.fn>).mockClear();
      component.onSortChanged('name');
      fixture.detectChanges();
      expect(browseService.browse).not.toHaveBeenCalled();
    });
  });

  describe('search mode', () => {
    it('dispatches a search after the debounce with the active type and page size', () => {
      vi.useFakeTimers();
      setParams({ type: 'weapon' });
      component.onSearchChange('sword');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(searchService.search).toHaveBeenCalledWith({
        q: 'sword', types: ['WEAPON'], page: 0, size: DEFAULT_PAGE_SIZE,
      });
    });

    it('does not search before the debounce elapses', () => {
      vi.useFakeTimers();
      setParams({ type: 'weapon' });
      (searchService.search as ReturnType<typeof vi.fn>).mockClear();
      component.onSearchChange('sword');
      vi.advanceTimersByTime(100);
      expect(searchService.search).not.toHaveBeenCalled();
    });

    it('shows a hint and keeps browse results for a 1-2 char query', () => {
      vi.useFakeTimers();
      setParams({ type: 'weapon' });
      (searchService.search as ReturnType<typeof vi.fn>).mockClear();
      (browseService.browse as ReturnType<typeof vi.fn>).mockClear();

      component.onSearchChange('sw');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();

      expect(searchService.search).not.toHaveBeenCalled();
      expect(browseService.browse).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.search-hint')).toBeTruthy();
      expect(component.rows().length).toBe(2);
    });

    it('re-runs browse when the query is cleared', () => {
      vi.useFakeTimers();
      setParams({ type: 'weapon', q: 'sword' });
      (browseService.browse as ReturnType<typeof vi.fn>).mockClear();
      component.onSearchChange('');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 0, DEFAULT_PAGE_SIZE);
    });

    it('resets to page 0 when a new query is typed', () => {
      vi.useFakeTimers();
      setParams({ type: 'weapon', page: '3' });
      component.onSearchChange('sword');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(queryParams['page']).toBeUndefined();
    });

    it('paginates search results', () => {
      setParams({ type: 'weapon', q: 'sword', page: '1' });
      expect(searchService.search).toHaveBeenCalledWith({
        q: 'sword', types: ['WEAPON'], page: 1, size: DEFAULT_PAGE_SIZE,
      });
    });
  });

  describe('cross-type search', () => {
    it('prompts for a query instead of browsing when All Types is selected', () => {
      setParams({ type: 'all' });
      expect(browseService.browse).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.search-empty').textContent)
        .toContain('at least 3 characters');
    });

    it('searches every searchable type', () => {
      setParams({ type: 'all', q: 'blade' });
      const call = (searchService.search as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.types).toContain('WEAPON');
      expect(call.types).toContain('ADVERSARY');
    });

    it('renders a Type column with per-result routes', () => {
      vi.spyOn(searchService, 'search').mockReturnValue(of(mockSearchResponse([
        { type: 'WEAPON', id: 1, name: 'Longsword', relevanceScore: 1, expandedEntity: null },
      ])));
      setParams({ type: 'all', q: 'blade' });
      const headers = Array.from(fixture.nativeElement.querySelectorAll('th'))
        .map(el => (el as HTMLElement).textContent?.trim().replace(/\s*[▲▼]$/, ''));
      expect(headers).toContain('Type');
      expect(fixture.nativeElement.querySelector('.card-row__type').textContent.trim()).toBe('Weapons');
    });
  });

  describe('error handling', () => {
    it('sets error state when browse fails', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(throwError(() => new Error('fail')));
      setParams({ type: 'weapon' });
      expect(component.error()).toBe(true);
      expect(fixture.nativeElement.querySelector('.search-error')?.textContent).toContain('Failed to load cards');
    });

    it('sets error state when search fails', () => {
      vi.spyOn(searchService, 'search').mockReturnValue(throwError(() => new Error('fail')));
      setParams({ type: 'weapon', q: 'sword' });
      expect(component.error()).toBe(true);
      expect(fixture.nativeElement.querySelector('.search-error')?.textContent).toContain('Failed to load cards');
    });
  });
});
