import { describe, it, expect } from 'vitest';
import { armorCardEntry, InventoryEquipState, lootCardEntry, weaponCardEntry } from './inventory-card.mapper';
import { ArmorDisplay, LootDisplay, WeaponDisplay } from '../../character-sheet/models/character-sheet-view.model';

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

function buildLoot(overrides: Partial<LootDisplay> = {}): LootDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Torch',
    isConsumable: false,
    costTags: [],
    ...overrides,
  };
}

function buildState(overrides: Partial<InventoryEquipState> = {}): InventoryEquipState {
  return {
    activePrimaryWeapon: null,
    activeSecondaryWeapon: null,
    activeArmor: null,
    weaponConstraints: { primarySlotOccupied: false, secondarySlotOccupied: false, twoHandedEquipped: false },
    canEquipArmorSlot: true,
    ...overrides,
  };
}

describe('inventory-card.mapper', () => {
  describe('canEdit', () => {
    it('is true when the current user authored the item', () => {
      const weapon = buildWeapon({ createdByUserId: 42 });
      expect(weaponCardEntry(weapon, buildState(), 42).canEdit).toBe(true);
    });

    it('is false when a different user authored the item', () => {
      const weapon = buildWeapon({ createdByUserId: 42 });
      expect(weaponCardEntry(weapon, buildState(), 99).canEdit).toBe(false);
    });

    it('is false for official gear with no author, even for its viewer', () => {
      const weapon = buildWeapon({ createdByUserId: null });
      expect(weaponCardEntry(weapon, buildState(), 42).canEdit).toBe(false);
    });

    it('is false for a signed-out viewer, even on someone else\'s homebrew', () => {
      const weapon = buildWeapon({ createdByUserId: 42 });
      expect(weaponCardEntry(weapon, buildState(), null).canEdit).toBe(false);
    });
  });

  describe('removeBlockedReason', () => {
    it('blocks removal of an equipped weapon', () => {
      const weapon = buildWeapon({ inventoryEntryId: 1 });
      const state = buildState({ activePrimaryWeapon: weapon });

      expect(weaponCardEntry(weapon, state, null).removeBlockedReason).toBe('Unequip to remove');
    });

    it('allows removal of a stowed weapon', () => {
      const weapon = buildWeapon({ inventoryEntryId: 1 });

      expect(weaponCardEntry(weapon, buildState(), null).removeBlockedReason).toBeNull();
    });

    it('blocks removal of equipped armor', () => {
      const armor = buildArmor({ inventoryEntryId: 1 });
      const state = buildState({ activeArmor: armor });

      expect(armorCardEntry(armor, state, null).removeBlockedReason).toBe('Unequip to remove');
    });

    it('allows removal of unequipped armor', () => {
      const armor = buildArmor({ inventoryEntryId: 1 });

      expect(armorCardEntry(armor, buildState(), null).removeBlockedReason).toBeNull();
    });

    it('is always null for loot, which has no equip state', () => {
      expect(lootCardEntry(buildLoot(), null).removeBlockedReason).toBeNull();
    });
  });

  describe('weaponCardEntry equip actions', () => {
    it('offers exactly one equip action, matching the weapon\'s own primary slot', () => {
      const primaryWeapon = buildWeapon({ isPrimary: true });

      const actions = weaponCardEntry(primaryWeapon, buildState(), null).equipActions;

      expect(actions.length).toBe(1);
      expect(actions[0].kind).toBe('equip-primary');
    });

    it('offers exactly one equip action for a secondary-only weapon, matching its slot', () => {
      const secondaryWeapon = buildWeapon({ isPrimary: false });

      const actions = weaponCardEntry(secondaryWeapon, buildState(), null).equipActions;

      expect(actions.length).toBe(1);
      expect(actions[0].kind).toBe('equip-secondary');
    });

    it('offers a single unequip action for an equipped weapon', () => {
      const weapon = buildWeapon({ inventoryEntryId: 1 });
      const state = buildState({ activePrimaryWeapon: weapon });

      const actions = weaponCardEntry(weapon, state, null).equipActions;

      expect(actions).toEqual([
        { kind: 'unequip', label: 'Unequip', ariaLabel: 'Unequip Dagger', disabled: false, hint: null },
      ]);
    });

    it('populates equippedWeaponSlot only for an equipped weapon', () => {
      const equipped = buildWeapon({ inventoryEntryId: 1 });
      const stowed = buildWeapon({ inventoryEntryId: 2 });
      const state = buildState({ activePrimaryWeapon: equipped });

      expect(weaponCardEntry(equipped, state, null).equippedWeaponSlot).toBe('primary');
      expect(weaponCardEntry(stowed, state, null).equippedWeaponSlot).toBeNull();
    });

    it('names the two-handed hint when the weapon needs both hands but the off-hand is full', () => {
      const twoHanded = buildWeapon({ isPrimary: true, burden: 'TWO_HANDED' });
      const state = buildState({
        weaponConstraints: { primarySlotOccupied: false, secondarySlotOccupied: true, twoHandedEquipped: false },
      });

      const action = weaponCardEntry(twoHanded, state, null).equipActions[0];

      expect(action.disabled).toBe(true);
      expect(action.hint).toBe('Needs both hands free');
    });
  });

  describe('armorCardEntry equip action', () => {
    it('disables equip with a hint when another armor is already worn', () => {
      const armor = buildArmor();
      const state = buildState({ canEquipArmorSlot: false });

      const action = armorCardEntry(armor, state, null).equipActions[0];

      expect(action.disabled).toBe(true);
      expect(action.hint).toBe('Unequip current armor first');
    });

    it('enables equip with no hint when the armor slot is free', () => {
      const armor = buildArmor();

      const action = armorCardEntry(armor, buildState({ canEquipArmorSlot: true }), null).equipActions[0];

      expect(action.disabled).toBe(false);
      expect(action.hint).toBeNull();
    });
  });

  describe('lootCardEntry', () => {
    it('never offers equip actions for loot', () => {
      expect(lootCardEntry(buildLoot(), null).equipActions).toEqual([]);
    });

    it('leaves equippedWeaponSlot null for loot', () => {
      expect(lootCardEntry(buildLoot(), null).equippedWeaponSlot).toBeNull();
    });
  });
});
