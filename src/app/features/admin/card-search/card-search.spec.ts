import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CardSearch } from './card-search';
import { CodexBrowseService } from '../../../shared/services/codex-browse.service';
import { SearchService } from '../../../shared/services/search.service';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { BrowseResult, SearchResponse } from '../../../shared/models/search.model';

const mockCards: CardData[] = [
  { id: 1, name: 'Longsword', description: 'A blade', cardType: 'weapon' },
  { id: 2, name: 'Dagger', description: 'A small blade', cardType: 'weapon' },
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
  let router: Router;
  let browseService: CodexBrowseService;
  let searchService: SearchService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSearch],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CardSearch);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    browseService = TestBed.inject(CodexBrowseService);
    searchService = TestBed.inject(SearchService);

    vi.spyOn(browseService, 'browse').mockReturnValue(of(mockBrowseResult));
    vi.spyOn(searchService, 'search').mockReturnValue(of(mockSearchResponse()));
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show category pills', () => {
    fixture.detectChanges();
    const pills = fixture.nativeElement.querySelectorAll('.category-pill');
    expect(pills.length).toBeGreaterThan(0);
  });

  it('should include a Features category among the pills', () => {
    fixture.detectChanges();
    const pillLabels = Array.from(fixture.nativeElement.querySelectorAll('.category-pill'))
      .map((el) => (el as HTMLElement).textContent?.trim());
    expect(pillLabels).toContain('Features');
  });

  it('should show empty message when no category selected', () => {
    fixture.detectChanges();
    const emptyMessage = fixture.nativeElement.querySelector('.search-empty');
    expect(emptyMessage?.textContent).toContain('Select a category');
  });

  describe('browse mode', () => {
    it('calls browse with empty filters (no isOfficial) on category select', () => {
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 0);
      const grid = fixture.nativeElement.querySelector('app-card-selection-grid');
      expect(grid).toBeTruthy();
    });

    it('re-browses on page change with the new page number', () => {
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      (browseService.browse as ReturnType<typeof vi.fn>).mockClear();
      vi.spyOn(browseService, 'browse').mockReturnValue(of({ ...mockBrowseResult, currentPage: 1, totalPages: 3 }));

      component.onPageChanged(1);
      fixture.detectChanges();
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 1);
    });

    it('renders pagination controls when totalPages > 1', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(of({ ...mockBrowseResult, totalPages: 3 }));
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      const pagination = fixture.nativeElement.querySelector('app-pagination-controls');
      expect(pagination).toBeTruthy();
    });

    it('calls browse with type FEATURE on the feature category, including unattached feature rows', () => {
      const featureCards: CardData[] = [
        { id: 100, name: 'Shadowblighted', description: 'You may add this to any adversary.', cardType: 'feature' },
        { id: 101, name: 'Terranamancer', description: 'You may add this to any adversary.', cardType: 'feature' },
      ];
      vi.spyOn(browseService, 'browse').mockReturnValue(of({ cards: featureCards, adversaries: [], currentPage: 0, totalPages: 1, totalElements: 2 }));
      fixture.detectChanges();
      component.onCategorySelected('feature');
      fixture.detectChanges();

      expect(browseService.browse).toHaveBeenCalledWith('FEATURE', {}, 0);
      const grid = fixture.nativeElement.querySelector('app-card-selection-grid');
      expect(grid).toBeTruthy();
      const cards = fixture.nativeElement.querySelectorAll('app-daggerheart-card');
      expect(cards.length).toBe(2);
    });
  });

  describe('search mode', () => {
    it('dispatches a search call after the debounce with no isOfficial key', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      component.onSearchChange('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);

      expect(searchService.search).toHaveBeenCalledWith({ q: 'sword', types: ['WEAPON'], page: 0 });
    });

    it('does not search before the debounce elapses', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      (searchService.search as ReturnType<typeof vi.fn>).mockClear();

      component.onSearchChange('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(100);
      expect(searchService.search).not.toHaveBeenCalled();
    });

    it('does not search on a 1-2 char query, shows hint, and retains previous browse results', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      (searchService.search as ReturnType<typeof vi.fn>).mockClear();
      (browseService.browse as ReturnType<typeof vi.fn>).mockClear();

      component.onSearchChange('sw');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);

      expect(searchService.search).not.toHaveBeenCalled();
      expect(browseService.browse).not.toHaveBeenCalled();
      const hint = fixture.nativeElement.querySelector('.search-hint');
      expect(hint).toBeTruthy();
      expect(component.cards()).toEqual(mockCards);
    });

    it('re-runs browse when the query is cleared', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      component.onSearchChange('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      (browseService.browse as ReturnType<typeof vi.fn>).mockClear();

      component.onSearchChange('');
      fixture.detectChanges();
      expect(browseService.browse).toHaveBeenCalledWith('WEAPON', {}, 0);
    });

    it('paginates search results by calling search with the new page', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      component.onSearchChange('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      (searchService.search as ReturnType<typeof vi.fn>).mockClear();

      component.onPageChanged(1);
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      expect(searchService.search).toHaveBeenCalledWith({ q: 'sword', types: ['WEAPON'], page: 1 });
    });

    it('suppresses a stale debounced search when the category changes mid-debounce', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      component.onSearchChange('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(100);
      (searchService.search as ReturnType<typeof vi.fn>).mockClear();

      component.onCategorySelected('armor');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);

      expect(searchService.search).not.toHaveBeenCalled();
      expect(component.searchQuery()).toBe('');
      expect(component.currentPage()).toBe(0);
    });
  });

  describe('render paths', () => {
    it('renders adversary cards for the adversary category', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(of({ cards: [], adversaries: mockAdversaries, currentPage: 0, totalPages: 1, totalElements: 1 }));
      fixture.detectChanges();
      component.onCategorySelected('adversary');
      fixture.detectChanges();
      const adversaryCards = fixture.nativeElement.querySelectorAll('app-adversary-card');
      expect(adversaryCards.length).toBe(1);
    });

    it('renders the subclass path selector for the subclass category', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(of({ ...mockBrowseResult, cards: mockCards }));
      fixture.detectChanges();
      component.onCategorySelected('subclass');
      fixture.detectChanges();
      const selector = fixture.nativeElement.querySelector('app-subclass-path-selector');
      expect(selector).toBeTruthy();
    });

    it('navigates to the subclass path when a subclass card with metadata is selected', () => {
      component.onSubclassCardSelected({ id: 1, name: 'Foo', description: '', cardType: 'subclass', metadata: { subclassPathId: 42 } });
      expect(router.navigate).toHaveBeenCalledWith(['/admin/cards/subclass-path', 42]);
    });

    it('does not navigate when a subclass card has no subclassPathId metadata', () => {
      component.onSubclassCardSelected({ id: 1, name: 'Foo', description: '', cardType: 'subclass' });
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('navigates to the card detail route on card selection', () => {
      component.activeCategory.set('weapon');
      component.onCardSelected(mockCards[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/cards', 'weapon', 1]);
    });

    it('navigates to the adversary detail route on adversary selection', () => {
      component.onAdversarySelected(mockAdversaries[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/cards', 'adversary', 10]);
    });

    it('navigates to the feature detail route on feature selection, making an unattached feature discoverable', () => {
      component.activeCategory.set('feature');
      component.onCardSelected({ id: 200, name: 'Shadowblighted', description: '', cardType: 'feature' });
      expect(router.navigate).toHaveBeenCalledWith(['/admin/cards', 'feature', 200]);
    });
  });

  describe('error handling', () => {
    it('sets error state when browse fails', () => {
      vi.spyOn(browseService, 'browse').mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      expect(component.error()).toBe(true);
      const errorEl = fixture.nativeElement.querySelector('.search-error');
      expect(errorEl?.textContent).toContain('Failed to load cards');
    });

    it('sets error state when search fails', () => {
      vi.useFakeTimers();
      vi.spyOn(searchService, 'search').mockReturnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      component.onCategorySelected('weapon');
      fixture.detectChanges();
      component.onSearchChange('sword');
      fixture.detectChanges();
      vi.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(component.error()).toBe(true);
      const errorEl = fixture.nativeElement.querySelector('.search-error');
      expect(errorEl?.textContent).toContain('Failed to load cards');
    });
  });
});
