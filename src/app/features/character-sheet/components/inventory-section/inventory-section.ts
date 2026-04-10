import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../models/character-sheet-view.model';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';
import { InventoryItemRow } from './components/inventory-item-row/inventory-item-row';
import { InventoryAddPanel } from '../inventory-add-panel/inventory-add-panel';

export interface InventoryRemoveEvent {
  type: 'weapon' | 'armor' | 'loot';
  inventoryEntryId: number;
}

export interface InventoryEquipWeaponEvent {
  weaponId: number;
  inventoryEntryId: number;
  slot: 'primary' | 'secondary';
}

export interface InventoryEquipArmorEvent {
  armorId: number;
  inventoryEntryId: number;
}

@Component({
  selector: 'app-inventory-section',
  templateUrl: './inventory-section.html',
  styleUrl: './inventory-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InventoryItemRow, InventoryAddPanel],
})
export class InventorySection {
  readonly weapons = input.required<WeaponDisplay[]>();
  readonly armors = input.required<ArmorDisplay[]>();
  readonly items = input.required<LootDisplay[]>();
  readonly isOwner = input.required<boolean>();
  readonly activePrimaryWeapon = input<WeaponDisplay | null>(null);
  readonly activeSecondaryWeapon = input<WeaponDisplay | null>(null);
  readonly activeArmor = input<ArmorDisplay | null>(null);
  readonly canEquipPrimary = input<boolean>(false);
  readonly canEquipSecondary = input<boolean>(false);
  readonly canEquipArmorSlot = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly addItem = output<{ type: 'weapon' | 'armor' | 'loot'; item: unknown }>();
  readonly removeItem = output<InventoryRemoveEvent>();
  readonly equipWeapon = output<InventoryEquipWeaponEvent>();
  readonly unequipWeapon = output<{ slot: 'primary' | 'secondary' }>();
  readonly equipArmor = output<InventoryEquipArmorEvent>();
  readonly unequipArmor = output<void>();
  readonly dismissError = output<void>();

  readonly activeTab = signal<'weapons' | 'armor' | 'loot'>('weapons');
  readonly addPanelOpen = signal(false);
  readonly confirmingRemoveEntryId = signal<number | null>(null);

  readonly activeItemType = computed<'weapon' | 'armor' | 'loot'>(() => {
    const tab = this.activeTab();
    if (tab === 'weapons') return 'weapon';
    return tab;
  });

  selectTab(tab: 'weapons' | 'armor' | 'loot'): void {
    this.activeTab.set(tab);
    this.confirmingRemoveEntryId.set(null);
    this.addPanelOpen.set(false);
  }

  getWeaponEquipState(weapon: WeaponDisplay): 'primary' | 'secondary' | null {
    const primary = this.activePrimaryWeapon();
    const secondary = this.activeSecondaryWeapon();
    if (primary?.inventoryEntryId === weapon.inventoryEntryId) return 'primary';
    if (secondary?.inventoryEntryId === weapon.inventoryEntryId) return 'secondary';
    return null;
  }

  isArmorEntryEquipped(armor: ArmorDisplay): boolean {
    return this.activeArmor()?.inventoryEntryId === armor.inventoryEntryId;
  }

  toggleAddPanel(): void {
    this.addPanelOpen.update(v => !v);
  }

  onItemAdded(item: WeaponResponse | ArmorResponse | LootApiResponse): void {
    const type = this.activeItemType();
    this.addItem.emit({ type, item });
    this.addPanelOpen.set(false);
  }

  onAddPanelClosed(): void {
    this.addPanelOpen.set(false);
  }

  onRemoveClicked(inventoryEntryId: number): void {
    this.confirmingRemoveEntryId.set(inventoryEntryId);
  }

  onRemoveConfirmed(type: 'weapon' | 'armor' | 'loot', inventoryEntryId: number): void {
    this.confirmingRemoveEntryId.set(null);
    this.removeItem.emit({ type, inventoryEntryId });
  }

  onRemoveCancelled(): void {
    this.confirmingRemoveEntryId.set(null);
  }

  onEquipWeaponClicked(weapon: WeaponDisplay, slot: string): void {
    const s = slot === 'primary' ? 'primary' : 'secondary';
    this.equipWeapon.emit({ weaponId: weapon.id, inventoryEntryId: weapon.inventoryEntryId, slot: s });
  }

  onUnequipWeaponClicked(slot: 'primary' | 'secondary'): void {
    this.unequipWeapon.emit({ slot });
  }

  onEquipArmorClicked(armor: ArmorDisplay): void {
    this.equipArmor.emit({ armorId: armor.id, inventoryEntryId: armor.inventoryEntryId });
  }

  onUnequipArmorClicked(): void {
    this.unequipArmor.emit();
  }

  onDismissError(): void {
    this.dismissError.emit();
  }
}
