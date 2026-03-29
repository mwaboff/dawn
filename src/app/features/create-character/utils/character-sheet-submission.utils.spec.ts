import { describe, it, expect } from 'vitest';

import { toCreateCharacterSheetRequest } from './character-sheet-submission.utils';
import { CharacterSheetData } from '../models/character-sheet.model';

function buildCharacterSheetData(overrides: Partial<CharacterSheetData> = {}): CharacterSheetData {
  return {
    name: 'Aria',
    pronouns: 'she/her',
    level: 1,
    evasion: 8,
    hitPointMax: 6,
    hitPointMarked: 0,
    hopeMax: 6,
    hopeMarked: 2,
    stressMax: 6,
    stressMarked: 0,
    armorMax: 2,
    armorMarked: 0,
    majorDamageThreshold: 3,
    severeDamageThreshold: 6,
    agilityModifier: 2,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: false,
    finesseModifier: 1,
    finesseMarked: false,
    instinctModifier: 0,
    instinctMarked: false,
    presenceModifier: 0,
    presenceMarked: false,
    knowledgeModifier: -1,
    knowledgeMarked: false,
    gold: 0,
    inventoryWeapons: [{ weaponId: 10, equipped: true, slot: 'PRIMARY' as const }],
    inventoryArmors: [{ armorId: 5, equipped: true }],
    communityCardIds: [1],
    ancestryCardIds: [2],
    subclassCardIds: [3],
    domainCardIds: [4, 7],
    equippedDomainCardIds: [4, 7],
    vaultDomainCardIds: [],
    experiences: [{ name: 'Acrobatics', modifier: 2 }],
    ...overrides,
  };
}

describe('toCreateCharacterSheetRequest', () => {
  it('should map name and pronouns', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData());
    expect(result.name).toBe('Aria');
    expect(result.pronouns).toBe('she/her');
  });

  it('should map level and core stats', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData());
    expect(result.level).toBe(1);
    expect(result.evasion).toBe(8);
    expect(result.hitPointMax).toBe(6);
    expect(result.hitPointMarked).toBe(0);
    expect(result.hopeMax).toBe(6);
    expect(result.hopeMarked).toBe(2);
    expect(result.stressMax).toBe(6);
    expect(result.stressMarked).toBe(0);
    expect(result.gold).toBe(0);
  });

  it('should map armor stats', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData());
    expect(result.armorMax).toBe(2);
    expect(result.armorMarked).toBe(0);
    expect(result.majorDamageThreshold).toBe(3);
    expect(result.severeDamageThreshold).toBe(6);
  });

  it('should map all trait modifiers', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData());
    expect(result.agilityModifier).toBe(2);
    expect(result.agilityMarked).toBe(false);
    expect(result.strengthModifier).toBe(0);
    expect(result.finesseModifier).toBe(1);
    expect(result.instinctModifier).toBe(0);
    expect(result.presenceModifier).toBe(0);
    expect(result.knowledgeModifier).toBe(-1);
  });

  it('should map inventory arrays', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData());
    expect(result.inventoryWeapons).toEqual([{ weaponId: 10, equipped: true, slot: 'PRIMARY' }]);
    expect(result.inventoryArmors).toEqual([{ armorId: 5, equipped: true }]);
  });

  it('should always set inventoryItems to empty array', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData());
    expect(result.inventoryItems).toEqual([]);
  });

  it('should map card IDs', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData());
    expect(result.communityCardIds).toEqual([1]);
    expect(result.ancestryCardIds).toEqual([2]);
    expect(result.subclassCardIds).toEqual([3]);
    expect(result.domainCardIds).toEqual([4, 7]);
    expect(result.equippedDomainCardIds).toEqual([4, 7]);
    expect(result.vaultDomainCardIds).toEqual([]);
  });

  it('should handle undefined pronouns', () => {
    const result = toCreateCharacterSheetRequest(buildCharacterSheetData({ pronouns: undefined }));
    expect(result.pronouns).toBeUndefined();
  });

  it('should handle empty inventory arrays', () => {
    const result = toCreateCharacterSheetRequest(
      buildCharacterSheetData({ inventoryWeapons: [], inventoryArmors: [] }),
    );
    expect(result.inventoryWeapons).toEqual([]);
    expect(result.inventoryArmors).toEqual([]);
  });
});
