import { Component, ChangeDetectionStrategy, DestroyRef, input, output, signal, computed, effect, untracked, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, debounceTime, map } from 'rxjs';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';
import { SearchService } from '../../../../shared/services/search.service';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';
import { SearchableEntityType } from '../../../../shared/models/search.model';

const SEARCH_TYPE_BY_ITEM_TYPE: Record<'weapon' | 'armor' | 'loot', SearchableEntityType> = {
  weapon: 'WEAPON',
  armor: 'ARMOR',
  loot: 'LOOT',
};

const MIN_SEARCH_QUERY_LENGTH = 3;

@Component({
  selector: 'app-inventory-add-panel',
  templateUrl: './inventory-add-panel.html',
  styleUrl: './inventory-add-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryAddPanel {
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);
  private readonly searchService = inject(SearchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly itemType = input.required<'weapon' | 'armor' | 'loot'>();
  readonly open = input.required<boolean>();

  readonly itemAdded = output<WeaponResponse | ArmorResponse | LootApiResponse>();
  readonly closed = output<void>();

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly weaponItems = signal<WeaponResponse[]>([]);
  readonly armorItems = signal<ArmorResponse[]>([]);
  readonly lootItems = signal<LootApiResponse[]>([]);
  readonly weaponDamageFilter = signal<'PHYSICAL' | 'MAGIC'>('PHYSICAL');
  readonly weaponItemsLoaded = signal(false);
  readonly searchQuery = signal('');
  readonly officialOnly = signal(true);
  private readonly listLoaded = signal(false);

  readonly isSearchActive = computed(() => this.searchQuery().trim().length >= MIN_SEARCH_QUERY_LENGTH);

  readonly isCurrentListEmpty = computed(() => {
    const type = this.itemType();
    if (type === 'weapon') return this.weaponItems().length === 0;
    if (type === 'armor') return this.armorItems().length === 0;
    return this.lootItems().length === 0;
  });

  readonly shouldShowBrowsePrompt = computed(() => {
    if (this.itemType() === 'weapon') return !this.weaponItemsLoaded();
    return this.isCurrentListEmpty();
  });

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    effect(() => {
      this.itemType();
      untracked(() => {
        this.loading.set(false);
        this.loadError.set(false);
        this.weaponItems.set([]);
        this.armorItems.set([]);
        this.lootItems.set([]);
        this.weaponDamageFilter.set('PHYSICAL');
        this.weaponItemsLoaded.set(false);
        this.listLoaded.set(false);
        if (this.isSearchActive()) {
          this.fetchItems();
        }
      });
    });

    this.searchInput$
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchItems());
  }

  onWeaponDamageFilterChange(damageType: 'PHYSICAL' | 'MAGIC'): void {
    if (this.weaponDamageFilter() === damageType) return;
    this.weaponDamageFilter.set(damageType);
    if (this.listLoaded()) {
      this.fetchItems();
    }
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  onOfficialOnlyChange(checked: boolean): void {
    this.officialOnly.set(checked);
    if (this.listLoaded()) {
      this.fetchItems();
    }
  }

  fetchItems(): void {
    const query = this.searchQuery().trim();
    if (query.length >= MIN_SEARCH_QUERY_LENGTH) {
      this.runSearch(query);
    } else {
      this.loadItems();
    }
  }

  private loadItems(): void {
    const type = this.itemType();
    const isOfficial = this.officialOnly() ? true : undefined;
    const items$: Observable<unknown[]> =
      type === 'weapon'
        ? this.weaponService.getWeaponsRaw({ size: 50, damageType: this.weaponDamageFilter(), isOfficial }).pipe(map((res) => res.items))
        : type === 'armor'
          ? this.armorService.getArmorsRaw({ size: 50, isOfficial }).pipe(map((res) => res.items))
          : this.lootService.getLootRaw({ isOfficial }).pipe(map((res) => res.items));

    this.fetch(items$, type);
  }

  private runSearch(query: string): void {
    const type = this.itemType();
    const items$ = this.searchService
      .search({
        q: query,
        types: [SEARCH_TYPE_BY_ITEM_TYPE[type]],
        isOfficial: this.officialOnly() ? true : undefined,
      })
      .pipe(map((res) => res.results.map((r) => r.expandedEntity)));

    this.fetch(items$, type);
  }

  private fetch(items$: Observable<unknown[]>, type: 'weapon' | 'armor' | 'loot'): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.listLoaded.set(true);

    items$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        if (type === 'weapon') {
          this.weaponItems.set(items as WeaponResponse[]);
          this.weaponItemsLoaded.set(true);
        } else if (type === 'armor') {
          this.armorItems.set(items as ArmorResponse[]);
        } else {
          this.lootItems.set(items as LootApiResponse[]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  onSelectWeapon(weapon: WeaponResponse): void {
    this.itemAdded.emit(weapon);
  }

  onSelectArmor(armor: ArmorResponse): void {
    this.itemAdded.emit(armor);
  }

  onSelectLoot(loot: LootApiResponse): void {
    this.itemAdded.emit(loot);
  }
}
