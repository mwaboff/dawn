import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { WeaponDisplay, ArmorDisplay, LootDisplay, FeatureDisplay } from '../../../../models/character-sheet-view.model';
import { EquipmentCard, EquipmentStat } from '../../../equipment-card/equipment-card';

@Component({
  selector: 'app-inventory-item-row',
  templateUrl: './inventory-item-row.html',
  styleUrl: './inventory-item-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EquipmentCard],
})
export class InventoryItemRow {
  readonly item = input.required<WeaponDisplay | ArmorDisplay | LootDisplay>();
  readonly itemType = input.required<'weapon' | 'armor' | 'loot'>();
  readonly isOwner = input.required<boolean>();
  readonly equipState = input<string | boolean | null>(null);
  readonly confirming = input<boolean>(false);
  readonly canEquipAsPrimary = input<boolean>(false);
  readonly canEquipAsSecondary = input<boolean>(false);
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

  readonly cardName = computed<string>(() => this.item().name);

  readonly cardBadge = computed<string | undefined>(() => {
    const type = this.itemType();
    if (type === 'weapon') {
      const slot = this.weaponSlot();
      if (slot === 'primary') return 'Primary';
      if (slot === 'secondary') return 'Secondary';
      return undefined;
    }
    if (type === 'armor') {
      return this.isArmorEquipped() ? 'Equipped' : undefined;
    }
    const l = this.loot();
    return l?.isConsumable ? 'Consumable' : undefined;
  });

  readonly cardSubBadge = computed<string | undefined>(() => {
    const type = this.itemType();
    if (type === 'weapon') {
      const w = this.weapon();
      return w?.tier ? `T${w.tier}` : undefined;
    }
    if (type === 'armor') {
      const a = this.armor();
      return a?.tier ? `T${a.tier}` : undefined;
    }
    return undefined;
  });

  readonly cardStats = computed<EquipmentStat[]>(() => {
    const type = this.itemType();
    if (type === 'weapon') {
      const w = this.weapon();
      if (!w) return [];
      return [
        { label: 'damage', value: w.damage },
        { label: 'range', value: w.range },
        { label: 'burden', value: w.burden },
        { label: 'trait', value: w.trait },
      ].filter(s => !!s.value);
    }
    if (type === 'armor') {
      const a = this.armor();
      if (!a) return [];
      return [{ label: 'Score', value: `Score: ${a.baseScore}` }];
    }
    const l = this.loot();
    if (!l) return [];
    return l.costTags.map(tag => ({ label: tag, value: tag }));
  });

  readonly cardFeatures = computed<FeatureDisplay[]>(() => {
    const type = this.itemType();
    if (type === 'weapon') {
      return this.weapon()?.features ?? [];
    }
    if (type === 'armor') {
      return this.armor()?.features ?? [];
    }
    const l = this.loot();
    if (l?.description) {
      return [{ name: '', description: l.description, tags: [] }];
    }
    return [];
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
