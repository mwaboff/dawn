import { describe, it, expect } from 'vitest';
import { mapWeaponResponseToCardData } from './weapon.mapper';
import { WeaponResponse } from '../models/weapon-api.model';

function buildWeaponResponse(overrides: Partial<WeaponResponse> = {}): WeaponResponse {
  return {
    id: 1,
    name: 'Longbow',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    isPrimary: true,
    trait: 'AGILITY',
    range: 'FAR',
    burden: 'TWO_HANDED',
    damage: {
      diceCount: 1,
      diceType: 'D8',
      modifier: 0,
      damageType: 'PHYSICAL',
      notation: '1d8',
    },
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapWeaponResponseToCardData', () => {
  it('should map card name and id correctly', () => {
    const response = buildWeaponResponse({ id: 42, name: 'Warhammer' });
    const result = mapWeaponResponseToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Warhammer');
  });

  it('should map cardType to weapon', () => {
    const response = buildWeaponResponse();
    const result = mapWeaponResponseToCardData(response);

    expect(result.cardType).toBe('weapon');
  });

  it('should set subtitle to Physical Weapon for physical damage type', () => {
    const response = buildWeaponResponse({
      damage: { diceCount: 1, diceType: 'D8', modifier: 0, damageType: 'PHYSICAL', notation: '1d8' },
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.subtitle).toBe('Physical Weapon');
  });

  it('should set subtitle to Magic Weapon for magic damage type', () => {
    const response = buildWeaponResponse({
      damage: { diceCount: 1, diceType: 'D6', modifier: 2, damageType: 'MAGIC', notation: '1d6+2' },
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.subtitle).toBe('Magic Weapon');
  });

  it('should set subtitleSecondary to Tier label', () => {
    const response = buildWeaponResponse({ tier: 3 });
    const result = mapWeaponResponseToCardData(response);

    expect(result.subtitleSecondary).toBe('Tier 3');
  });

  it('should generate tags with notation, range, burden, and trait', () => {
    const response = buildWeaponResponse({
      damage: { diceCount: 1, diceType: 'D8', modifier: 0, damageType: 'PHYSICAL', notation: '1d8' },
      range: 'FAR',
      burden: 'TWO_HANDED',
      trait: 'AGILITY',
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.tags).toEqual(['1d8', 'Far', 'Two-Handed', 'Agility']);
  });

  it('should format VERY_CLOSE range to title case', () => {
    const response = buildWeaponResponse({ range: 'VERY_CLOSE' });
    const result = mapWeaponResponseToCardData(response);

    expect(result.tags).toContain('Very Close');
  });

  it('should format MELEE range to title case', () => {
    const response = buildWeaponResponse({ range: 'MELEE' });
    const result = mapWeaponResponseToCardData(response);

    expect(result.tags).toContain('Melee');
  });

  it('should format ONE_HANDED burden', () => {
    const response = buildWeaponResponse({ burden: 'ONE_HANDED' });
    const result = mapWeaponResponseToCardData(response);

    expect(result.tags).toContain('One-Handed');
  });

  it('should map features with correct Weapon Feature subtitle', () => {
    const response = buildWeaponResponse({
      features: [
        {
          id: 1,
          name: 'Keen Edge',
          description: 'Deals extra damage on critical hits',
          featureType: 'WEAPON',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Keen Edge');
    expect(result.features![0].description).toBe('Deals extra damage on critical hits');
    expect(result.features![0].subtitle).toBe('Weapon Feature');
  });

  it('should map feature costTag labels to uppercase', () => {
    const response = buildWeaponResponse({
      features: [
        {
          id: 2,
          name: 'Power Strike',
          description: 'A powerful blow',
          featureType: 'WEAPON',
          expansionId: 1,
          costTagIds: [1],
          costTags: [{ id: 1, label: 'action', category: 'cost' }],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.features![0].tags).toEqual(['ACTION']);
  });

  it('should handle features with no costTags', () => {
    const response = buildWeaponResponse({
      features: [
        {
          id: 3,
          name: 'Passive',
          description: 'Always active',
          featureType: 'WEAPON',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.features![0].tags).toBeUndefined();
  });

  it('should handle empty features array', () => {
    const response = buildWeaponResponse({ features: [] });
    const result = mapWeaponResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should handle undefined features', () => {
    const response = buildWeaponResponse({ features: undefined });
    const result = mapWeaponResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should store isPrimary in metadata', () => {
    const response = buildWeaponResponse({ isPrimary: false });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['isPrimary']).toBe(false);
  });

  it('should store burden in metadata', () => {
    const response = buildWeaponResponse({ burden: 'ONE_HANDED' });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['burden']).toBe('ONE_HANDED');
  });

  it('should store damageType in metadata', () => {
    const response = buildWeaponResponse({
      damage: { diceCount: 1, diceType: 'D6', modifier: 0, damageType: 'MAGIC', notation: '1d6' },
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['damageType']).toBe('MAGIC');
  });

  it('should store trait in metadata', () => {
    const response = buildWeaponResponse({ trait: 'STRENGTH' });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['trait']).toBe('STRENGTH');
  });

  it('should store range in metadata', () => {
    const response = buildWeaponResponse({ range: 'VERY_CLOSE' });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['range']).toBe('VERY_CLOSE');
  });

  it('should store tier in metadata', () => {
    const response = buildWeaponResponse({ tier: 3 });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['tier']).toBe(3);
  });

  it('should store full damage object in metadata', () => {
    const damage = { diceCount: 2, diceType: 'D10' as const, modifier: 1, damageType: 'PHYSICAL' as const, notation: '2d10+1' };
    const response = buildWeaponResponse({ damage });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['damage']).toEqual(damage);
  });

  it('should store flattened modifiers from all features in metadata', () => {
    const response = buildWeaponResponse({
      features: [
        {
          id: 1,
          name: 'Feature 1',
          description: 'Desc',
          featureType: 'WEAPON',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [1],
          modifiers: [{ id: 1, target: 'damage', operation: 'ADD', value: 2 }],
        },
        {
          id: 2,
          name: 'Feature 2',
          description: 'Desc',
          featureType: 'WEAPON',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [2],
          modifiers: [{ id: 2, target: 'range', operation: 'ADD', value: 1 }],
        },
      ],
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['modifiers']).toEqual([
      { id: 1, target: 'damage', operation: 'ADD', value: 2 },
      { id: 2, target: 'range', operation: 'ADD', value: 1 },
    ]);
  });

  it('should handle features with no modifiers', () => {
    const response = buildWeaponResponse({
      features: [
        {
          id: 1,
          name: 'Simple',
          description: 'Desc',
          featureType: 'WEAPON',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['modifiers']).toEqual([]);
  });

  it('should handle null diceCount in damage', () => {
    const response = buildWeaponResponse({
      damage: { diceCount: null, diceType: 'D6', modifier: 3, damageType: 'MAGIC', notation: '+3' },
    });
    const result = mapWeaponResponseToCardData(response);

    expect(result.metadata!['damage']).toEqual({
      diceCount: null,
      diceType: 'D6',
      modifier: 3,
      damageType: 'MAGIC',
      notation: '+3',
    });
  });
});
