import { describe, it, expect } from 'vitest';
import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import {
  armorCatalogEntry,
  catalogEntryKey,
  itemProvenance,
  lootCatalogEntry,
  weaponCatalogEntry,
} from './catalog-card.mapper';

function buildWeapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 7,
    name: 'Broadsword',
    expansionId: 1,
    tier: 2,
    isOfficial: true,
    isPublic: true,
    isPrimary: true,
    trait: 'STRENGTH',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceCount: 1, diceType: 'D8', modifier: 3, damageType: 'PHYSICAL', notation: '1d8+3' },
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  } as WeaponResponse;
}

function buildArmor(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 3,
    name: 'Gambeson',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    isPublic: true,
    baseScore: 3,
    baseMajorThreshold: 5,
    baseSevereThreshold: 11,
    createdAt: '',
    lastModifiedAt: '',
    ...overrides,
  } as ArmorResponse;
}

function buildLoot(overrides: Partial<LootApiResponse> = {}): LootApiResponse {
  return { id: 5, name: 'Rope', isOfficial: true, isConsumable: false, costTags: [], ...overrides };
}

describe('catalog-card.mapper', () => {
  describe('itemProvenance', () => {
    it('returns null for official content, which has no author', () => {
      expect(itemProvenance({ createdByUserId: null }, 42)).toBeNull();
    });

    it('returns null when the author field is absent entirely', () => {
      expect(itemProvenance({}, 42)).toBeNull();
    });

    it("marks the viewer's own homebrew as theirs", () => {
      expect(itemProvenance({ createdByUserId: 42 }, 42)).toBe('yours');
    });

    it('marks another player\'s shared homebrew as campaign gear', () => {
      expect(itemProvenance({ createdByUserId: 9, campaignIds: [3] }, 42)).toBe('campaign');
    });

    it('marks another player\'s unshared homebrew as public gear', () => {
      expect(itemProvenance({ createdByUserId: 9, campaignIds: [] }, 42)).toBe('public');
    });

    it('never claims an item is the viewer\'s when there is no signed-in viewer', () => {
      expect(itemProvenance({ createdByUserId: 9 }, null)).toBe('public');
    });
  });

  describe('catalogEntryKey', () => {
    it('qualifies the id by type, since a weapon and a loot item can share one', () => {
      expect(catalogEntryKey({ type: 'weapon', itemId: 1 })).not.toBe(catalogEntryKey({ type: 'loot', itemId: 1 }));
    });
  });

  describe('weaponCatalogEntry', () => {
    it('carries the catalogue id, not an inventory entry id', () => {
      const entry = weaponCatalogEntry(buildWeapon(), 1, null);

      expect(entry.itemId).toBe(7);
    });

    it('namespaces the card id so it cannot collide with an inventory card of the same number', () => {
      // Both grids are mounted while the finder is open, and EntityCard builds its body id from this.
      expect(weaponCatalogEntry(buildWeapon(), 1, null).card.id).toBe('catalog-7');
    });

    it("rolls the printed dice count by the viewing character's proficiency", () => {
      // A printed Daggerheart weapon leaves `diceCount` unset -- the wielder rolls proficiency dice.
      const weapon = buildWeapon({
        damage: { diceCount: null, diceType: 'D8', modifier: 3, damageType: 'PHYSICAL', notation: 'd8+3' },
      });

      expect(weaponCatalogEntry(weapon, 3, null).card.headline).toBe('T2 · 3d8+3 Phy');
    });

    it('leads the headline with tier, which compact cards have nowhere else to show it', () => {
      expect(weaponCatalogEntry(buildWeapon({ tier: 4 }), 1, null).card.headline).toContain('T4');
    });

    it('omits the tier prefix for gear that has no tier', () => {
      const entry = weaponCatalogEntry(buildWeapon({ tier: undefined }), 1, null);

      expect(entry.card.headline).toBe('1d8+3 Phy');
    });

    it('never marks a catalogue weapon as equipped', () => {
      const entry = weaponCatalogEntry(buildWeapon(), 1, null);

      expect(entry.card.badges?.some(badge => badge.label === 'Equipped')).toBe(false);
    });

    it('badges homebrew as custom', () => {
      const entry = weaponCatalogEntry(buildWeapon({ isOfficial: false, createdByUserId: 42 }), 1, 42);

      expect(entry.card.badges?.some(badge => badge.label === 'Custom')).toBe(true);
      expect(entry.provenance).toBe('yours');
    });

    it('hands the untouched response back for the add payload', () => {
      const weapon = buildWeapon();
      expect(weaponCatalogEntry(weapon, 1, null).item).toBe(weapon);
    });
  });

  describe('armorCatalogEntry', () => {
    it('maps the armor onto an unequipped card', () => {
      const entry = armorCatalogEntry(buildArmor(), null);

      expect(entry.type).toBe('armor');
      expect(entry.card.headline).toBe('T1 · Score 3');
      expect(entry.card.badges?.some(badge => badge.label === 'Equipped')).toBe(false);
    });
  });

  describe('lootCatalogEntry', () => {
    it('names a consumable in the card type tab', () => {
      const entry = lootCatalogEntry(buildLoot({ isConsumable: true }), null);

      expect(entry.card.eyebrow).toBe('Consumable');
    });

    it('reports campaign-shared loot as campaign gear', () => {
      const entry = lootCatalogEntry(buildLoot({ createdByUserId: 9, campaignIds: [2] }), 42);

      expect(entry.provenance).toBe('campaign');
    });

    it('falls back to the description, since most loot carries no cost tags to headline', () => {
      const entry = lootCatalogEntry(buildLoot({ description: 'Grants a +1 bonus. Then it breaks.' }), null);

      expect(entry.card.headline).toBe('Grants a +1 bonus.');
    });

    it('prefers a cost tag over the description when there is one', () => {
      const entry = lootCatalogEntry(buildLoot({ costTags: ['Rare'], description: 'A coil of hemp.' }), null);

      expect(entry.card.headline).toBe('Rare');
    });

    it('trims a long single-sentence description rather than letting it run', () => {
      const entry = lootCatalogEntry(buildLoot({ description: 'A '.repeat(80) }), null);

      expect(entry.card.headline?.length).toBeLessThanOrEqual(80);
      expect(entry.card.headline?.endsWith('…')).toBe(true);
    });

    it('leaves the headline empty when there is nothing to say', () => {
      expect(lootCatalogEntry(buildLoot(), null).card.headline).toBeUndefined();
    });
  });
});
