import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SearchService } from '../../shared/services/search.service';
import { CodexBrowseService, BrowsableType } from './services/codex-browse.service';
import { BrowseResult, SearchFilters, SearchableEntityType } from './models/search.model';
import { MappedSearchResult, mapSearchResult } from './mappers/search-result.mapper';

export type ViewMode = 'landing' | 'mixedSearch' | 'focusedSearch' | 'focusedBrowse';

const TYPE_FROM_FILTER: Partial<Record<keyof SearchFilters, SearchableEntityType>> = {
  adversaryType: 'ADVERSARY', trait: 'WEAPON', range: 'WEAPON', burden: 'WEAPON',
  isConsumable: 'LOOT', domainCardType: 'DOMAIN_CARD', associatedDomainId: 'DOMAIN_CARD',
};

@Component({
  selector: 'app-reference',
  templateUrl: './reference.html',
  styleUrl: './reference.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class Reference implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private readonly browseService = inject(CodexBrowseService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly activeType = signal<SearchableEntityType | null>(null);
  readonly filters = signal<SearchFilters>({});
  readonly currentPage = signal(0);
  readonly results = signal<MappedSearchResult[]>([]);
  readonly browseResult = signal<BrowseResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly viewMode = computed<ViewMode>(() => {
    const q = this.query().trim();
    const t = this.activeType();
    if (!q && !t) return 'landing';
    if (!q) return 'focusedBrowse';
    return t ? 'focusedSearch' : 'mixedSearch';
  });

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
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

  private runSearch(q: string): void {
    if (q.length < 3) return;
    this.loading.set(true);
    this.error.set(false);
    const type = this.activeType();
    this.searchService
      .search({ q, types: type ? [type] : undefined, ...this.filters(), page: this.currentPage() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.results.set(res.results.map(mapSearchResult)); this.loading.set(false); },
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
