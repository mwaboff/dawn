import { describe, it, expect } from 'vitest';
import { applyModifiers, collectEquipmentModifiers, SourcedModifier } from './modifier-calculator.utils';
import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';

function makeSheet(overrides: Partial<CharacterSheetResponse> = {}): CharacterSheetResponse {
  return {
    id: 1,
    name: 'Test Character',
    level: 1,
    evasion: 10,
    armorMax: 3,
    armorMarked: 0,
    majorDamageThreshold: 5,
    severeDamageThreshold: 10,
    agilityModifier: 0,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: false,
    finesseModifier: 0,
    finesseMarked: false,
    instinctModifier: 0,
    instinctMarked: false,
    presenceModifier: 0,
    presenceMarked: false,
    knowledgeModifier: 0,
    knowledgeMarked: false,
    hitPointMax: 6,
    hitPointMarked: 0,
    stressMax: 6,
    stressMarked: 0,
    hopeMax: 5,
    hopeMarked: 0,
    gold: 0,
    ownerId: 1,
    proficiency: 1,
    equippedDomainCardIds: [],
    vaultDomainCardIds: [],
    communityCardIds: [],
    ancestryCardIds: [],
    subclassCardIds: [],
    domainCardIds: [],
    inventoryWeaponIds: [],
    inventoryArmorIds: [],
    inventoryItemIds: [],
    experienceIds: [],
    createdAt: '2024-01-01T00:00:00Z',
    lastModifiedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('applyModifiers', () => {
  it('returns base value with hasModifier false when no modifiers provided', () => {
    const result = applyModifiers(10, [], 'EVASION');

    expect(result).toEqual({ base: 10, modified: 10, hasModifier: false, modifierSources: [] });
  });

  it('returns base value with hasModifier false when no modifiers match the target', () => {
    const modifiers: SourcedModifier[] = [{ target: 'HIT_POINT_MAX', operation: 'ADD', value: 2, sourceName: 'Armor' }];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result).toEqual({ base: 10, modified: 10, hasModifier: false, modifierSources: [] });
  });

  it('applies a single ADD operation correctly', () => {
    const modifiers: SourcedModifier[] = [{ target: 'EVASION', operation: 'ADD', value: 2, sourceName: 'Shield' }];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.modified).toBe(12);
  });

  it('sums multiple ADD operations', () => {
    const modifiers: SourcedModifier[] = [
      { target: 'EVASION', operation: 'ADD', value: 2, sourceName: 'Shield' },
      { target: 'EVASION', operation: 'ADD', value: 3, sourceName: 'Ring' },
    ];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.modified).toBe(15);
  });

  it('SET operation overrides base value', () => {
    const modifiers: SourcedModifier[] = [{ target: 'EVASION', operation: 'SET', value: 20, sourceName: 'Armor' }];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.modified).toBe(20);
    expect(result.base).toBe(10);
  });

  it('last SET wins when multiple SET operations are present', () => {
    const modifiers: SourcedModifier[] = [
      { target: 'EVASION', operation: 'SET', value: 15, sourceName: 'Armor' },
      { target: 'EVASION', operation: 'SET', value: 20, sourceName: 'Shield' },
    ];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.modified).toBe(20);
  });

  it('applies MULTIPLY with floor', () => {
    const modifiers: SourcedModifier[] = [{ target: 'EVASION', operation: 'MULTIPLY', value: 1.5, sourceName: 'Ring' }];

    const result = applyModifiers(7, modifiers, 'EVASION');

    expect(result.modified).toBe(10);
  });

  it('applies order: SET first, then MULTIPLY, then ADD', () => {
    const modifiers: SourcedModifier[] = [
      { target: 'EVASION', operation: 'ADD', value: 5, sourceName: 'Ring' },
      { target: 'EVASION', operation: 'SET', value: 10, sourceName: 'Armor' },
      { target: 'EVASION', operation: 'MULTIPLY', value: 2, sourceName: 'Shield' },
    ];

    // SET → 10, MULTIPLY → 20, ADD → 25
    const result = applyModifiers(1, modifiers, 'EVASION');

    expect(result.modified).toBe(25);
  });

  it('sets hasModifier true when modified differs from base', () => {
    const modifiers: SourcedModifier[] = [{ target: 'EVASION', operation: 'ADD', value: 1, sourceName: 'Shield' }];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.hasModifier).toBe(true);
  });

  it('sets hasModifier false when net result equals base value', () => {
    const modifiers: SourcedModifier[] = [
      { target: 'EVASION', operation: 'ADD', value: 2, sourceName: 'Shield' },
      { target: 'EVASION', operation: 'ADD', value: -2, sourceName: 'Curse' },
    ];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.hasModifier).toBe(false);
  });

  it('preserves base value regardless of modifications', () => {
    const modifiers: SourcedModifier[] = [{ target: 'EVASION', operation: 'SET', value: 99, sourceName: 'Armor' }];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.base).toBe(10);
  });

  it('includes sourceName in modifierSources for matching modifiers', () => {
    const modifiers: SourcedModifier[] = [
      { target: 'EVASION', operation: 'ADD', value: 2, sourceName: 'Heavy Armor' },
      { target: 'HIT_POINT_MAX', operation: 'ADD', value: 1, sourceName: 'Ring' },
    ];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.modifierSources).toEqual([
      { sourceName: 'Heavy Armor', operation: 'ADD', value: 2 },
    ]);
  });

  it('returns empty modifierSources when net result equals base', () => {
    const modifiers: SourcedModifier[] = [
      { target: 'EVASION', operation: 'ADD', value: 2, sourceName: 'Shield' },
      { target: 'EVASION', operation: 'ADD', value: -2, sourceName: 'Curse' },
    ];

    const result = applyModifiers(10, modifiers, 'EVASION');

    expect(result.modifierSources).toEqual([]);
  });
});

describe('collectEquipmentModifiers', () => {
  it('returns empty array when sheet has no equipment', () => {
    const sheet = makeSheet();

    const result = collectEquipmentModifiers(sheet);

    expect(result).toEqual([]);
  });

  it('returns empty array when equipment has no features', () => {
    const sheet = makeSheet({
      activeArmor: { id: 1, name: 'Test Armor' },
    });

    const result = collectEquipmentModifiers(sheet);

    expect(result).toEqual([]);
  });

  it('collects modifiers from armor features', () => {
    const sheet = makeSheet({
      activeArmor: {
        id: 1,
        name: 'Heavy Armor',
        features: [
          {
            description: 'Adds evasion',
            modifiers: [{ target: 'EVASION', operation: 'ADD', value: 2 }],
          },
        ],
      },
    });

    const result = collectEquipmentModifiers(sheet);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ target: 'EVASION', operation: 'ADD', value: 2, sourceName: 'Heavy Armor' });
  });

  it('collects modifiers from primary weapon features', () => {
    const sheet = makeSheet({
      activePrimaryWeapon: {
        id: 1,
        name: 'Sword',
        features: [
          {
            description: 'Grants bonus',
            modifiers: [{ target: 'HIT_POINT_MAX', operation: 'ADD', value: 1 }],
          },
        ],
      },
    });

    const result = collectEquipmentModifiers(sheet);

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('HIT_POINT_MAX');
    expect(result[0].sourceName).toBe('Sword');
  });

  it('collects modifiers from secondary weapon features', () => {
    const sheet = makeSheet({
      activeSecondaryWeapon: {
        id: 2,
        name: 'Dagger',
        features: [
          {
            description: 'Swift strike',
            modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }],
          },
        ],
      },
    });

    const result = collectEquipmentModifiers(sheet);

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('EVASION');
    expect(result[0].sourceName).toBe('Dagger');
  });

  it('collects modifiers from all equipment combined', () => {
    const sheet = makeSheet({
      activeArmor: {
        id: 1,
        name: 'Armor',
        features: [{ description: 'A', modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }] }],
      },
      activePrimaryWeapon: {
        id: 2,
        name: 'Sword',
        features: [{ description: 'B', modifiers: [{ target: 'HIT_POINT_MAX', operation: 'ADD', value: 2 }] }],
      },
      activeSecondaryWeapon: {
        id: 3,
        name: 'Shield',
        features: [{ description: 'C', modifiers: [{ target: 'ARMOR_SCORE', operation: 'ADD', value: 1 }] }],
      },
    });

    const result = collectEquipmentModifiers(sheet);

    expect(result).toHaveLength(3);
  });

  it('skips features that have no modifiers array', () => {
    const sheet = makeSheet({
      activeArmor: {
        id: 1,
        name: 'Armor',
        features: [{ description: 'No modifiers here' }],
      },
    });

    const result = collectEquipmentModifiers(sheet);

    expect(result).toEqual([]);
  });

  it('includes equipment name as sourceName', () => {
    const sheet = makeSheet({
      activeArmor: {
        id: 1,
        name: 'Enchanted Plate',
        features: [
          {
            description: 'Evasion penalty',
            modifiers: [{ target: 'EVASION', operation: 'ADD', value: -2 }],
          },
        ],
      },
    });

    const result = collectEquipmentModifiers(sheet);

    expect(result[0].sourceName).toBe('Enchanted Plate');
  });
});
