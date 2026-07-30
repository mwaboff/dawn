import {
  Component, ChangeDetectionStrategy, signal, computed, effect, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { CardSelectionGrid } from '../../../shared/components/card-selection-grid/card-selection-grid';
import { CardSkeleton } from '../../../shared/components/card-skeleton/card-skeleton';
import { SubclassPathSelector } from '../../../shared/components/subclass-path-selector/subclass-path-selector';
import { AdversaryCard } from '../../../shared/components/adversary-card/adversary-card';
import { PaginationControls } from '../../../shared/components/pagination-controls/pagination-controls';
import { SearchService } from '../../../shared/services/search.service';
import { CodexBrowseService, BrowsableType } from '../../../shared/services/codex-browse.service';
import { BrowseResult } from '../../../shared/models/search.model';
import { MappedSearchResult, mapSearchResult } from '../../../shared/mappers/search-result.mapper';

export const ADMIN_CATEGORIES: { id: string; label: string; type: BrowsableType }[] = [
  { id: 'domain', label: 'Domains', type: 'DOMAIN' },
  { id: 'class', label: 'Classes', type: 'CLASS' },
  { id: 'subclass', label: 'Subclasses', type: 'SUBCLASS_CARD' },
  { id: 'ancestry', label: 'Ancestries', type: 'ANCESTRY_CARD' },
  { id: 'community', label: 'Communities', type: 'COMMUNITY_CARD' },
  { id: 'domainCard', label: 'Domain Cards', type: 'DOMAIN_CARD' },
  { id: 'weapon', label: 'Weapons', type: 'WEAPON' },
  { id: 'armor', label: 'Armor', type: 'ARMOR' },
  { id: 'loot', label: 'Loot', type: 'LOOT' },
  { id: 'adversary', label: 'Adversaries', type: 'ADVERSARY' },
  { id: 'environment', label: 'Environments', type: 'ENVIRONMENT' },
  { id: 'companion', label: 'Companions', type: 'COMPANION' },
  { id: 'feature', label: 'Features', type: 'FEATURE' },
];

const MIN_QUERY_LENGTH = 3;

@Component({
  selector: 'app-card-search',
  templateUrl: './card-search.html',
  styleUrl: './card-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardSelectionGrid, CardSkeleton, SubclassPathSelector, AdversaryCard, PaginationControls],
})
export class CardSearch {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browseService = inject(CodexBrowseService);
  private readonly searchService = inject(SearchService);

  readonly categories = ADMIN_CATEGORIES;
  readonly activeCategory = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly currentPage = signal(0);
  readonly loading = signal(false);
  readonly error = signal(false);
  private readonly browseResult = signal<BrowseResult | null>(null);
  private readonly searchResults = signal<MappedSearchResult[]>([]);
  private readonly searchTotalPages = signal(0);

  private readonly activeType = computed<BrowsableType | null>(
    () => this.categories.find(c => c.id === this.activeCategory())?.type ?? null,
  );
  readonly isSearchMode = computed(() => this.searchQuery().trim().length >= MIN_QUERY_LENGTH);
  readonly isShortQuery = computed(() => {
    const len = this.searchQuery().trim().length;
    return len > 0 && len < MIN_QUERY_LENGTH;
  });

  readonly cards = computed<CardData[]>(() => this.isSearchMode()
    ? this.searchResults().filter(r => r.card).map(r => r.card!)
    : this.browseResult()?.cards ?? []);
  readonly adversaries = computed<AdversaryData[]>(() => this.isSearchMode()
    ? this.searchResults().filter(r => r.adversary).map(r => r.adversary!)
    : this.browseResult()?.adversaries ?? []);
  readonly totalPages = computed(() => this.isSearchMode()
    ? this.searchTotalPages()
    : this.browseResult()?.totalPages ?? 0);
  readonly hasResults = computed(() => this.cards().length > 0 || this.adversaries().length > 0);
  readonly isAdversaryCategory = computed(() => this.activeCategory() === 'adversary');
  readonly isSubclassCategory = computed(() => this.activeCategory() === 'subclass');

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => this.runSearch(q));
    effect(() => {
      const type = this.activeType();
      const q = this.searchQuery().trim();
      const page = this.currentPage();
      if (!type) return;
      if (!q) { this.executeBrowse(type, page); return; }
      this.searchInput$.next(q);
    });
  }

  onCategorySelected(categoryId: string): void {
    this.searchQuery.set('');
    this.currentPage.set(0);
    this.browseResult.set(null);
    this.searchResults.set([]);
    this.activeCategory.set(categoryId);
  }

  onSearchChange(value: string): void {
    this.currentPage.set(0);
    this.searchQuery.set(value);
  }

  onPageChanged(page: number): void {
    this.currentPage.set(page);
  }

  onCardSelected(card: CardData): void {
    const category = this.activeCategory();
    if (category) this.router.navigate(['/admin/cards', category, card.id]);
  }

  onAdversarySelected(adversary: AdversaryData): void {
    this.router.navigate(['/admin/cards', 'adversary', adversary.id]);
  }

  onSubclassCardSelected(card: CardData): void {
    const pathId = card.metadata?.['subclassPathId'] as number | undefined;
    if (pathId) this.router.navigate(['/admin/cards/subclass-path', pathId]);
  }

  private runSearch(q: string): void {
    // Stale-debounce guard: the query may have changed/cleared (e.g. category
    // switch) between emission and this callback firing.
    if (q !== this.searchQuery().trim() || q.length < MIN_QUERY_LENGTH) return;
    const type = this.activeType();
    if (!type) return;
    this.loading.set(true);
    this.error.set(false);
    this.searchService
      .search({ q, types: [type], page: this.currentPage() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.searchResults.set(res.results.map(mapSearchResult));
          this.searchTotalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
  }

  private executeBrowse(type: BrowsableType, page: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.browseService.browse(type, {}, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.browseResult.set(res); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
  }
}
