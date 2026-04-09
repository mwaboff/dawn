import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../models/character-sheet-view.model';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';
import { InventoryItemRow } from './components/inventory-item-row/inventory-item-row';
import { InventoryAddPanel } from '../inventory-add-panel/inventory-add-panel';

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

  readonly addItem = output<{ type: 'weapon' | 'armor' | 'loot'; item: unknown }>();
  readonly removeItem = output<{ type: 'weapon' | 'armor' | 'loot'; itemId: number }>();
  readonly equipWeapon = output<{ weaponId: number; slot: 'primary' | 'secondary' }>();
  readonly unequipWeapon = output<{ slot: 'primary' | 'secondary' }>();
  readonly equipArmor = output<number>();
  readonly unequipArmor = output<void>();

  readonly activeTab = signal<'weapons' | 'armor' | 'loot'>('weapons');
  readonly addPanelOpen = signal(false);
  readonly confirmingRemoveId = signal<number | null>(null);

  readonly activeItemType = computed<'weapon' | 'armor' | 'loot'>(() => {
    const tab = this.activeTab();
    if (tab === 'weapons') return 'weapon';
    return tab;
  });

  selectTab(tab: 'weapons' | 'armor' | 'loot'): void {
    this.activeTab.set(tab);
    this.confirmingRemoveId.set(null);
    this.addPanelOpen.set(false);
  }

  getWeaponEquipState(weaponId: number): 'primary' | 'secondary' | null {
    const primary = this.activePrimaryWeapon();
    const secondary = this.activeSecondaryWeapon();
    if (primary?.id === weaponId) return 'primary';
    if (secondary?.id === weaponId) return 'secondary';
    return null;
  }

  isArmorEquipped(armorId: number): boolean {
    return this.activeArmor()?.id === armorId;
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

  onRemoveClicked(itemId: number): void {
    this.confirmingRemoveId.set(itemId);
  }

  onRemoveConfirmed(type: 'weapon' | 'armor' | 'loot', itemId: number): void {
    this.confirmingRemoveId.set(null);
    this.removeItem.emit({ type, itemId });
  }

  onRemoveCancelled(): void {
    this.confirmingRemoveId.set(null);
  }

  onEquipWeaponClicked(weaponId: number, slot: string): void {
    const s = slot === 'primary' ? 'primary' : 'secondary';
    this.equipWeapon.emit({ weaponId, slot: s });
  }

  onUnequipWeaponClicked(slot: 'primary' | 'secondary'): void {
    this.unequipWeapon.emit({ slot });
  }

  onEquipArmorClicked(armorId: number): void {
    this.equipArmor.emit(armorId);
  }

  onUnequipArmorClicked(): void {
    this.unequipArmor.emit();
  }
}
