import {
  Component, ChangeDetectionStrategy, signal, computed, effect, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, ParamMap, convertToParamMap } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, forkJoin, map, of } from 'rxjs';
import { CardTable } from './card-table/card-table';
import { SearchService } from '../../../shared/services/search.service';
import { CodexBrowseService } from '../../../shared/services/codex-browse.service';
import { ExpansionService } from '../../../shared/services/expansion.service';
import { BrowseResult, SearchableEntityType } from '../../../shared/models/search.model';
import { mapSearchResult } from '../../../shared/mappers/search-result.mapper';
import {
  ADMIN_CATEGORIES, ALL_TYPES_COLUMNS, ALL_TYPES_ID, PAGE_SIZES, SortState,
} from './card-table.model';
import { buildRows, categoryForSearchType, rowKey, RowItem, sortRows } from './card-table.utils';
import { MIN_QUERY_LENGTH, readSearchParams, SearchState } from './card-search.params';
import { AdminContentService } from './services/admin-content.service';
import { BulkSrdGroupOutcome, BulkSrdSummary } from './models/bulk-srd.model';
import { bulkResultMessage, extractErrorMessage, groupSelectedRows, summarizeBulkOutcomes } from './bulk-srd.utils';

export { ADMIN_CATEGORIES } from './card-table.model';

@Component({
  selector: 'app-card-search',
  templateUrl: './card-search.html',
  styleUrl: './card-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardTable],
})
export class CardSearch {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browseService = inject(CodexBrowseService);
  private readonly searchService = inject(SearchService);
  private readonly expansionService = inject(ExpansionService);
  private readonly adminContentService = inject(AdminContentService);

  /**
   * Expansion names are looked up once (the service caches with `shareReplay`) and
   * joined to rows client-side, because the list endpoints return only `expansionId`.
   * A failed lookup degrades to `#<id>` rather than blanking the column.
   */
  private readonly expansionNames = toSignal(
    this.expansionService.getExpansions().pipe(
      map(list => new Map(list.map(e => [e.id, e.name]))),
      catchError(() => of(new Map<number, string>())),
    ),
    { initialValue: new Map<number, string>() },
  );

  readonly categories = ADMIN_CATEGORIES;
  readonly allTypesId = ALL_TYPES_ID;
  readonly pageSizes = PAGE_SIZES;
  readonly minQueryLength = MIN_QUERY_LENGTH;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: convertToParamMap({}) as ParamMap,
  });
  /** The URL is the single source of truth, so a new tab restores the exact list. */
  readonly state = computed<SearchState>(() => readSearchParams(this.queryParams()));

  /** Uncommitted textbox value; pushed into the URL after a debounce. */
  readonly queryInput = signal<string | null>(null);
  readonly queryValue = computed(() => this.queryInput() ?? this.state().query);

  readonly loading = signal(false);
  readonly error = signal(false);
  /** Fetched entities, kept unbuilt so rows rebuild when the expansion lookup resolves. */
  private readonly items = signal<RowItem[]>([]);
  /** Items returned by the API before collapsing — the unit pagination counts in. */
  private readonly fetchedCount = signal(0);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  /**
   * The fetch inputs are pulled out as individual computeds so the fetch effect
   * only re-runs when one of them actually changes -- reading `state()` directly
   * would refetch on every sort toggle, since it rebuilds the object each time.
   */
  readonly activeCategory = computed(() => this.state().category);
  private readonly activeQuery = computed(() => this.state().query);
  private readonly activePage = computed(() => this.state().page);
  private readonly activeSize = computed(() => this.state().size);
  readonly isAllTypes = computed(() => this.activeCategory() === ALL_TYPES_ID);
  readonly columns = computed(() => this.isAllTypes()
    ? ALL_TYPES_COLUMNS
    : ADMIN_CATEGORIES.find(c => c.id === this.activeCategory())?.columns ?? []);
  private readonly builtRows = computed(() =>
    buildRows(this.items(), this.columns(), this.expansionNames()));
  /**
   * Rows the table renders, with a successful bulk action's `srd` change applied on top of
   * whatever the fetch returned (see `srdOverrides`) so the Expansion column's `(SRD)` suffix
   * reflects the new state immediately, without a refetch.
   */
  readonly rows = computed(() => {
    const sorted = sortRows(this.builtRows(), this.state().sort);
    const overrides = this.srdOverrides();
    if (overrides.size === 0) return sorted;
    return sorted.map(row => overrides.has(rowKey(row)) ? { ...row, srd: overrides.get(rowKey(row)) } : row);
  });
  readonly hasResults = computed(() => this.builtRows().length > 0);
  readonly isSearchMode = computed(() => this.state().query.length >= MIN_QUERY_LENGTH);
  readonly isShortQuery = computed(() => {
    const len = this.queryValue().trim().length;
    return len > 0 && len < MIN_QUERY_LENGTH;
  });
  /** Cross-type mode has no browse endpoint — it can only ever show search hits. */
  readonly needsQuery = computed(() => this.isAllTypes() && !this.isSearchMode());
  readonly showingRange = computed(() => {
    const total = this.totalElements();
    if (!total) return '';
    const start = this.state().page * this.state().size + 1;
    const range = `${start}–${Math.min(start + this.fetchedCount() - 1, total)} of ${total}`;
    // Subclass levels collapse into one row per path, so row count != item count.
    const rows = this.builtRows().length;
    return rows === this.fetchedCount() ? range : `${range} · ${rows} rows`;
  });

  /**
   * Keys (see `rowKey`) of the rows selected for the bulk SRD-flagging action. Scoped to the
   * currently loaded page of results -- cleared whenever the category, query, or page changes
   * (see `reset`/`executeSearch`/`executeBrowse`) so a selection never silently refers to rows
   * that are no longer on screen.
   */
  readonly selectedKeys = signal<ReadonlySet<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedKeys().size);
  readonly bulkPending = signal(false);
  readonly bulkResult = signal<BulkSrdSummary | null>(null);
  /**
   * `srd` for rows a bulk action changed, keyed by `rowKey` -- applied on top of `builtRows` in
   * `rows` above. Populated only from `updatedIds`, never the whole selection, since a batch's
   * `unknownIds` did not actually change. Cleared on the next fetch (`reset`/`executeSearch`/
   * `executeBrowse`), not by `clearSelection`, since it reflects confirmed server state rather
   * than selection state -- clicking "Clear" should not un-annotate rows that really did change.
   */
  private readonly srdOverrides = signal<ReadonlyMap<string, boolean>>(new Map());

  onRowSelectionToggled(key: string): void {
    const next = new Set(this.selectedKeys());
    if (next.has(key)) next.delete(key); else next.add(key);
    this.selectedKeys.set(next);
    this.bulkResult.set(null);
  }

  onPageSelectionToggled(selectAll: boolean): void {
    const next = new Set(this.selectedKeys());
    for (const row of this.rows()) {
      if (!row.srdType) continue;
      if (selectAll) next.add(rowKey(row)); else next.delete(rowKey(row));
    }
    this.selectedKeys.set(next);
    this.bulkResult.set(null);
  }

  clearSelection(): void {
    this.selectedKeys.set(new Set());
    this.bulkResult.set(null);
  }

  resultMessage(summary: BulkSrdSummary): string {
    return bulkResultMessage(summary);
  }

  /**
   * Applies `srd` to every selected row. Rows are grouped by their backing type first (a
   * cross-type search selection can mix, say, weapons and adversaries) since the endpoint takes
   * one type per call; each group's call is caught independently so one type's failure (a stale
   * id, a permissions error) doesn't hide the others' results -- the summary reports every group.
   */
  runBulkAction(srd: boolean): void {
    const groups = groupSelectedRows(this.rows(), this.selectedKeys());
    if (groups.size === 0) return;

    this.bulkPending.set(true);
    this.bulkResult.set(null);

    const calls = Array.from(groups.entries()).map(([type, ids]) => this.adminContentService
      .updateSrd({ type, ids, srd })
      .pipe(
        map((res): BulkSrdGroupOutcome => (
          { type, requestedIds: ids, updatedIds: res.updatedIds, unknownIds: res.unknownIds }
        )),
        catchError(err => of<BulkSrdGroupOutcome>({
          type, requestedIds: ids, updatedIds: [], unknownIds: [],
          error: extractErrorMessage(err, `Failed to update ${ids.length} item(s).`),
        })),
      ));

    forkJoin(calls)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(outcomes => {
        // Clears the selection without clearSelection()'s bulkResult reset, which would
        // immediately hide the summary this call just produced.
        this.selectedKeys.set(new Set());
        this.bulkResult.set(summarizeBulkOutcomes(srd, outcomes));
        this.bulkPending.set(false);
        this.applySrdOverrides(outcomes, srd);
      });
  }

  private applySrdOverrides(outcomes: readonly BulkSrdGroupOutcome[], srd: boolean): void {
    const next = new Map(this.srdOverrides());
    for (const outcome of outcomes) {
      for (const id of outcome.updatedIds) next.set(`${outcome.type}:${id}`, srd);
    }
    this.srdOverrides.set(next);
  }

  private readonly queryInput$ = new Subject<string>();

  constructor() {
    this.queryInput$
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => this.commitQuery(q));

    effect(() => {
      const category = this.activeCategory();
      const query = this.activeQuery();
      const page = this.activePage();
      const size = this.activeSize();
      if (!category) return;
      if (query.length >= MIN_QUERY_LENGTH) this.executeSearch(category, query, page, size);
      else if (category !== ALL_TYPES_ID) this.executeBrowse(category, page, size);
      else this.reset();
    });
  }

  onCategorySelected(categoryId: string): void {
    this.queryInput.set(null);
    this.patchParams({ type: categoryId, q: null, page: null, sort: null, dir: null });
  }

  onSearchChange(value: string): void {
    this.queryInput.set(value);
    this.queryInput$.next(value.trim());
  }

  /**
   * Sub-minimum queries are never written to the URL: the backend rejects them and
   * re-running the browse for each keystroke would just reload the same page.
   */
  private commitQuery(q: string): void {
    if (q.length > 0 && q.length < MIN_QUERY_LENGTH) return;
    this.patchParams({ q: q || null, page: null });
  }

  onPageChanged(page: number): void {
    this.patchParams({ page: page > 0 ? String(page) : null });
  }

  onPageSizeChanged(size: string): void {
    this.patchParams({ size, page: null });
  }

  /** Toggles direction when the same column is clicked again. */
  onSortChanged(key: string): void {
    const current = this.state().sort;
    const next: SortState = current?.key === key && current.direction === 'asc'
      ? { key, direction: 'desc' }
      : { key, direction: 'asc' };
    this.patchParams({ sort: next.key, dir: next.direction });
  }

  private patchParams(params: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  private reset(): void {
    this.items.set([]);
    this.fetchedCount.set(0);
    this.totalElements.set(0);
    this.totalPages.set(0);
    this.loading.set(false);
    this.error.set(false);
    this.clearSelection();
    this.srdOverrides.set(new Map());
  }

  private searchTypes(category: string): SearchableEntityType[] {
    if (category !== ALL_TYPES_ID) {
      const type = ADMIN_CATEGORIES.find(c => c.id === category)?.type;
      return type ? [type] : [];
    }
    return ADMIN_CATEGORIES.map(c => c.type);
  }

  private executeSearch(category: string, q: string, page: number, size: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.clearSelection();
    this.srdOverrides.set(new Map());
    this.searchService
      .search({ q, types: this.searchTypes(category), page, size })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.items.set(res.results.flatMap<RowItem>(result => {
            const mapped = mapSearchResult(result);
            const rowCategory = categoryForSearchType(mapped.type);
            if (mapped.adversary) return [{ kind: 'adversary', adversary: mapped.adversary }];
            if (mapped.card && rowCategory) return [{ kind: 'card', card: mapped.card, category: rowCategory }];
            return [];
          }));
          this.fetchedCount.set(res.results.length);
          this.totalElements.set(res.totalElements);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
  }

  private executeBrowse(category: string, page: number, size: number): void {
    const type = ADMIN_CATEGORIES.find(c => c.id === category)?.type;
    if (!type) return;
    this.loading.set(true);
    this.error.set(false);
    this.clearSelection();
    this.srdOverrides.set(new Map());
    this.browseService.browse(type, {}, page, size)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.applyBrowseResult(res, category); },
        error: () => { this.error.set(true); this.loading.set(false); },
      });
  }

  private applyBrowseResult(res: BrowseResult, category: string): void {
    this.items.set([
      ...res.cards.map<RowItem>(card => ({ kind: 'card', card, category })),
      ...res.adversaries.map<RowItem>(adversary => ({ kind: 'adversary', adversary })),
    ]);
    this.fetchedCount.set(res.cards.length + res.adversaries.length);
    this.totalElements.set(res.totalElements);
    this.totalPages.set(res.totalPages);
    this.loading.set(false);
  }
}
