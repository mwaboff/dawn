import { describe, it, expect } from 'vitest';
import { mapArmorToItemSummary, mapLootToItemSummary, mapWeaponToItemSummary } from './created-item.mapper';
import { WeaponResponse } from '../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../shared/models/loot-api.model';

function buildWeapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    name: 'Broadsword',
    expansionId: 1,
    tier: 1,
    isOfficial: false,
    creatorId: 42,
    isPrimary: true,
    trait: 'STRENGTH',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceCount: 1, diceType: 'D8', modifier: 0, damageType: 'PHYSICAL', notation: '1d8' },
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildArmor(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 2,
    name: 'Leather Armor',
    expansionId: 1,
    tier: 1,
    isOfficial: false,
    creatorId: 42,
    baseMajorThreshold: 7,
    baseSevereThreshold: 13,
    baseScore: 2,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildLoot(overrides: Partial<LootApiResponse> = {}): LootApiResponse {
  return {
    id: 3,
    name: 'Health Potion',
    ...overrides,
  };
}

describe('created-item.mapper', () => {
  it('maps a weapon response to a CreatedItemSummary', () => {
    const summary = mapWeaponToItemSummary(buildWeapon());

    expect(summary).toEqual({
      id: 1,
      itemType: 'weapon',
      name: 'Broadsword',
      tier: 1,
      trait: 'STRENGTH',
      range: 'MELEE',
      burden: 'ONE_HANDED',
      damageNotation: '1d8',
      features: undefined,
    });
  });

  it('maps weapon features when present', () => {
    const summary = mapWeaponToItemSummary(buildWeapon({
      features: [{ id: 1, name: 'Reach', description: 'Extends range.', featureType: 'PASSIVE', expansionId: 1, costTagIds: [], costTags: [], modifierIds: [], modifiers: [] }],
    }));

    expect(summary.features).toEqual([{ name: 'Reach', description: 'Extends range.' }]);
  });

  it('maps an armor response to a CreatedItemSummary', () => {
    const summary = mapArmorToItemSummary(buildArmor());

    expect(summary).toEqual({
      id: 2,
      itemType: 'armor',
      name: 'Leather Armor',
      tier: 1,
      baseScore: 2,
      baseMajorThreshold: 7,
      baseSevereThreshold: 13,
      features: undefined,
    });
  });

  it('maps a loot response to a CreatedItemSummary', () => {
    const summary = mapLootToItemSummary(buildLoot({ description: 'Heals 5 HP.', isConsumable: true, tier: 1 }));

    expect(summary).toEqual({
      id: 3,
      itemType: 'loot',
      name: 'Health Potion',
      tier: 1,
      description: 'Heals 5 HP.',
      isConsumable: true,
      features: undefined,
    });
  });
});
