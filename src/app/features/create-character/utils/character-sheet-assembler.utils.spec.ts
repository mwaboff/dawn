import { describe, it, expect } from 'vitest';
import { assembleCharacterSheet } from './character-sheet-assembler.utils';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { TraitAssignments } from '../models/trait.model';
import { DEFAULT_MAJOR_THRESHOLD, DEFAULT_SEVERE_THRESHOLD } from '../models/character-sheet.model';

function makeCard(id: number, type: CardData['cardType'], overrides: Partial<CardData> = {}): CardData {
  return { id, name: `Card ${id}`, description: '', cardType: type, ...overrides };
}

const classCard = makeCard(1, 'class', {
  metadata: { startingEvasion: 10, startingHitPoints: 8 },
});
const subclassCard = makeCard(2, 'subclass');
const ancestryCard = makeCard(3, 'ancestry');
const communityCard = makeCard(4, 'community');

const traits: TraitAssignments = {
  agility: 2,
  strength: 1,
  finesse: 0,
  instinct: 1,
  presence: -1,
  knowledge: 0,
};

const baseParams = {
  name: 'Aria',
  pronouns: 'she/her',
  classCard,
  subclassCard,
  ancestryCard,
  communityCard,
  traits,
  primaryWeapon: null,
  secondaryWeapon: null,
  armor: null,
  experiences: [],
  domainCards: [],
};

describe('assembleCharacterSheet', () => {
  it('should set name and pronouns', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.name).toBe('Aria');
    expect(result.pronouns).toBe('she/her');
  });

  it('should set level to 1', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.level).toBe(1);
  });

  it('should derive evasion from class metadata', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.evasion).toBe(10);
  });

  it('should derive hitPointMax from class metadata', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.hitPointMax).toBe(8);
  });

  it('should set default hope values', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.hopeMax).toBe(6);
    expect(result.hopeMarked).toBe(2);
  });

  it('should set default stress values', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.stressMax).toBe(6);
    expect(result.stressMarked).toBe(0);
  });

  it('should set default major threshold when no armor', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.majorDamageThreshold).toBe(DEFAULT_MAJOR_THRESHOLD);
  });

  it('should set default severe threshold when no armor', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.severeDamageThreshold).toBe(DEFAULT_SEVERE_THRESHOLD);
  });

  it('should derive armor values from armor card', () => {
    const armor = makeCard(5, 'armor', {
      metadata: { baseScore: 3, baseMajorThreshold: 4, baseSevereThreshold: 8 },
    });
    const result = assembleCharacterSheet({ ...baseParams, armor });
    expect(result.armorMax).toBe(3);
    expect(result.majorDamageThreshold).toBe(4);
    expect(result.severeDamageThreshold).toBe(8);
    expect(result.inventoryArmors).toEqual([{ armorId: 5, equipped: true }]);
  });

  it('should map trait modifiers', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.agilityModifier).toBe(2);
    expect(result.strengthModifier).toBe(1);
    expect(result.finesseModifier).toBe(0);
    expect(result.instinctModifier).toBe(1);
    expect(result.presenceModifier).toBe(-1);
    expect(result.knowledgeModifier).toBe(0);
  });

  it('should set all trait marked to false', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.agilityMarked).toBe(false);
    expect(result.strengthMarked).toBe(false);
    expect(result.finesseMarked).toBe(false);
    expect(result.instinctMarked).toBe(false);
    expect(result.presenceMarked).toBe(false);
    expect(result.knowledgeMarked).toBe(false);
  });

  it('should set weapon IDs from selected weapons', () => {
    const primary = makeCard(10, 'weapon');
    const secondary = makeCard(11, 'weapon');
    const result = assembleCharacterSheet({ ...baseParams, primaryWeapon: primary, secondaryWeapon: secondary });
    expect(result.inventoryWeapons).toEqual([
      { weaponId: 10, equipped: true, slot: 'PRIMARY' },
      { weaponId: 11, equipped: true, slot: 'SECONDARY' },
    ]);
  });

  it('should set null weapon IDs when no weapons', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.inventoryWeapons).toEqual([]);
  });

  it('should include card IDs for ancestry, community, subclass', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.ancestryCardIds).toEqual([3]);
    expect(result.communityCardIds).toEqual([4]);
    expect(result.subclassCardIds).toEqual([2]);
  });

  it('should include domain card IDs', () => {
    const domainCards = [makeCard(20, 'domain'), makeCard(21, 'domain')];
    const result = assembleCharacterSheet({ ...baseParams, domainCards });
    expect(result.domainCardIds).toEqual([20, 21]);
  });

  it('should auto-equip all domain cards when 5 or fewer', () => {
    const domainCards = [makeCard(20, 'domain'), makeCard(21, 'domain'), makeCard(22, 'domain')];
    const result = assembleCharacterSheet({ ...baseParams, domainCards });
    expect(result.equippedDomainCardIds).toEqual([20, 21, 22]);
    expect(result.vaultDomainCardIds).toEqual([]);
  });

  it('should auto-equip first 5 and vault the rest when more than 5', () => {
    const domainCards = Array.from({ length: 7 }, (_, i) => makeCard(30 + i, 'domain'));
    const result = assembleCharacterSheet({ ...baseParams, domainCards });
    expect(result.equippedDomainCardIds).toEqual([30, 31, 32, 33, 34]);
    expect(result.vaultDomainCardIds).toEqual([35, 36]);
  });

  it('should deduplicate domain card IDs', () => {
    const domainCards = [makeCard(20, 'domain'), makeCard(20, 'domain'), makeCard(21, 'domain')];
    const result = assembleCharacterSheet({ ...baseParams, domainCards });
    expect(result.domainCardIds).toEqual([20, 21]);
    expect(result.equippedDomainCardIds).toEqual([20, 21]);
    expect(result.vaultDomainCardIds).toEqual([]);
  });

  it('should filter incomplete experiences', () => {
    const experiences = [
      { name: 'Acrobatics', modifier: 2 },
      { name: '', modifier: null },
      { name: '  ', modifier: 1 },
    ];
    const result = assembleCharacterSheet({ ...baseParams, experiences });
    expect(result.experiences).toEqual([{ name: 'Acrobatics', modifier: 2 }]);
  });

  it('should set gold to 0', () => {
    const result = assembleCharacterSheet(baseParams);
    expect(result.gold).toBe(0);
  });

  it('should handle missing pronouns', () => {
    const result = assembleCharacterSheet({ ...baseParams, pronouns: undefined });
    expect(result.pronouns).toBeUndefined();
  });
});
