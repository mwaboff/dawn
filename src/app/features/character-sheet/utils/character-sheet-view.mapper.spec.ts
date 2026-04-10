import { describe, it, expect } from 'vitest';
import { mapToCharacterSheetView } from './character-sheet-view.mapper';
import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';

function makeSheet(overrides: Partial<CharacterSheetResponse> = {}): CharacterSheetResponse {
  return {
    id: 42,
    name: 'Aelindra',
    pronouns: 'she/her',
    level: 3,
    evasion: 12,
    armorMax: 3,
    armorMarked: 1,
    majorDamageThreshold: 7,
    severeDamageThreshold: 14,
    agilityModifier: 2,
    agilityMarked: false,
    strengthModifier: 0,
    strengthMarked: true,
    finesseModifier: 1,
    finesseMarked: false,
    instinctModifier: -1,
    instinctMarked: false,
    presenceModifier: 2,
    presenceMarked: false,
    knowledgeModifier: 0,
    knowledgeMarked: false,
    hitPointMax: 8,
    hitPointMarked: 3,
    stressMax: 6,
    stressMarked: 2,
    hopeMax: 5,
    hopeMarked: 1,
    gold: 10,
    ownerId: 99,
    proficiency: 1,
    equippedDomainCardIds: [],
    vaultDomainCardIds: [],
    communityCardIds: [],
    ancestryCardIds: [],
    subclassCardIds: [],
    domainCardIds: [],
    inventoryWeapons: [],
    inventoryArmors: [],
    inventoryItems: [],
    experienceIds: [],
    createdAt: '2024-01-01T00:00:00Z',
    lastModifiedAt: '2024-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('mapToCharacterSheetView', () => {
  describe('basic fields', () => {
    it('maps id correctly', () => {
      const result = mapToCharacterSheetView(makeSheet({ id: 99 }));

      expect(result.id).toBe(99);
    });

    it('maps name correctly', () => {
      const result = mapToCharacterSheetView(makeSheet({ name: 'Brynn' }));

      expect(result.name).toBe('Brynn');
    });

    it('maps pronouns correctly', () => {
      const result = mapToCharacterSheetView(makeSheet({ pronouns: 'they/them' }));

      expect(result.pronouns).toBe('they/them');
    });

    it('maps level correctly', () => {
      const result = mapToCharacterSheetView(makeSheet({ level: 5 }));

      expect(result.level).toBe(5);
    });

    it('maps hitPointMarked', () => {
      const result = mapToCharacterSheetView(makeSheet({ hitPointMarked: 4 }));

      expect(result.hitPointMarked).toBe(4);
    });

    it('maps armorMarked', () => {
      const result = mapToCharacterSheetView(makeSheet({ armorMarked: 2 }));

      expect(result.armorMarked).toBe(2);
    });

    it('maps armorMax', () => {
      const result = mapToCharacterSheetView(makeSheet({ armorMax: 5 }));

      expect(result.armorMax).toBe(5);
    });

    it('maps hopeMarked', () => {
      const result = mapToCharacterSheetView(makeSheet({ hopeMarked: 3 }));

      expect(result.hopeMarked).toBe(3);
    });

    it('maps stressMarked', () => {
      const result = mapToCharacterSheetView(makeSheet({ stressMarked: 1 }));

      expect(result.stressMarked).toBe(1);
    });

    it('maps gold', () => {
      const result = mapToCharacterSheetView(makeSheet({ gold: 25 }));

      expect(result.gold).toBe(25);
    });

    it('maps ownerName when present', () => {
      const result = mapToCharacterSheetView(makeSheet({ ownerName: 'player1' }));

      expect(result.ownerName).toBe('player1');
    });

    it('maps ownerName as undefined when not present', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.ownerName).toBeUndefined();
    });


  });

  describe('traits', () => {
    it('maps all 6 traits', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.traits).toHaveLength(6);
    });

    it('maps Agility trait with correct name and abbreviation', () => {
      const result = mapToCharacterSheetView(makeSheet({ agilityModifier: 3, agilityMarked: true }));
      const agility = result.traits.find(t => t.name === 'Agility');

      expect(agility).toBeDefined();
      expect(agility?.abbreviation).toBe('AGI');
      expect(agility?.modifier).toBe(3);
      expect(agility?.marked).toBe(true);
    });

    it('maps Strength trait', () => {
      const result = mapToCharacterSheetView(makeSheet({ strengthModifier: -1, strengthMarked: false }));
      const trait = result.traits.find(t => t.name === 'Strength');

      expect(trait?.abbreviation).toBe('STR');
      expect(trait?.modifier).toBe(-1);
    });

    it('maps Finesse trait', () => {
      const result = mapToCharacterSheetView(makeSheet());
      const trait = result.traits.find(t => t.name === 'Finesse');

      expect(trait?.abbreviation).toBe('FIN');
    });

    it('maps Instinct trait', () => {
      const result = mapToCharacterSheetView(makeSheet());
      const trait = result.traits.find(t => t.name === 'Instinct');

      expect(trait?.abbreviation).toBe('INS');
    });

    it('maps Presence trait', () => {
      const result = mapToCharacterSheetView(makeSheet());
      const trait = result.traits.find(t => t.name === 'Presence');

      expect(trait?.abbreviation).toBe('PRE');
    });

    it('maps Knowledge trait', () => {
      const result = mapToCharacterSheetView(makeSheet());
      const trait = result.traits.find(t => t.name === 'Knowledge');

      expect(trait?.abbreviation).toBe('KNO');
    });
  });

  describe('equipment', () => {
    it('returns null for activePrimaryWeapon when not present', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.activePrimaryWeapon).toBeNull();
    });

    it('returns null for activeSecondaryWeapon when not present', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.activeSecondaryWeapon).toBeNull();
    });

    it('returns null for activeArmor when not present', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.activeArmor).toBeNull();
    });

    it('maps primary weapon fields', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Longsword', trait: 'STR', range: 'Melee', burden: 'One-Handed',
            damage: { diceCount: 1, diceType: 'd8', modifier: 0, damageType: 'Physical', notation: '1d8' },
            features: [],
          },
        }],
      });
      const result = mapToCharacterSheetView(sheet);
      expect(result.activePrimaryWeapon?.id).toBe(10);
      expect(result.activePrimaryWeapon?.name).toBe('Longsword');
      expect(result.activePrimaryWeapon?.damage).toBe('1d8');
    });

    it('maps weapon damage to empty string when damage is missing', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 1, equipped: true, slot: 'PRIMARY',
          weapon: { id: 1, name: 'Club', features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.damage).toBe('');
    });

    it('maps weapon features', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 1, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 1,
            name: 'Magic Sword',
            features: [
              {
                name: 'Enchanted',
                description: 'Deals extra damage',
                costTags: [{ label: 'Magic', category: 'type' }],
              },
            ],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.features).toHaveLength(1);
      expect(result.activePrimaryWeapon?.features[0].name).toBe('Enchanted');
      expect(result.activePrimaryWeapon?.features[0].description).toBe('Deals extra damage');
      expect(result.activePrimaryWeapon?.features[0].tags).toEqual(['Magic']);
    });

    it('maps armor baseScore', () => {
      const sheet = makeSheet({
        inventoryArmors: [{
          id: 200, armorId: 5, equipped: true,
          armor: { id: 5, name: 'Chainmail', baseScore: 4, features: [] },
        }],
      });
      const result = mapToCharacterSheetView(sheet);
      expect(result.activeArmor?.id).toBe(5);
      expect(result.activeArmor?.name).toBe('Chainmail');
      expect(result.activeArmor?.baseScore).toBe(4);
    });

    it('maps armor baseScore to 0 when not provided', () => {
      const sheet = makeSheet({
        inventoryArmors: [{
          id: 200, armorId: 5, equipped: true,
          armor: { id: 5, name: 'Leather Armor', features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activeArmor?.baseScore).toBe(0);
    });
  });

  describe('cards', () => {
    it('maps subclass cards basic fields', () => {
      const sheet = makeSheet({
        subclassCards: [
          { id: 1, name: 'Ranger Path', features: [{ description: 'Tracking', name: 'Track' }] },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.subclassCards).toHaveLength(1);
      expect(result.subclassCards[0].id).toBe(1);
      expect(result.subclassCards[0].name).toBe('Ranger Path');
    });

    it('maps subclass card extended fields', () => {
      const sheet = makeSheet({
        subclassCards: [
          {
            id: 1,
            name: 'Guardian Path',
            features: [],
            associatedClassId: 5,
            associatedClassName: 'Warrior',
            subclassPathName: 'Iron Wall',
            domainNames: ['Blade', 'Bone'],
            level: 'FOUNDATION',
            description: 'Defensive mastery',
          },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.subclassCards[0].associatedClassId).toBe(5);
      expect(result.subclassCards[0].associatedClassName).toBe('Warrior');
      expect(result.subclassCards[0].subclassPathName).toBe('Iron Wall');
      expect(result.subclassCards[0].domainNames).toEqual(['Blade', 'Bone']);
      expect(result.subclassCards[0].level).toBe('FOUNDATION');
      expect(result.subclassCards[0].description).toBe('Defensive mastery');
    });

    it('maps ancestry cards', () => {
      const sheet = makeSheet({
        ancestryCards: [{ id: 2, name: 'Elven Heritage', features: [] }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.ancestryCards).toHaveLength(1);
      expect(result.ancestryCards[0].name).toBe('Elven Heritage');
    });

    it('maps ancestry card description', () => {
      const sheet = makeSheet({
        ancestryCards: [{ id: 2, name: 'Elven Heritage', features: [], description: 'Born of starlight' }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.ancestryCards[0].description).toBe('Born of starlight');
    });

    it('maps community cards', () => {
      const sheet = makeSheet({
        communityCards: [{ id: 3, name: 'Village Roots', features: [] }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.communityCards).toHaveLength(1);
      expect(result.communityCards[0].name).toBe('Village Roots');
    });

    it('maps community card description', () => {
      const sheet = makeSheet({
        communityCards: [{ id: 3, name: 'Village Roots', features: [], description: 'Small but strong' }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.communityCards[0].description).toBe('Small but strong');
    });

    it('maps domain cards with extended fields', () => {
      const sheet = makeSheet({
        domainCards: [
          {
            id: 4,
            name: 'Shadowstep',
            features: [],
            description: 'Slip between shadows',
            associatedDomainName: 'Midnight',
            level: 2,
            recallCost: 1,
            type: 'Ability',
          },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.domainCards).toHaveLength(1);
      expect(result.domainCards[0].id).toBe(4);
      expect(result.domainCards[0].name).toBe('Shadowstep');
      expect(result.domainCards[0].description).toBe('Slip between shadows');
      expect(result.domainCards[0].domainName).toBe('Midnight');
      expect(result.domainCards[0].level).toBe(2);
      expect(result.domainCards[0].recallCost).toBe(1);
      expect(result.domainCards[0].type).toBe('Ability');
    });

    it('splits domain cards into equipped and vault based on IDs', () => {
      const sheet = makeSheet({
        equippedDomainCardIds: [10, 11],
        vaultDomainCardIds: [12],
        domainCards: [
          { id: 10, name: 'Fireball', features: [] },
          { id: 11, name: 'Ice Shield', features: [] },
          { id: 12, name: 'Wind Rush', features: [] },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.equippedDomainCards).toHaveLength(2);
      expect(result.equippedDomainCards.map(c => c.id)).toEqual([10, 11]);
      expect(result.vaultDomainCards).toHaveLength(1);
      expect(result.vaultDomainCards[0].id).toBe(12);
    });

    it('returns empty equipped and vault when no domain cards', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.equippedDomainCards).toEqual([]);
      expect(result.vaultDomainCards).toEqual([]);
    });

    it('sets maxEquippedDomainCards to 5', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.maxEquippedDomainCards).toBe(5);
    });

    it('returns empty arrays for cards when fields are undefined', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.subclassCards).toEqual([]);
      expect(result.ancestryCards).toEqual([]);
      expect(result.communityCards).toEqual([]);
      expect(result.domainCards).toEqual([]);
    });
  });

  describe('experiences', () => {
    it('maps experiences', () => {
      const sheet = makeSheet({
        experiences: [
          { id: 1, characterSheetId: 42, description: 'Survived a dungeon', modifier: 2 },
          { id: 2, characterSheetId: 42, description: 'Made an ally', modifier: 1 },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.experiences).toHaveLength(2);
      expect(result.experiences[0].id).toBe(1);
      expect(result.experiences[0].description).toBe('Survived a dungeon');
      expect(result.experiences[0].modifier).toBe(2);
    });

    it('returns empty array when experiences are undefined', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.experiences).toEqual([]);
    });
  });

  describe('stat modifiers', () => {
    it('applies equipment modifiers to evasion', () => {
      const sheet = makeSheet({
        evasion: 10,
        inventoryArmors: [{
          id: 200, armorId: 1, equipped: true,
          armor: {
            id: 1, name: 'Magic Armor',
            features: [{
              description: 'Evasion boost',
              modifiers: [{ target: 'EVASION', operation: 'ADD', value: 2 }],
            }],
          },
        }],
      });
      const result = mapToCharacterSheetView(sheet);
      expect(result.evasion.base).toBe(10);
      expect(result.evasion.modified).toBe(12);
      expect(result.evasion.hasModifier).toBe(true);
    });

    it('returns unmodified stat when no equipment modifiers affect it', () => {
      const result = mapToCharacterSheetView(makeSheet({ hitPointMax: 8 }));

      expect(result.hitPointMax.base).toBe(8);
      expect(result.hitPointMax.modified).toBe(8);
      expect(result.hitPointMax.hasModifier).toBe(false);
      expect(result.hitPointMax.modifierSources).toEqual([]);
    });

    it('maps armorScore using armorMax as base', () => {
      const result = mapToCharacterSheetView(makeSheet({ armorMax: 4 }));

      expect(result.armorScore.base).toBe(4);
    });

    it('maps proficiency as a DisplayStat', () => {
      const result = mapToCharacterSheetView(makeSheet({ proficiency: 2 }));

      expect(result.proficiency.base).toBe(2);
      expect(result.proficiency.modified).toBe(2);
      expect(result.proficiency.hasModifier).toBe(false);
    });
  });

  describe('inventory entry mapping', () => {
    it('propagates tier for inventory weapon', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 10, weaponId: 1, equipped: false,
          weapon: { id: 1, name: 'Sword', tier: 2, features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryWeapons[0].tier).toBe(2);
    });

    it('propagates tier for inventory armor', () => {
      const sheet = makeSheet({
        inventoryArmors: [{
          id: 11, armorId: 2, equipped: false,
          armor: { id: 2, name: 'Plate', tier: 4, baseScore: 5, features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryArmors[0].tier).toBe(4);
    });

    it('propagates tier for active primary weapon', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 20, weaponId: 3, equipped: true, slot: 'PRIMARY',
          weapon: { id: 3, name: 'Axe', tier: 3, features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.tier).toBe(3);
    });

    it('propagates tier for active armor', () => {
      const sheet = makeSheet({
        inventoryArmors: [{
          id: 21, armorId: 4, equipped: true,
          armor: { id: 4, name: 'Brigandine', tier: 2, baseScore: 3, features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activeArmor?.tier).toBe(2);
    });

    it('propagates inventoryEntryId for inventory weapon and preserves catalog id', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 99, weaponId: 5, equipped: false,
          weapon: { id: 5, name: 'Dagger', features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryWeapons[0].inventoryEntryId).toBe(99);
      expect(result.inventoryWeapons[0].id).toBe(5);
    });

    it('preserves distinct inventoryEntryIds when weapons share a weaponId', () => {
      const sheet = makeSheet({
        inventoryWeapons: [
          {
            id: 101, weaponId: 7, equipped: false,
            weapon: { id: 7, name: 'Shortbow', features: [] },
          },
          {
            id: 102, weaponId: 7, equipped: false,
            weapon: { id: 7, name: 'Shortbow', features: [] },
          },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryWeapons).toHaveLength(2);
      expect(result.inventoryWeapons.map(w => w.inventoryEntryId)).toEqual([101, 102]);
      expect(result.inventoryWeapons.map(w => w.id)).toEqual([7, 7]);
    });

    it('preserves distinct inventoryEntryIds when armors share an armorId', () => {
      const sheet = makeSheet({
        inventoryArmors: [
          {
            id: 201, armorId: 9, equipped: false,
            armor: { id: 9, name: 'Leather', baseScore: 3, features: [] },
          },
          {
            id: 202, armorId: 9, equipped: false,
            armor: { id: 9, name: 'Leather', baseScore: 3, features: [] },
          },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryArmors).toHaveLength(2);
      expect(result.inventoryArmors.map(a => a.inventoryEntryId)).toEqual([201, 202]);
      expect(result.inventoryArmors.map(a => a.id)).toEqual([9, 9]);
    });

    it('preserves distinct inventoryEntryIds when loot items share a lootId', () => {
      const sheet = makeSheet({
        inventoryItems: [
          {
            id: 301, lootId: 15,
            loot: { id: 15, name: 'Potion', isConsumable: true },
          },
          {
            id: 302, lootId: 15,
            loot: { id: 15, name: 'Potion', isConsumable: true },
          },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryItems).toHaveLength(2);
      expect(result.inventoryItems.map(i => i.inventoryEntryId)).toEqual([301, 302]);
      expect(result.inventoryItems.map(i => i.id)).toEqual([15, 15]);
    });

    it('propagates inventoryEntryId for loot and preserves catalog id', () => {
      const sheet = makeSheet({
        inventoryItems: [{
          id: 50, lootId: 8,
          loot: { id: 8, name: 'Potion', isConsumable: true },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryItems[0].inventoryEntryId).toBe(50);
      expect(result.inventoryItems[0].id).toBe(8);
    });
  });
});
