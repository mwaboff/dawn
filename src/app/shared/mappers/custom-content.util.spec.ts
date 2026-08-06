import { describe, it, expect } from 'vitest';
import { CUSTOM_CONTENT_TAG, isCustomContent } from './custom-content.util';
import { mapWeaponResponseToCardData } from './weapon.mapper';
import { mapArmorResponseToCardData } from './armor.mapper';
import { mapLootToCardData } from './loot.mapper';
import { WeaponResponse } from '../models/weapon-api.model';
import { ArmorResponse } from '../models/armor-api.model';
import { LootApiResponse } from '../models/loot-api.model';

function weapon(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    name: 'Blade',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    isPublic: false,
    isPrimary: true,
    trait: 'AGILITY',
    range: 'MELEE',
    burden: 'ONE_HANDED',
    damage: { diceCount: null, diceType: 'D8', modifier: null, damageType: 'PHYSICAL', notation: 'd8 phy' },
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function armor(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 1,
    name: 'Plate',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    isPublic: false,
    baseMajorThreshold: 7,
    baseSevereThreshold: 15,
    baseScore: 4,
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('isCustomContent', () => {
  it('treats official content as not custom', () => {
    expect(isCustomContent({ isOfficial: true })).toBe(false);
  });

  it('treats unofficial content as custom', () => {
    expect(isCustomContent({ isOfficial: false })).toBe(true);
  });

  it('treats an absent flag as not custom rather than guessing', () => {
    expect(isCustomContent({})).toBe(false);
  });
});

describe('custom content badge', () => {
  it('does not tag an official weapon', () => {
    expect(mapWeaponResponseToCardData(weapon()).tags).not.toContain(CUSTOM_CONTENT_TAG);
  });

  it('tags a custom weapon', () => {
    const card = mapWeaponResponseToCardData(weapon({ isOfficial: false, expansionId: null }));
    expect(card.tags).toContain(CUSTOM_CONTENT_TAG);
  });

  it('keeps the weapon stat tags alongside the custom tag', () => {
    const card = mapWeaponResponseToCardData(weapon({ isOfficial: false }));
    expect(card.tags).toContain('d8 phy');
    expect(card.tags).toContain('Melee');
  });

  it('tags custom armor', () => {
    const card = mapArmorResponseToCardData(armor({ isOfficial: false, expansionId: null }));
    expect(card.tags).toContain(CUSTOM_CONTENT_TAG);
  });

  it('does not tag official armor', () => {
    expect(mapArmorResponseToCardData(armor()).tags).not.toContain(CUSTOM_CONTENT_TAG);
  });

  it('tags custom loot', () => {
    const loot: LootApiResponse = { id: 1, name: 'Charm', tier: 1, isOfficial: false };
    expect(mapLootToCardData(loot).tags).toContain(CUSTOM_CONTENT_TAG);
  });

  it('does not tag official loot', () => {
    const loot: LootApiResponse = { id: 1, name: 'Charm', tier: 1, isOfficial: true };
    expect(mapLootToCardData(loot).tags).not.toContain(CUSTOM_CONTENT_TAG);
  });
});

describe('null expansion rendering', () => {
  it('maps a weapon with no sourcebook without throwing', () => {
    expect(() => mapWeaponResponseToCardData(weapon({ isOfficial: false, expansionId: null })))
      .not.toThrow();
  });

  it('carries a null expansionId through to metadata rather than inventing one', () => {
    const card = mapWeaponResponseToCardData(weapon({ isOfficial: false, expansionId: null }));
    expect(card.metadata?.['expansionId']).toBeNull();
  });

  it('maps armor with no sourcebook without throwing', () => {
    expect(() => mapArmorResponseToCardData(armor({ isOfficial: false, expansionId: null })))
      .not.toThrow();
  });
});
