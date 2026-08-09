import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, merge, of, switchMap, tap } from 'rxjs';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import { CatalogHit, CatalogQuery, CatalogResult, ItemCatalogService } from '../../services/item-catalog.service';
import {
  CatalogCardEntry,
  armorCatalogEntry,
  catalogEntryKey,
  lootCatalogEntry,
  weaponCatalogEntry,
} from '../../utils/catalog-card.mapper';
import { InventoryItemType } from '../../utils/inventory-card.mapper';
import { ItemFilterBar, ItemFilterType } from './components/item-filter-bar/item-filter-bar';
import { ItemFinderResult } from './components/item-finder-result/item-finder-result';

const TYPES_BY_FILTER: Record<ItemFilterType, readonly InventoryItemType[]> = {
  all: ['weapon', 'armor', 'loot'],
  weapon: ['weapon'],
  armor: ['armor'],
  loot: ['loot'],
};

const TYPE_LABELS: Record<InventoryItemType, string> = {
  weapon: 'Weapons',
  armor: 'Armor',
  loot: 'Loot',
};

/** The three things a player can write for themselves, as data rather than three template buttons. */
const CREATE_KINDS: readonly { readonly type: InventoryItemType; readonly label: string }[] = [
  { type: 'weapon', label: 'Write a weapon' },
  { type: 'armor', label: 'Write armor' },
  { type: 'loot', label: 'Write loot' },
];

let nextFinderId = 0;

/** One type's worth of results, with the count and whether the catalogue had more to give. */
export interface ResultGroup {
  readonly type: InventoryItemType;
  readonly label: string;
  readonly entries: readonly CatalogCardEntry[];
  /** "6", or "25 of 112" when the page cap kept some back. */
  readonly countLabel: string;
  readonly truncated: boolean;
}

const EMPTY_RESULT: CatalogResult = { hits: [], totals: new Map() };

/**
 * One search field over everything a character can carry.
 *
 * The beta sheet's predecessor made you say what kind of thing you were adding before you could
 * look for it: pick the Weapons tab, then search weapons. That is backwards -- a player knows the
 * name of the thing they picked up, not which of three tables the app filed it under. Here the
 * field searches weapons, armor and loot together and the type is a filter you reach for only when
 * the results are too broad.
 *
 * Results are grouped under a type rule rather than run together, because "one search over
 * everything" is invisible in a flat list -- and the rule is also where each type's count and its
 * truncation live, so the per-type page cap is stated rather than silently swallowing matches.
 *
 * The dialog stays open after an add, because loot arrives in handfuls: adding six things should
 * be six clicks, not six round trips through a button, a tab and a search box.
 */
@Component({
  selector: 'app-item-finder',
  templateUrl: './item-finder.html',
  styleUrl: './item-finder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemFilterBar, ItemFinderResult, ModalShell],
})
export class ItemFinder {
  private readonly catalog = inject(ItemCatalogService);

  /** The viewing character's proficiency, so weapon damage reads as this character would roll it. */
  readonly proficiency = input(1);
  /** The viewer, so homebrew they wrote can be marked as theirs. */
  readonly currentUserId = input<number | null>(null);
  /**
   * A failed add, reported by the sheet. It has to render in here: the sheet's own error banner sits
   * behind the backdrop, so while this dialog is open a failure would otherwise be invisible and the
   * row would keep claiming the add worked.
   */
  readonly addError = input<string | null>(null);

  readonly itemAdded = output<{ type: InventoryItemType; item: CatalogCardEntry['item'] }>();
  readonly createRequested = output<InventoryItemType>();
  readonly closed = output<void>();

  readonly searchTerm = signal('');
  readonly filterType = signal<ItemFilterType>('all');
  readonly customOnly = signal(false);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  /** True until the first response lands, which is the only time there is nothing to keep on screen. */
  readonly firstLoad = signal(true);
  /** What the last add did, for the live region -- the dialog stays open, so nothing else says so. */
  readonly lastAdded = signal<string | null>(null);

  private readonly result = signal<CatalogResult>(EMPTY_RESULT);
  /** How many of each item this visit has added, which is both the row state and the announcement. */
  private readonly addCounts = signal<ReadonlyMap<string, number>>(new Map());
  private readonly retryRequests = new Subject<void>();
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly createKinds = CREATE_KINDS;
  readonly searchId = `item-finder-search-${nextFinderId++}`;

  private readonly query = computed<CatalogQuery>(() => ({
    term: this.searchTerm().trim(),
    types: TYPES_BY_FILTER[this.filterType()],
    customOnly: this.customOnly(),
  }));

  readonly groups = computed<ResultGroup[]>(() => {
    const proficiency = this.proficiency();
    const viewer = this.currentUserId();
    const { hits, totals } = this.result();
    const byType = new Map<InventoryItemType, CatalogCardEntry[]>();
    for (const hit of hits) {
      const entry = toEntry(hit, proficiency, viewer);
      const group = byType.get(entry.type);
      if (group) group.push(entry);
      else byType.set(entry.type, [entry]);
    }
    // Insertion order is the service's requested type order, so the groups read weapons, armor, loot.
    return [...byType].map(([type, entries]) => {
      // The server's own count, not `entries.length >= CATALOG_PAGE_SIZE`: that guess called a
      // complete list of exactly 25 truncated, and could never say how many were missing.
      const total = totals.get(type) ?? entries.length;
      const truncated = total > entries.length;
      return {
        type,
        label: TYPE_LABELS[type],
        entries,
        countLabel: truncated ? `${entries.length} of ${total}` : `${entries.length}`,
        truncated,
      };
    });
  });

  readonly resultCount = computed(() => this.result().hits.length);
  readonly hasResults = computed(() => this.result().hits.length > 0);

  /** Whether a filter is hiding anything, i.e. whether "search all gear" would do something. */
  readonly isNarrowed = computed(() => this.filterType() !== 'all' || this.customOnly());

  /**
   * The progress line, shown only when there is nothing on screen to dim instead: the opening load,
   * and any refetch that starts from an already-empty list. Otherwise the previous results stay
   * mounted and `--busy` carries the wait -- a query that started empty had nothing to keep, and
   * without this the panel simply went blank until the response landed.
   */
  readonly busyMessage = computed(() => {
    if (this.loadError() || this.hasResults()) return null;
    if (this.firstLoad()) return 'Loading gear…';
    return this.loading() ? 'Searching gear…' : null;
  });

  readonly emptyMessage = computed(() => {
    if (this.loading() || this.loadError() || this.hasResults()) return null;
    const term = this.searchTerm().trim();
    if (term && this.isNarrowed()) return `No gear matches “${term}” with these filters.`;
    if (term) return `No gear matches “${term}”.`;
    if (this.customOnly()) {
      return 'No custom gear yet — nothing you have written, nothing shared with your campaigns, and nothing shared publicly.';
    }
    return 'No gear found.';
  });

  /** Read only when the list has settled, so a search announces its result rather than its progress. */
  readonly searchStatus = computed(() => {
    if (this.loading()) return '';
    if (this.loadError()) return 'Could not load gear.';
    return `${this.resultCount()} results.`;
  });

  constructor() {
    merge(
      toObservable(this.query).pipe(
        debounceTime(250),
        distinctUntilChanged(
          (a, b) => a.term === b.term && a.types === b.types && a.customOnly === b.customOnly,
        ),
      ),
      this.retryRequests.pipe(map(() => this.query())),
    )
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.loadError.set(false);
        }),
        switchMap(query =>
          this.catalog.find(query).pipe(
            catchError(() => {
              this.loadError.set(true);
              return of(EMPTY_RESULT);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      // A hand-rolled loading/error/data triple rather than the shared request-state helper
      // (dawn/CLAUDE.md): this source is a merge of a debounced query stream and a retry subject,
      // which the helper has no way to express.
      .subscribe(result => {
        this.result.set(result);
        this.loading.set(false);
        this.firstLoad.set(false);
      });
  }

  isAdded(entry: CatalogCardEntry): boolean {
    return this.addCounts().has(catalogEntryKey(entry));
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  /** Focus has to be moved deliberately: `@if` destroys the button the user just activated. */
  clearSearch(): void {
    this.searchTerm.set('');
    this.focusSearch();
  }

  retry(): void {
    this.retryRequests.next();
    this.focusSearch();
  }

  /** Drops every filter back to its opening state -- the way out of an over-narrowed empty list. */
  searchEverything(): void {
    this.filterType.set('all');
    this.customOnly.set(false);
  }

  onAdd(entry: CatalogCardEntry): void {
    this.itemAdded.emit({ type: entry.type, item: entry.item });
    const key = catalogEntryKey(entry);
    const count = (this.addCounts().get(key) ?? 0) + 1;
    this.addCounts.update(counts => new Map(counts).set(key, count));
    // The count is in the message so a second copy of the same item is a new string: an identical
    // one would not mutate the live region, and the repeat would be announced as nothing at all.
    this.lastAdded.set(
      count > 1 ? `${entry.name} added to inventory. ${count} so far.` : `${entry.name} added to inventory.`,
    );
  }

  onCreate(type: InventoryItemType): void {
    this.createRequested.emit(type);
  }

  onClose(): void {
    this.closed.emit();
  }

  private focusSearch(): void {
    this.searchInput()?.nativeElement.focus();
  }
}

function toEntry(hit: CatalogHit, proficiency: number, viewerId: number | null): CatalogCardEntry {
  switch (hit.type) {
    case 'weapon': return weaponCatalogEntry(hit.item, proficiency, viewerId);
    case 'armor': return armorCatalogEntry(hit.item, viewerId);
    case 'loot': return lootCatalogEntry(hit.item, viewerId);
  }
}
