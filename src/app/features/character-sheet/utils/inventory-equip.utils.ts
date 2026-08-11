import { ArmorDisplay, WeaponDisplay } from '../models/character-sheet-view.model';

/** Which of the character's two weapon slots a piece of gear is sitting in, or `null` for stowed. */
export type WeaponSlot = 'primary' | 'secondary';

/** What the sheet already knows about its own slots -- see `CharacterSheet.weaponConstraints`. */
export interface WeaponEquipConstraints {
  primarySlotOccupied: boolean;
  secondarySlotOccupied: boolean;
  twoHandedEquipped: boolean;
}

/**
 * The Daggerheart equip rules, in one place. Two inventory presentations (classic's rows and beta's
 * cards) ask the same questions of the same gear, and a second copy of "can this go in the primary
 * hand" is a rules bug waiting to diverge -- see dawn/CLAUDE.md on domain rules living once.
 *
 * Entries are matched on `inventoryEntryId`, never on the catalogue `id`: two copies of the same
 * dagger are two entries, and only the equipped one should read as equipped.
 */
export function weaponEquipSlot(
  weapon: WeaponDisplay,
  activePrimary: WeaponDisplay | null,
  activeSecondary: WeaponDisplay | null,
): WeaponSlot | null {
  if (activePrimary?.inventoryEntryId === weapon.inventoryEntryId) return 'primary';
  if (activeSecondary?.inventoryEntryId === weapon.inventoryEntryId) return 'secondary';
  return null;
}

export function isArmorEntryEquipped(armor: ArmorDisplay, activeArmor: ArmorDisplay | null): boolean {
  return activeArmor?.inventoryEntryId === armor.inventoryEntryId;
}

/**
 * A two-handed weapon occupies both hands, so it needs both slots free; a one-handed primary needs
 * only the primary slot, but is still blocked while a two-handed weapon is out.
 */
export function canEquipWeaponAsPrimary(
  weapon: WeaponDisplay,
  constraints: WeaponEquipConstraints | null,
): boolean {
  if (!weapon.isPrimary) return false;
  if (!constraints) return false;
  if (weapon.burden === 'TWO_HANDED') {
    return !constraints.primarySlotOccupied && !constraints.secondarySlotOccupied && !constraints.twoHandedEquipped;
  }
  return !constraints.primarySlotOccupied && !constraints.twoHandedEquipped;
}

/** Secondary-slot gear only. A two-handed weapon can never be the off-hand. */
export function canEquipWeaponAsSecondary(
  weapon: WeaponDisplay,
  constraints: WeaponEquipConstraints | null,
): boolean {
  if (weapon.isPrimary) return false;
  if (!constraints) return false;
  if (weapon.burden === 'TWO_HANDED') return false;
  return !constraints.secondarySlotOccupied && !constraints.twoHandedEquipped;
}
