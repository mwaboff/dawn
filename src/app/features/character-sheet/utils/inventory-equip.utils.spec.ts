import { describe, it, expect } from 'vitest';
import {
  WeaponEquipConstraints,
  canEquipWeaponAsPrimary,
  canEquipWeaponAsSecondary,
  isArmorEntryEquipped,
  weaponEquipSlot,
} from './inventory-equip.utils';
import { ArmorDisplay, WeaponDisplay } from '../models/character-sheet-view.model';

function buildWeapon(overrides: Partial<WeaponDisplay> = {}): WeaponDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Dagger',
    isPrimary: true,
    damage: '1d4',
    trait: 'Finesse',
    range: 'Melee',
    burden: 'ONE_HANDED',
    features: [],
    ...overrides,
  };
}

function buildArmor(overrides: Partial<ArmorDisplay> = {}): ArmorDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Leather Armor',
    baseScore: 3,
    baseMajorThreshold: 2,
    baseSevereThreshold: 4,
    features: [],
    ...overrides,
  };
}

function buildConstraints(overrides: Partial<WeaponEquipConstraints> = {}): WeaponEquipConstraints {
  return { primarySlotOccupied: false, secondarySlotOccupied: false, twoHandedEquipped: false, ...overrides };
}

describe('inventory-equip.utils', () => {
  describe('weaponEquipSlot', () => {
    it('matches the active primary weapon by inventoryEntryId, not the catalogue id', () => {
      // Two copies of the same dagger (shared catalogue id 7) sit at different inventory entries;
      // only the equipped copy should read as equipped.
      const equippedCopy = buildWeapon({ id: 7, inventoryEntryId: 101 });
      const stowedCopy = buildWeapon({ id: 7, inventoryEntryId: 102 });

      expect(weaponEquipSlot(equippedCopy, equippedCopy, null)).toBe('primary');
      expect(weaponEquipSlot(stowedCopy, equippedCopy, null)).toBeNull();
    });

    it('reports the secondary slot when the entry matches the active secondary weapon', () => {
      const weapon = buildWeapon({ inventoryEntryId: 5, isPrimary: false });

      expect(weaponEquipSlot(weapon, null, weapon)).toBe('secondary');
    });

    it('returns null when the entry matches neither active weapon', () => {
      const weapon = buildWeapon({ inventoryEntryId: 5 });
      const otherPrimary = buildWeapon({ inventoryEntryId: 9 });

      expect(weaponEquipSlot(weapon, otherPrimary, null)).toBeNull();
    });
  });

  describe('isArmorEntryEquipped', () => {
    it('matches on inventoryEntryId, not the catalogue id', () => {
      const equippedCopy = buildArmor({ id: 4, inventoryEntryId: 201 });
      const stowedCopy = buildArmor({ id: 4, inventoryEntryId: 202 });

      expect(isArmorEntryEquipped(equippedCopy, equippedCopy)).toBe(true);
      expect(isArmorEntryEquipped(stowedCopy, equippedCopy)).toBe(false);
    });

    it('returns false when there is no active armor', () => {
      expect(isArmorEntryEquipped(buildArmor(), null)).toBe(false);
    });
  });

  describe('canEquipWeaponAsPrimary', () => {
    it('allows a two-handed weapon only when both slots are free and no two-handed weapon is out', () => {
      const twoHanded = buildWeapon({ burden: 'TWO_HANDED', isPrimary: true });

      expect(canEquipWeaponAsPrimary(twoHanded, buildConstraints())).toBe(true);
    });

    it('blocks a two-handed weapon when the secondary slot is occupied', () => {
      const twoHanded = buildWeapon({ burden: 'TWO_HANDED', isPrimary: true });

      expect(canEquipWeaponAsPrimary(twoHanded, buildConstraints({ secondarySlotOccupied: true }))).toBe(false);
    });

    it('allows a one-handed primary weapon when only the primary slot matters', () => {
      const oneHanded = buildWeapon({ burden: 'ONE_HANDED', isPrimary: true });

      expect(canEquipWeaponAsPrimary(oneHanded, buildConstraints({ secondarySlotOccupied: true }))).toBe(true);
    });

    it('rejects a secondary-only weapon even with every slot free', () => {
      const secondaryOnly = buildWeapon({ isPrimary: false });

      expect(canEquipWeaponAsPrimary(secondaryOnly, buildConstraints())).toBe(false);
    });

    it('returns false when constraints are null', () => {
      expect(canEquipWeaponAsPrimary(buildWeapon({ isPrimary: true }), null)).toBe(false);
    });
  });

  describe('canEquipWeaponAsSecondary', () => {
    it('allows a secondary weapon when the secondary slot is free', () => {
      const secondaryOnly = buildWeapon({ isPrimary: false, burden: 'ONE_HANDED' });

      expect(canEquipWeaponAsSecondary(secondaryOnly, buildConstraints())).toBe(true);
    });

    it('rejects a primary-only weapon even with every slot free', () => {
      const primaryOnly = buildWeapon({ isPrimary: true });

      expect(canEquipWeaponAsSecondary(primaryOnly, buildConstraints())).toBe(false);
    });

    it('never allows a two-handed weapon into the off-hand', () => {
      const twoHanded = buildWeapon({ isPrimary: false, burden: 'TWO_HANDED' });

      expect(canEquipWeaponAsSecondary(twoHanded, buildConstraints())).toBe(false);
    });

    it('returns false when constraints are null', () => {
      expect(canEquipWeaponAsSecondary(buildWeapon({ isPrimary: false }), null)).toBe(false);
    });
  });
});
