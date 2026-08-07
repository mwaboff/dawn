import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import {
  armorToOwnedItem,
  lootToOwnedItem,
  ownedItemKey,
  weaponToOwnedItem,
} from './custom-item.model';

function buildWeapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 7,
    name: 'Ashfang',
    expansionId: null,
    tier: 2,
    isOfficial: false,
    isPublic: false,
    isPrimary: true,
    trait: 'AGILITY',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceType: 'D8', modifier: 2, damageType: 'PHYSICAL' },
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  } as WeaponResponse;
}

function buildArmor(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 7,
    name: 'Emberplate',
    expansionId: null,
    tier: 3,
    isOfficial: false,
    isPublic: false,
    baseScore: 5,
    baseMajorThreshold: 8,
    baseSevereThreshold: 16,
    createdAt: '2026-01-01T00:00:00',
    lastModifiedAt: '2026-01-01T00:00:00',
    ...overrides,
  } as ArmorResponse;
}

describe('custom-item.model', () => {
  describe('ownedItemKey', () => {
    it('should distinguish the same id across two tables', () => {
      expect(ownedItemKey({ kind: 'weapon', id: 7 })).not.toBe(ownedItemKey({ kind: 'armor', id: 7 }));
    });

    it('should be stable for the same kind and id', () => {
      expect(ownedItemKey({ kind: 'loot', id: 3 })).toBe(ownedItemKey({ kind: 'loot', id: 3 }));
    });
  });

  describe('weaponToOwnedItem', () => {
    it('should summarise tier, trait, and damage', () => {
      expect(weaponToOwnedItem(buildWeapon()).detail).toBe('Tier 2 · Agility · D8+2');
    });

    it('should omit the damage modifier when there is none', () => {
      const weapon = buildWeapon({ damage: { diceType: 'D6', modifier: null, damageType: 'PHYSICAL' } } as Partial<WeaponResponse>);
      expect(weaponToOwnedItem(weapon).detail).toBe('Tier 2 · Agility · D6');
    });

    it('should say "Untiered" rather than "Tier 0" when tier is missing', () => {
      expect(weaponToOwnedItem(buildWeapon({ tier: undefined } as Partial<WeaponResponse>)).detail)
        .toContain('Untiered');
    });

    it('should tag the item with its kind so the profile can route it', () => {
      expect(weaponToOwnedItem(buildWeapon()).kind).toBe('weapon');
    });
  });

  describe('armorToOwnedItem', () => {
    it('should summarise tier, score, and thresholds', () => {
      expect(armorToOwnedItem(buildArmor()).detail).toBe('Tier 3 · 5 armor · 8/16');
    });
  });

  describe('lootToOwnedItem', () => {
    it('should mark consumables', () => {
      const loot = { id: 1, name: 'Vial', tier: 1, isConsumable: true } as LootApiResponse;
      expect(lootToOwnedItem(loot).detail).toBe('Tier 1 · Consumable');
    });

    it('should label non-consumable loot as an item', () => {
      const loot = { id: 1, name: 'Rope', tier: 1, isConsumable: false } as LootApiResponse;
      expect(lootToOwnedItem(loot).detail).toBe('Tier 1 · Item');
    });
  });
});
