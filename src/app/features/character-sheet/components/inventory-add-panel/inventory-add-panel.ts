import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';
import { WeaponResponse, WeaponTrait } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';

type ItemType = 'weapon' | 'armor' | 'loot';
type InventoryItem = WeaponResponse | ArmorResponse | LootApiResponse;

const TIERS = [1, 2, 3, 4] as const;
const WEAPON_TRAITS: WeaponTrait[] = ['AGILITY', 'STRENGTH', 'FINESSE', 'INSTINCT', 'PRESENCE', 'KNOWLEDGE'];

@Component({
  selector: 'app-inventory-add-panel',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './inventory-add-panel.html',
  styleUrl: './inventory-add-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryAddPanel {
  readonly itemType = input.required<ItemType>();
  readonly open = input.required<boolean>();
  readonly itemAdded = output<InventoryItem>();
  readonly closed = output<void>();

  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);

  private readonly items = signal<InventoryItem[]>([]);
  private readonly loading = signal(false);
  private readonly error = signal(false);
  private readonly currentPage = signal(0);
  private readonly totalPages = signal(0);

  readonly selectedTier = signal<number | undefined>(undefined);
  readonly selectedTrait = signal<WeaponTrait | undefined>(undefined);
  readonly consumableOnly = signal(false);

  readonly hasMore = computed(() => this.currentPage() < this.totalPages() - 1);
  readonly displayItems = computed(() => this.items());
  readonly isLoading = computed(() => this.loading());
  readonly hasError = computed(() => this.error());

  readonly tiers = TIERS;
  readonly weaponTraits = WEAPON_TRAITS;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.resetAndFetch();
      }
    });
  }

  private resetAndFetch(): void {
    this.items.set([]);
    this.currentPage.set(0);
    this.totalPages.set(0);
    this.fetchItems(0, false);
  }

  private fetchItems(page: number, append: boolean): void {
    this.loading.set(true);
    this.error.set(false);

    const type = this.itemType();

    if (type === 'weapon') {
      this.weaponService.getWeaponsRaw({
        page,
        tier: this.selectedTier(),
        damageType: undefined,
      }).subscribe({
        next: result => {
          this.items.update(prev => append ? [...prev, ...result.items] : result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    } else if (type === 'armor') {
      this.armorService.getArmorsRaw({
        page,
        tier: this.selectedTier(),
      }).subscribe({
        next: result => {
          this.items.update(prev => append ? [...prev, ...result.items] : result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    } else {
      this.lootService.getLootRaw({
        page,
        tier: this.selectedTier(),
        isConsumable: this.consumableOnly() ? true : undefined,
      }).subscribe({
        next: result => {
          this.items.update(prev => append ? [...prev, ...result.items] : result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  onTierChange(tier: string): void {
    this.selectedTier.set(tier === '' ? undefined : Number(tier));
    this.resetAndFetch();
  }

  onTraitChange(trait: string): void {
    this.selectedTrait.set(trait === '' ? undefined : trait as WeaponTrait);
    this.resetAndFetch();
  }

  onConsumableToggle(): void {
    this.consumableOnly.update(v => !v);
    this.resetAndFetch();
  }

  onLoadMore(): void {
    const nextPage = this.currentPage() + 1;
    this.fetchItems(nextPage, true);
  }

  onAddItem(item: InventoryItem): void {
    this.itemAdded.emit(item);
  }

  onClose(): void {
    this.closed.emit();
  }

  asWeapon(item: InventoryItem): WeaponResponse {
    return item as WeaponResponse;
  }

  asArmor(item: InventoryItem): ArmorResponse {
    return item as ArmorResponse;
  }

  asLoot(item: InventoryItem): LootApiResponse {
    return item as LootApiResponse;
  }
}
