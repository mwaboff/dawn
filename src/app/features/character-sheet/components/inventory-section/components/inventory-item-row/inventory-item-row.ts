import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { WeaponDisplay, ArmorDisplay, LootDisplay } from '../../../../models/character-sheet-view.model';

@Component({
  selector: 'app-inventory-item-row',
  templateUrl: './inventory-item-row.html',
  styleUrl: './inventory-item-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryItemRow {
  readonly item = input.required<WeaponDisplay | ArmorDisplay | LootDisplay>();
  readonly itemType = input.required<'weapon' | 'armor' | 'loot'>();
  readonly isOwner = input.required<boolean>();
  readonly equipState = input<string | boolean | null>(null);
  readonly confirming = input<boolean>(false);
  readonly canEquipPrimary = input<boolean>(false);
  readonly canEquipSecondary = input<boolean>(false);
  readonly canEquipArmor = input<boolean>(false);

  readonly removeClicked = output<void>();
  readonly removeConfirmed = output<void>();
  readonly removeCancelled = output<void>();
  readonly equipClicked = output<string>();
  readonly unequipClicked = output<void>();

  readonly weapon = computed<WeaponDisplay | null>(() =>
    this.itemType() === 'weapon' ? (this.item() as WeaponDisplay) : null
  );

  readonly armor = computed<ArmorDisplay | null>(() =>
    this.itemType() === 'armor' ? (this.item() as ArmorDisplay) : null
  );

  readonly loot = computed<LootDisplay | null>(() =>
    this.itemType() === 'loot' ? (this.item() as LootDisplay) : null
  );

  readonly weaponSlot = computed<'primary' | 'secondary' | null>(() => {
    const state = this.equipState();
    if (state === 'primary') return 'primary';
    if (state === 'secondary') return 'secondary';
    return null;
  });

  readonly isArmorEquipped = computed<boolean>(() => this.equipState() === true);

  readonly canRemove = computed<boolean>(() => {
    const type = this.itemType();
    if (type === 'loot') return true;
    if (type === 'weapon') return this.weaponSlot() === null;
    return !this.isArmorEquipped();
  });

  onRemoveClick(): void {
    this.removeClicked.emit();
  }

  onRemoveConfirm(): void {
    this.removeConfirmed.emit();
  }

  onRemoveCancel(): void {
    this.removeCancelled.emit();
  }

  onEquipClick(slot: string): void {
    this.equipClicked.emit(slot);
  }

  onUnequipClick(): void {
    this.unequipClicked.emit();
  }
}
