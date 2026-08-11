import { EntityCardData } from '../../../shared/components/entity-card/entity-card.model';
import { ArmorDisplay, LootDisplay, WeaponDisplay } from '../../character-sheet/models/character-sheet-view.model';
import {
  WeaponEquipConstraints,
  WeaponSlot,
  canEquipWeaponAsPrimary,
  canEquipWeaponAsSecondary,
  isArmorEntryEquipped,
  weaponEquipSlot,
} from '../../character-sheet/utils/inventory-equip.utils';
import { canEditItem } from '../../../shared/utils/item-ownership.utils';
import { armorToEntity, lootToEntity, weaponToEntity } from './entity-card.mapper';

export type InventoryItemType = 'weapon' | 'armor' | 'loot';

/** What one equip/unequip button on a card offers, already resolved to label, state and reason. */
export interface InventoryEquipAction {
  readonly kind: 'equip-primary' | 'equip-secondary' | 'equip-armor' | 'unequip';
  readonly label: string;
  readonly ariaLabel: string;
  readonly disabled: boolean;
  /** Why the action is unavailable, shown beside it. `null` whenever `disabled` is false. */
  readonly hint: string | null;
}

/**
 * One inventory card, with every decision about it already made. The template renders this list and
 * nothing else -- no per-type branch, no `@switch` with three near-identical card blocks, which is
 * what the classic inventory template does and what `.agents/rules/component-design.md` warns about.
 */
export interface InventoryCardEntry {
  readonly type: InventoryItemType;
  /** The inventory row's id -- what remove and equip act on. Unique per copy of an item. */
  readonly inventoryEntryId: number;
  /** The catalogue id -- what the item editor acts on. Shared by every copy of the same item. */
  readonly itemId: number;
  readonly name: string;
  readonly card: EntityCardData;
  /** Only the author of a piece of homebrew may edit it; official gear has no author. */
  readonly canEdit: boolean;
  /** Why removal is blocked, or `null` when the item can be removed. */
  readonly removeBlockedReason: string | null;
  readonly equipActions: readonly InventoryEquipAction[];
  /** The slot an equipped weapon is in -- what `unequip` has to name. `null` for armor and loot. */
  readonly equippedWeaponSlot: WeaponSlot | null;
}

/** Equipped gear stays in inventory until it is taken off, so the card says so rather than hiding. */
const EQUIPPED_REMOVE_BLOCK = 'Unequip to remove';

/** Everything the sheet knows about its own equipment, passed once instead of item by item. */
export interface InventoryEquipState {
  readonly activePrimaryWeapon: WeaponDisplay | null;
  readonly activeSecondaryWeapon: WeaponDisplay | null;
  readonly activeArmor: ArmorDisplay | null;
  readonly weaponConstraints: WeaponEquipConstraints | null;
  readonly canEquipArmorSlot: boolean;
}

function weaponEquipActions(weapon: WeaponDisplay, state: InventoryEquipState): InventoryEquipAction[] {
  if (weaponEquipSlot(weapon, state.activePrimaryWeapon, state.activeSecondaryWeapon)) {
    return [{ kind: 'unequip', label: 'Unequip', ariaLabel: `Unequip ${weapon.name}`, disabled: false, hint: null }];
  }

  // A weapon is eligible for exactly one slot (`isPrimary`), so only that slot's button is offered
  // -- the classic row showed both and left one permanently dead. The label names the slot, which
  // is why the card no longer needs a "Primary Weapon" tag saying the same thing statically.
  if (weapon.isPrimary) {
    const allowed = canEquipWeaponAsPrimary(weapon, state.weaponConstraints);
    return [{
      kind: 'equip-primary',
      label: 'Equip primary',
      ariaLabel: `Equip ${weapon.name} as primary weapon`,
      disabled: !allowed,
      hint: allowed ? null : weaponBlockedHint(weapon, state.weaponConstraints),
    }];
  }

  const allowed = canEquipWeaponAsSecondary(weapon, state.weaponConstraints);
  return [{
    kind: 'equip-secondary',
    label: 'Equip secondary',
    ariaLabel: `Equip ${weapon.name} as secondary weapon`,
    disabled: !allowed,
    hint: allowed ? null : weaponBlockedHint(weapon, state.weaponConstraints),
  }];
}

/** Names the slot that is actually in the way, so the hint tells the player what to put down. */
function weaponBlockedHint(weapon: WeaponDisplay, constraints: WeaponEquipConstraints | null): string {
  if (!constraints) return 'Unavailable';
  if (constraints.twoHandedEquipped) return 'Two-handed weapon equipped';
  if (weapon.isPrimary) {
    if (constraints.primarySlotOccupied) return 'Primary slot full';
    if (weapon.burden === 'TWO_HANDED' && constraints.secondarySlotOccupied) return 'Needs both hands free';
    return 'Unavailable';
  }
  return constraints.secondarySlotOccupied ? 'Secondary slot full' : 'Unavailable';
}

export function weaponCardEntry(
  weapon: WeaponDisplay,
  state: InventoryEquipState,
  currentUserId: number | null,
): InventoryCardEntry {
  const slot = weaponEquipSlot(weapon, state.activePrimaryWeapon, state.activeSecondaryWeapon);
  return {
    type: 'weapon',
    inventoryEntryId: weapon.inventoryEntryId,
    itemId: weapon.id,
    name: weapon.name,
    card: weaponToEntity(weapon, slot),
    canEdit: canEditItem(weapon, currentUserId),
    removeBlockedReason: slot ? EQUIPPED_REMOVE_BLOCK : null,
    equipActions: weaponEquipActions(weapon, state),
    equippedWeaponSlot: slot,
  };
}

export function armorCardEntry(
  armor: ArmorDisplay,
  state: InventoryEquipState,
  currentUserId: number | null,
): InventoryCardEntry {
  const equipped = isArmorEntryEquipped(armor, state.activeArmor);
  const equipActions: InventoryEquipAction[] = equipped
    ? [{ kind: 'unequip', label: 'Unequip', ariaLabel: `Unequip ${armor.name}`, disabled: false, hint: null }]
    : [{
        kind: 'equip-armor',
        label: 'Equip',
        ariaLabel: `Equip ${armor.name}`,
        disabled: !state.canEquipArmorSlot,
        hint: state.canEquipArmorSlot ? null : 'Unequip current armor first',
      }];

  return {
    type: 'armor',
    inventoryEntryId: armor.inventoryEntryId,
    itemId: armor.id,
    name: armor.name,
    card: armorToEntity(armor, equipped),
    canEdit: canEditItem(armor, currentUserId),
    removeBlockedReason: equipped ? EQUIPPED_REMOVE_BLOCK : null,
    equipActions,
    equippedWeaponSlot: null,
  };
}

export function lootCardEntry(loot: LootDisplay, currentUserId: number | null): InventoryCardEntry {
  return {
    type: 'loot',
    inventoryEntryId: loot.inventoryEntryId,
    itemId: loot.id,
    name: loot.name,
    card: lootToEntity(loot),
    canEdit: canEditItem(loot, currentUserId),
    removeBlockedReason: null,
    equipActions: [],
    equippedWeaponSlot: null,
  };
}
