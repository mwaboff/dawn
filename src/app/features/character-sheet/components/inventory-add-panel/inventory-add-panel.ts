import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, untracked, inject } from '@angular/core';
import { WeaponService } from '../../../../shared/services/weapon.service';
import { ArmorService } from '../../../../shared/services/armor.service';
import { LootService } from '../../../../shared/services/loot.service';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';

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
  readonly closed = output<void>();

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly weaponItems = signal<WeaponResponse[]>([]);
  readonly armorItems = signal<ArmorResponse[]>([]);
  readonly lootItems = signal<LootApiResponse[]>([]);
  readonly weaponDamageFilter = signal<'PHYSICAL' | 'MAGIC'>('PHYSICAL');
  readonly weaponItemsLoaded = signal(false);

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
      });
    });
  }

  onWeaponDamageFilterChange(damageType: 'PHYSICAL' | 'MAGIC'): void {
    if (this.weaponDamageFilter() === damageType) return;
    this.weaponDamageFilter.set(damageType);
    if (this.weaponItemsLoaded()) {
      this.loadItems();
    }
  }

  loadItems(): void {
    const type = this.itemType();
    this.loading.set(true);
    this.loadError.set(false);

    if (type === 'weapon') {
      this.weaponService.getWeaponsRaw({ size: 50, damageType: this.weaponDamageFilter() }).subscribe({
        next: (res) => {
          this.weaponItems.set(res.items);
          this.weaponItemsLoaded.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    } else if (type === 'armor') {
      this.armorService.getArmorsRaw({ size: 50 }).subscribe({
        next: (res) => {
          this.armorItems.set(res.items);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    } else {
      this.lootService.getLootRaw({ }).subscribe({
        next: (res) => {
          this.lootItems.set(res.items);
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
