import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../models/character-sheet-view.model';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';
import { InventoryItemRow } from './components/inventory-item-row/inventory-item-row';
import { InventoryAddPanel } from '../inventory-add-panel/inventory-add-panel';
import { InventoryTab, InventoryTabs } from '../../../../shared/components/inventory-tabs/inventory-tabs';
import {
  WeaponEquipConstraints,
  WeaponSlot,
  canEquipWeaponAsPrimary,
  canEquipWeaponAsSecondary,
  isArmorEntryEquipped,
  weaponEquipSlot,
} from '../../utils/inventory-equip.utils';

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

/** A request to open the item builder on a piece of homebrew the viewer wrote. */
export interface InventoryEditEvent {
  type: 'weapon' | 'armor' | 'loot';
  itemId: number;
}

@Component({
  selector: 'app-inventory-section',
  templateUrl: './inventory-section.html',
  styleUrl: './inventory-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InventoryItemRow, InventoryAddPanel, InventoryTabs],
})
export class InventorySection {
  readonly weapons = input.required<WeaponDisplay[]>();
  readonly armors = input.required<ArmorDisplay[]>();
  readonly items = input.required<LootDisplay[]>();
  readonly isOwner = input.required<boolean>();
  readonly activePrimaryWeapon = input<WeaponDisplay | null>(null);
  readonly activeSecondaryWeapon = input<WeaponDisplay | null>(null);
  readonly activeArmor = input<ArmorDisplay | null>(null);
  readonly weaponConstraints = input<WeaponEquipConstraints | null>(null);
  readonly canEquipArmorSlot = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  /** Passed to each row so it can tell whether the viewer authored the item. */
  readonly currentUserId = input<number | null>(null);

  readonly addItem = output<{ type: 'weapon' | 'armor' | 'loot'; item: unknown }>();
  /** A request to build homebrew of the active tab's kind, rather than pick from the catalogue. */
  readonly createItem = output<'weapon' | 'armor' | 'loot'>();
  readonly removeItem = output<InventoryRemoveEvent>();
  readonly editItem = output<InventoryEditEvent>();
  readonly equipWeapon = output<InventoryEquipWeaponEvent>();
  readonly unequipWeapon = output<{ slot: 'primary' | 'secondary' }>();
  readonly equipArmor = output<InventoryEquipArmorEvent>();
  readonly unequipArmor = output<void>();
  readonly dismissError = output<void>();

  readonly activeTab = signal<InventoryTab>('weapons');
  readonly addPanelOpen = signal(false);
  readonly confirmingRemoveEntryId = signal<number | null>(null);

  readonly tabCounts = computed<Record<InventoryTab, number>>(() => ({
    weapons: this.weapons().length,
    armor: this.armors().length,
    loot: this.items().length,
  }));

  readonly activeItemType = computed<'weapon' | 'armor' | 'loot'>(() => {
    const tab = this.activeTab();
    if (tab === 'weapons') return 'weapon';
    return tab;
  });

  selectTab(tab: InventoryTab): void {
    this.activeTab.set(tab);
    this.confirmingRemoveEntryId.set(null);
    this.addPanelOpen.set(false);
  }

  getWeaponEquipState(weapon: WeaponDisplay): WeaponSlot | null {
    return weaponEquipSlot(weapon, this.activePrimaryWeapon(), this.activeSecondaryWeapon());
  }

  isArmorEntryEquipped(armor: ArmorDisplay): boolean {
    return isArmorEntryEquipped(armor, this.activeArmor());
  }

  canEquipWeaponAsPrimary(weapon: WeaponDisplay): boolean {
    return canEquipWeaponAsPrimary(weapon, this.weaponConstraints());
  }

  canEquipWeaponAsSecondary(weapon: WeaponDisplay): boolean {
    return canEquipWeaponAsSecondary(weapon, this.weaponConstraints());
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

  /** Closes the picker behind the modal, the same way choosing a catalogue item does. */
  onCreateRequested(type: 'weapon' | 'armor' | 'loot'): void {
    this.addPanelOpen.set(false);
    this.createItem.emit(type);
  }

  onRemoveClicked(inventoryEntryId: number): void {
    this.confirmingRemoveEntryId.set(inventoryEntryId);
  }

  onRemoveConfirmed(type: 'weapon' | 'armor' | 'loot', inventoryEntryId: number): void {
    this.confirmingRemoveEntryId.set(null);
    this.removeItem.emit({ type, inventoryEntryId });
  }

  /** Note this carries the catalogue id, not the inventory entry id -- the builder edits the item. */
  onEditClicked(type: 'weapon' | 'armor' | 'loot', itemId: number): void {
    this.editItem.emit({ type, itemId });
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
