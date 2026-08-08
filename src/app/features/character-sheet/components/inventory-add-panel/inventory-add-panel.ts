import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, untracked, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';

const ITEM_TYPE_LABELS: Record<'weapon' | 'armor' | 'loot', { singular: string; plural: string }> = {
  weapon: { singular: 'weapon', plural: 'weapons' },
  armor: { singular: 'armor', plural: 'armor' },
  loot: { singular: 'loot', plural: 'loot' },
};

/**
 * Picks an item out of the catalogue, or hands off to the builder for homebrew.
 *
 * The list is capped at 50 rows, so browsing alone could never reach a specific item -- and a
 * player's own homebrew, which sorts nowhere in particular, was effectively unreachable. The search
 * box passes `name` through to the three services (all of which already accept it as a
 * case-insensitive substring match) so the server does the filtering across the whole catalogue,
 * not just across the page that happens to be loaded.
 */
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

  readonly itemType = input.required<'weapon' | 'armor' | 'loot'>();
  readonly open = input.required<boolean>();

  readonly itemAdded = output<WeaponResponse | ArmorResponse | LootApiResponse>();
  /** Carries the kind the panel is currently listing, read at emit time so a tab switch can't
   * leave it stale -- the tabs swap `itemType` on this same panel instance. */
  readonly createRequested = output<'weapon' | 'armor' | 'loot'>();
  readonly closed = output<void>();

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly weaponItems = signal<WeaponResponse[]>([]);
  readonly armorItems = signal<ArmorResponse[]>([]);
  readonly lootItems = signal<LootApiResponse[]>([]);
  readonly weaponDamageFilter = signal<'PHYSICAL' | 'MAGIC'>('PHYSICAL');
  readonly searchTerm = signal('');
  /** Whether a request has come back for the current tab, whatever it returned. */
  readonly listLoaded = signal(false);

  readonly typeLabel = computed(() => ITEM_TYPE_LABELS[this.itemType()]);

  readonly isCurrentListEmpty = computed(() => {
    const type = this.itemType();
    if (type === 'weapon') return this.weaponItems().length === 0;
    if (type === 'armor') return this.armorItems().length === 0;
    return this.lootItems().length === 0;
  });

  /** The opening state: nothing fetched and nothing typed, so offer to fetch. */
  readonly shouldShowBrowsePrompt = computed(() => !this.listLoaded() && this.searchTerm().trim().length === 0);

  readonly resultCount = computed(() => {
    const type = this.itemType();
    if (type === 'weapon') return this.weaponItems().length;
    if (type === 'armor') return this.armorItems().length;
    return this.lootItems().length;
  });

  readonly noResultsMessage = computed(() => {
    if (!this.listLoaded() || !this.isCurrentListEmpty()) return null;
    const term = this.searchTerm().trim();
    if (term) return `No ${this.typeLabel().plural} match “${term}”.`;
    if (this.itemType() === 'weapon') return 'No weapons match this filter.';
    return `No ${this.typeLabel().plural} available.`;
  });

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
        this.searchTerm.set('');
        this.listLoaded.set(false);
      });
    });

    toObservable(this.searchTerm)
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(term => {
        // Clearing the box reloads the unfiltered list, but only when the user had already opened
        // one -- on a fresh tab, an empty box is the untouched initial state, not a request.
        if (term.trim().length === 0 && !this.listLoaded()) return;
        this.loadItems();
      });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  onWeaponDamageFilterChange(damageType: 'PHYSICAL' | 'MAGIC'): void {
    if (this.weaponDamageFilter() === damageType) return;
    this.weaponDamageFilter.set(damageType);
    if (this.listLoaded()) {
      this.loadItems();
    }
  }

  loadItems(): void {
    const type = this.itemType();
    const name = this.searchTerm().trim() || undefined;
    this.loading.set(true);
    this.loadError.set(false);

    if (type === 'weapon') {
      this.weaponService.getWeaponsRaw({ size: 50, damageType: this.weaponDamageFilter(), name }).subscribe({
        next: (res) => {
          this.weaponItems.set(res.items);
          this.listLoaded.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    } else if (type === 'armor') {
      this.armorService.getArmorsRaw({ size: 50, name }).subscribe({
        next: (res) => {
          this.armorItems.set(res.items);
          this.listLoaded.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    } else {
      this.lootService.getLootRaw({ name }).subscribe({
        next: (res) => {
          this.lootItems.set(res.items);
          this.listLoaded.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  onCreateRequested(): void {
    this.createRequested.emit(this.itemType());
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
