import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { SearchService } from '../../shared/services/search.service';
import { DomainService } from '../../shared/services/domain.service';
import { CodexBrowseService, BrowsableType } from './services/codex-browse.service';
import { BrowseResult, SearchFilters, SearchableEntityType, typeLabels } from './models/search.model';
import { MappedSearchResult, mapSearchResult } from './mappers/search-result.mapper';
import { CodexSearchBar } from './components/codex-search-bar/codex-search-bar';
import { TypeFacetTabs } from './components/type-facet-tabs/type-facet-tabs';
import { FilterRail, FilterOption } from './components/filter-rail/filter-rail';
import { RefineSheet } from './components/refine-sheet/refine-sheet';
import { LandingTypeGrid } from './components/landing-type-grid/landing-type-grid';
import { ResultSection } from './components/result-section/result-section';
import { PaginationControls } from './components/pagination-controls/pagination-controls';
import { CodexSkeleton } from './components/codex-skeleton/codex-skeleton';
import { CodexEmptyState } from './components/codex-empty-state/codex-empty-state';
import { DaggerheartCard } from '../../shared/components/daggerheart-card/daggerheart-card';
import { AdversaryCard } from '../../shared/components/adversary-card/adversary-card';

export type ViewMode = 'landing' | 'mixedSearch' | 'focusedSearch' | 'focusedBrowse';

export interface MixedSection {
  type: SearchableEntityType;
  results: MappedSearchResult[];
  totalCount: number;
  topScore: number;
}

const TYPE_FROM_FILTER: Partial<Record<keyof SearchFilters, SearchableEntityType>> = {
  adversaryType: 'ADVERSARY', trait: 'WEAPON', range: 'WEAPON', burden: 'WEAPON',
  isConsumable: 'LOOT', domainCardType: 'DOMAIN_CARD', associatedDomainId: 'DOMAIN_CARD',
  level: 'DOMAIN_CARD',
};

const MIXED_VIEW_CAP = 5;

@Component({
  selector: 'app-reference',
  templateUrl: './reference.html',
  styleUrl: './reference.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodexSearchBar, TypeFacetTabs, FilterRail, RefineSheet, LandingTypeGrid, ResultSection, PaginationControls, CodexSkeleton, CodexEmptyState, DaggerheartCard, AdversaryCard],
})
export class Reference implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private readonly browseService = inject(CodexBrowseService);
  private readonly domainService = inject(DomainService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly activeType = signal<SearchableEntityType | null>(null);
  readonly filters = signal<SearchFilters>({});
  readonly refineSheetOpen = signal(false);
  readonly currentPage = signal(0);
  readonly results = signal<MappedSearchResult[]>([]);
  readonly browseResult = signal<BrowseResult | null>(null);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly domainOptions = signal<FilterOption[]>([]);

  readonly viewMode = computed<ViewMode>(() => {
    const q = this.query().trim();
    const t = this.activeType();
    if (!q && !t) return 'landing';
    if (!q) return 'focusedBrowse';
    return t ? 'focusedSearch' : 'mixedSearch';
  });

  readonly mixedSections = computed<MixedSection[]>(() => {
    const results = this.results();
    const grouped = new Map<SearchableEntityType, MappedSearchResult[]>();
    for (const r of results) {
      // FEATURE results are silently dropped in mixed search — features have no
      // standalone card design and are not a browsable type in the UI.
      if (r.type === 'FEATURE') continue;
      const existing = grouped.get(r.type) ?? [];
      grouped.set(r.type, [...existing, r]);
    }
    const sections: MixedSection[] = [];
    for (const [type, items] of grouped.entries()) {
      const topScore = Math.max(...items.map(i => i.relevanceScore ?? 0));
      sections.push({ type, results: items.slice(0, MIXED_VIEW_CAP), totalCount: items.length, topScore });
    }
    return sections.sort((a, b) => b.topScore - a.topScore);
  });

  readonly focusedResults = computed<MappedSearchResult[]>(() => {
    const mode = this.viewMode();
    if (mode === 'focusedSearch') return this.results();
    if (mode === 'focusedBrowse') {
      const br = this.browseResult();
      if (!br) return [];
      return [
        ...br.cards.map(card => ({ type: this.activeType()!, id: card.id, name: card.name, relevanceScore: null, card })),
        ...br.adversaries.map(adv => ({ type: this.activeType()!, id: adv.id, name: adv.name, relevanceScore: null, adversary: adv })),
      ];
    }
    return [];
  });

  readonly focusedTotalPages = computed<number>(() => {
    const mode = this.viewMode();
    if (mode === 'focusedBrowse') return this.browseResult()?.totalPages ?? 0;
    return this.totalPages();
  });

  readonly isShortQuery = computed<boolean>(() => {
    const q = this.query().trim();
    return q.length > 0 && q.length < 3;
  });

  readonly hasActiveFilters = computed<boolean>(() => Object.keys(this.filters()).length > 0);

  readonly searchPlaceholder = computed<string>(() => {
    const type = this.activeType();
    if (type) {
      const label = this.typeLabelFor(type).toLowerCase();
      return `Search within ${label}…`;
    }
    return 'Search the archives…';
  });

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => this.runSearch(q));
    effect(() => {
      const mode = this.viewMode();
      const q = this.query().trim();
      const type = this.activeType();
      const filters = this.filters();
      const page = this.currentPage();
      if (mode === 'landing') { this.results.set([]); this.browseResult.set(null); return; }
      if (mode === 'focusedBrowse') { this.executeBrowse(type as BrowsableType, filters, page); return; }
      this.searchInput$.next(q);
    });
  }

  ngOnInit(): void {
    const p = this.route.snapshot.queryParams;
    if (p['q']) this.query.set(p['q'] as string);
    if (p['type']) this.activeType.set(p['type'] as SearchableEntityType);
    if (p['page']) this.currentPage.set(Number(p['page']));
    if (p['filters']) { try { this.filters.set(JSON.parse(p['filters'] as string) as SearchFilters); } catch { /* ignore */ } }
    this.loadDomainOptions();
  }

  private loadDomainOptions(): void {
    this.domainService.getDomainsPaginated(0, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => this.domainOptions.set(
          res.cards.map(c => ({ value: String(c.id), label: c.name })),
        ),
        error: () => { /* silent — filter select simply won't appear */ },
      });
  }

  onQueryChanged(q: string): void {
    this.currentPage.set(0);
    this.query.set(q);
    this.syncUrl();
  }

  onTypeSelected(type: SearchableEntityType | null): void {
    this.currentPage.set(0);
    this.activeType.set(type);
    this.syncUrl();
  }

  onRefineOpen(): void {
    this.refineSheetOpen.set(true);
  }

  onRefineClose(): void {
    this.refineSheetOpen.set(false);
  }

  onFiltersChanged(newFilters: SearchFilters): void {
    if (this.viewMode() === 'mixedSearch') {
      const promoted = (Object.keys(newFilters) as (keyof SearchFilters)[])
        .map(k => TYPE_FROM_FILTER[k]).find(Boolean);
      if (promoted) this.activeType.set(promoted);
    }
    this.currentPage.set(0);
    this.filters.set(newFilters);
    this.syncUrl();
  }

  onPageChanged(page: number): void { this.currentPage.set(page); this.syncUrl(); }

  onClearFilters(): void {
    this.filters.set({});
    this.currentPage.set(0);
    this.syncUrl();
  }

  onViewAll(type: SearchableEntityType): void {
    this.activeType.set(type);
    this.currentPage.set(0);
    this.syncUrl();
  }

  onAllTypes(): void {
    this.activeType.set(null);
    this.currentPage.set(0);
    this.syncUrl();
  }

  typeLabelFor(type: SearchableEntityType): string {
    return typeLabels[type] ?? type;
  }

  private runSearch(q: string): void {
    if (q.length < 3) return;
    this.loading.set(true);
    this.error.set(false);
    const type = this.activeType();
    this.searchService
      .search({ q, types: type ? [type] : undefined, ...this.filters(), page: this.currentPage() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.results.set(res.results.map(mapSearchResult));
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
  }

  private executeBrowse(type: BrowsableType, filters: SearchFilters, page: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.browseService.browse(type, filters as Record<string, unknown>, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.browseResult.set(res); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
  }

  private syncUrl(): void {
    const filtersStr = Object.keys(this.filters()).length ? JSON.stringify(this.filters()) : null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.query() || null, type: this.activeType() ?? null,
        page: this.currentPage() > 0 ? this.currentPage() : null, filters: filtersStr,
      },
      queryParamsHandling: 'merge',
    });
  }
}
