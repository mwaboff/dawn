import { describe, it, expect } from 'vitest';
import { mapToCharacterSheetView } from './character-sheet-view.mapper';
import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';
import { FeatureModifierDisplay } from '../models/character-sheet-view.model';

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

    it('maps comboDie when present', () => {
      const result = mapToCharacterSheetView(makeSheet({ comboDie: 'D8' }));

      expect(result.comboDie).toBe('D8');
    });

    it('maps comboDie as undefined when not present', () => {
      const result = mapToCharacterSheetView(makeSheet());

      expect(result.comboDie).toBeUndefined();
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
      expect(agility?.modifier.modified).toBe(3);
      expect(agility?.marked).toBe(true);
    });

    it('maps Strength trait', () => {
      const result = mapToCharacterSheetView(makeSheet({ strengthModifier: -1, strengthMarked: false }));
      const trait = result.traits.find(t => t.name === 'Strength');

      expect(trait?.abbreviation).toBe('STR');
      expect(trait?.modifier.modified).toBe(-1);
    });

    it('applies equipped armor modifier to a trait', () => {
      const sheet = makeSheet({
        agilityModifier: 1,
        inventoryArmors: [{
          id: 200, armorId: 1, equipped: true,
          armor: {
            id: 1, name: 'Swiftweave Cloak',
            features: [{
              description: 'Nimble step',
              modifiers: [{ target: 'AGILITY', operation: 'ADD', value: 1 }],
            }],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);
      const agility = result.traits.find(t => t.name === 'Agility');

      expect(agility?.modifier.base).toBe(1);
      expect(agility?.modifier.modified).toBe(2);
      expect(agility?.modifier.hasModifier).toBe(true);
      expect(agility?.modifier.modifierSources[0].sourceName).toBe('Swiftweave Cloak');
    });

    it('returns unmodified trait when no modifiers target it', () => {
      const result = mapToCharacterSheetView(makeSheet({ strengthModifier: 2 }));
      const strength = result.traits.find(t => t.name === 'Strength');

      expect(strength?.modifier.base).toBe(2);
      expect(strength?.modifier.modified).toBe(2);
      expect(strength?.modifier.hasModifier).toBe(false);
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
      expect(result.activePrimaryWeapon?.damage).toBe('1d8 Phy');
      expect(result.activePrimaryWeapon?.damageDice).toEqual({ type: 'd8', diceCount: 1, modifier: 0 });
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
      expect(result.activePrimaryWeapon?.damageDice).toBeNull();
    });

    it('normalizes an uppercase diceType (e.g. D10) in damageDice', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Greatbow', features: [],
            damage: { diceCount: 1, diceType: 'D10', modifier: 2, damageType: 'PHYSICAL', notation: 'ignored' },
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.damageDice).toEqual({ type: 'd10', diceCount: 1, modifier: 2 });
    });

    it('returns null damageDice for an unparseable diceType so the roll affordance can be hidden', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Mystery Weapon', features: [],
            damage: { diceCount: 1, diceType: 'd7', modifier: 0, damageType: 'PHYSICAL', notation: 'ignored' },
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.damageDice).toBeNull();
    });

    it('keeps diceCount null in damageDice when the API omits it, for the builder to resolve against Proficiency', () => {
      const sheet = makeSheet({
        proficiency: 4,
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Greatbow', features: [],
            damage: { diceCount: null, diceType: 'd10', modifier: 3, damageType: 'PHYSICAL', notation: 'ignored' },
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.damageDice).toEqual({ type: 'd10', diceCount: null, modifier: 3 });
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

    it('damage uses proficiency when diceCount is null', () => {
      const sheet = makeSheet({
        proficiency: 4,
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Greatbow', features: [],
            damage: { diceCount: null, diceType: 'D10', modifier: 3, damageType: 'PHYSICAL', notation: 'ignored' },
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.damage).toBe('4d10+3 Phy');
    });

    it('damage omits a modifier suffix when modifier is null (real flat-die weapons, e.g. Broadsword)', () => {
      // Confirmed live via core-postgres-1: weapons.modifier is NULL for 13 real weapon rows.
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 11, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 11, name: 'Broadsword', features: [],
            damage: { diceCount: 1, diceType: 'D8', modifier: null, damageType: 'PHYSICAL', notation: 'd8 phy' },
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.damage).toBe('1d8 Phy');
    });

    it('isPrimary is mapped from the weapon when false', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'SECONDARY',
          weapon: { id: 10, name: 'Offhand Dagger', isPrimary: false, features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activeSecondaryWeapon?.isPrimary).toBe(false);
    });

    it('isPrimary defaults to true when missing from weapon', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: { id: 10, name: 'Sword', features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.isPrimary).toBe(true);
    });

    it('range and trait are formatted from enum labels', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: { id: 10, name: 'Rapier', range: 'VERY_CLOSE', trait: 'FINESSE', features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.range).toBe('Very Close');
      expect(result.activePrimaryWeapon?.trait).toBe('Finesse');
    });
  });

  describe('feature mapping', () => {
    it('tags are sorted alphabetically', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Sword', features: [{
              description: 'A fancy feature',
              costTags: [{ label: 'Zephyr', category: 'X' }, { label: 'Arcane', category: 'X' }],
            }],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon?.features[0].tags).toEqual(['Arcane', 'Zephyr']);
    });

    it('modifiers are mapped with ADD formatted label (positive)', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Sword', features: [{
              description: 'Evasion boost',
              modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }],
            }],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);
      const modifier = result.activePrimaryWeapon?.features[0].modifiers[0] as FeatureModifierDisplay;

      expect(modifier.label).toBe('+1 Evasion');
      expect(modifier.value).toBe(1);
      expect(modifier.operation).toBe('ADD');
      expect(modifier.target).toBe('EVASION');
    });

    it('modifiers are mapped with ADD formatted label (negative)', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Cursed Blade', features: [{
              description: 'Evasion penalty',
              modifiers: [{ target: 'EVASION', operation: 'ADD', value: -1 }],
            }],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);
      const modifier = result.activePrimaryWeapon?.features[0].modifiers[0] as FeatureModifierDisplay;

      expect(modifier.label).toBe('-1 Evasion');
    });

    it('modifiers are mapped with MULTIPLY formatted label', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          weapon: {
            id: 10, name: 'Power Blade', features: [{
              description: 'Double proficiency',
              modifiers: [{ target: 'PROFICIENCY', operation: 'MULTIPLY', value: 2 }],
            }],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);
      const modifier = result.activePrimaryWeapon?.features[0].modifiers[0] as FeatureModifierDisplay;

      expect(modifier.label).toBe('×2 Proficiency');
    });
  });

  describe('cards', () => {
    it('maps every entry of sheet.classes, preserving the order the server sent them in', () => {
      const sheet = makeSheet({
        classes: [
          { id: 9, name: 'Wizard', description: 'Master of arcane', hopeFeatures: [], classFeatures: [] },
          { id: 2, name: 'Warrior', description: 'Master of arms', hopeFeatures: [], classFeatures: [] },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.classCards).toHaveLength(2);
      expect(result.classCards.map(card => card.name)).toEqual(['Wizard', 'Warrior']);
      expect(result.classCards.map(card => card.id)).toEqual([9, 2]);
    });

    it('falls back to the deprecated singular sheet.class when classes is absent', () => {
      const sheet = makeSheet({
        class: { id: 9, name: 'Wizard', description: 'Master of arcane', hopeFeatures: [], classFeatures: [] },
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.classCards).toHaveLength(1);
      expect(result.classCards[0].id).toBe(9);
      expect(result.classCards[0].name).toBe('Wizard');
    });

    it('prefers classes over the deprecated singular class when both are present', () => {
      const sheet = makeSheet({
        class: { id: 9, name: 'Wizard', hopeFeatures: [], classFeatures: [] },
        classes: [
          { id: 9, name: 'Wizard', hopeFeatures: [], classFeatures: [] },
          { id: 2, name: 'Warrior', hopeFeatures: [], classFeatures: [] },
        ],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.classCards.map(card => card.name)).toEqual(['Wizard', 'Warrior']);
    });

    it('returns empty classCards when neither classes nor class is provided', () => {
      const sheet = makeSheet({});

      const result = mapToCharacterSheetView(sheet);

      expect(result.classCards).toEqual([]);
    });

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

    it('armorScore is 0 when no armor equipped', () => {
      const result = mapToCharacterSheetView(makeSheet({ armorMax: 4 }));

      expect(result.armorScore.base).toBe(0);
      expect(result.armorScore.modified).toBe(0);
    });

    it('armorScore uses equipped armor baseScore', () => {
      const sheet = makeSheet({
        inventoryArmors: [{
          id: 200, armorId: 1, equipped: true,
          armor: { id: 1, name: 'Plate', baseScore: 5, features: [] },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.armorScore.base).toBe(5);
    });

    it('major/severe thresholds derive from level when no armor equipped', () => {
      const result = mapToCharacterSheetView(makeSheet({ level: 3 }));

      expect(result.majorDamageThreshold.base).toBe(3);
      expect(result.majorDamageThreshold.modified).toBe(3);
      expect(result.severeDamageThreshold.base).toBe(6);
      expect(result.severeDamageThreshold.modified).toBe(6);
    });

    it('major/severe thresholds add level to equipped armor base thresholds', () => {
      const sheet = makeSheet({
        level: 3,
        inventoryArmors: [{
          id: 200, armorId: 1, equipped: true,
          armor: {
            id: 1, name: 'Chainmail', baseScore: 4,
            baseMajorThreshold: 7, baseSevereThreshold: 12,
            features: [],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.majorDamageThreshold.modified).toBe(10);
      expect(result.severeDamageThreshold.modified).toBe(15);
    });

    it('feature modifiers stack on top of the threshold base', () => {
      const sheet = makeSheet({
        level: 2,
        inventoryArmors: [{
          id: 200, armorId: 1, equipped: true,
          armor: {
            id: 1, name: 'Reinforced Mail', baseScore: 3,
            baseMajorThreshold: 6, baseSevereThreshold: 10,
            features: [{
              description: 'Sturdy',
              modifiers: [{ target: 'MAJOR_DAMAGE_THRESHOLD', operation: 'ADD', value: 2 }],
            }],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.majorDamageThreshold.base).toBe(8);
      expect(result.majorDamageThreshold.modified).toBe(10);
    });

    it('ArmorDisplay carries the equipped armor base thresholds independent of level', () => {
      const sheet = makeSheet({
        level: 5,
        inventoryArmors: [{
          id: 200, armorId: 1, equipped: true,
          armor: {
            id: 1, name: 'Chainmail', baseScore: 4,
            baseMajorThreshold: 7, baseSevereThreshold: 12,
            features: [],
          },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activeArmor?.baseMajorThreshold).toBe(7);
      expect(result.activeArmor?.baseSevereThreshold).toBe(12);
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

  describe('restricted content (SRD vs. paid-expansion content gating)', () => {
    it('replaces a restricted class card with the locked placeholder', () => {
      const sheet = makeSheet({
        // `name` is real API shape only because the response type keeps it required -- a
        // restricted response never actually sends it, and the assertion below shows the mapper
        // ignores it in favour of the shared placeholder title.
        class: { id: 9, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' },
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.classCards).toHaveLength(1);
      expect(result.classCards[0]).toEqual({
        id: 9,
        name: 'Content Not Available',
        description: expect.stringContaining('Hope & Fear'),
        features: [],
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('degrades gracefully when a restricted card has no known expansion', () => {
      const sheet = makeSheet({
        ancestryCards: [{ id: 5, name: 'ignored', restricted: true }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.ancestryCards[0].restricted).toBe(true);
      expect(result.ancestryCards[0].expansionName).toBeUndefined();
      expect(result.ancestryCards[0].description).not.toContain('undefined');
    });

    it('replaces a restricted subclass card, leaving the subclass-only fields unset', () => {
      const sheet = makeSheet({
        subclassCards: [{ id: 6, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.subclassCards[0].name).toBe('Content Not Available');
      expect(result.subclassCards[0].restricted).toBe(true);
      expect(result.subclassCards[0].associatedClassName).toBeUndefined();
      expect(result.subclassCards[0].level).toBeUndefined();
    });

    it('replaces a restricted domain card, leaving the domain-only fields unset', () => {
      const sheet = makeSheet({
        equippedDomainCardIds: [7],
        domainCards: [{ id: 7, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.equippedDomainCards[0].name).toBe('Content Not Available');
      expect(result.equippedDomainCards[0].restricted).toBe(true);
      expect(result.equippedDomainCards[0].domainName).toBeUndefined();
      expect(result.equippedDomainCards[0].recallCost).toBeUndefined();
    });

    it('replaces a restricted equipped weapon with a safe placeholder', () => {
      const sheet = makeSheet({
        inventoryWeapons: [{
          id: 100, weaponId: 10, equipped: true, slot: 'PRIMARY',
          // `name` is real API shape only because `WeaponResponse.name` is typed required --
          // on the wire a restricted response never sends it, and the assertion below shows the
          // mapper ignores it (the placeholder title wins) rather than reading it.
          weapon: { id: 10, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activePrimaryWeapon).toEqual({
        id: 10,
        inventoryEntryId: 100,
        name: 'Content Not Available',
        // `false`, not `true` -- `isPrimary` is one of the fields the backend redacted along with
        // everything else, so it defaults to the inert value rather than a fabricated affirmative
        // claim (see `buildRestrictedWeaponDisplay`'s own doc comment).
        isPrimary: false,
        damage: '',
        trait: '',
        range: '',
        burden: '',
        features: [],
        restricted: true,
        expansionName: 'Hope & Fear',
      });
      expect(result.activePrimaryWeapon?.damageDice).toBeUndefined();
    });

    it('replaces restricted equipped armor with a safe placeholder', () => {
      const sheet = makeSheet({
        inventoryArmors: [{
          id: 200, armorId: 20, equipped: true,
          armor: { id: 20, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.activeArmor).toEqual({
        id: 20,
        inventoryEntryId: 200,
        name: 'Content Not Available',
        baseScore: 0,
        baseMajorThreshold: 0,
        baseSevereThreshold: 0,
        features: [],
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('falls back armorScore/thresholds to the no-bonus numbers for a restricted equipped armor, not a throw or NaN', () => {
      // `equippedArmor.baseScore`/`baseMajorThreshold`/`baseSevereThreshold` are redacted along
      // with everything else once the armor is restricted, so `mapToCharacterSheetView` treats the
      // missing bonus as 0 -- level-only thresholds, no armor score. These numbers still have to be
      // real (not undefined/NaN): the Armor pip tracker's `max` reads `armorScore.modified`
      // directly and needs something to render pips against. The arithmetic is deliberately
      // unchanged by `armorRestricted` -- a hidden armor still contributes what it contributes,
      // there is nothing to compute -- the flag only tells a template the number is incomplete;
      // see the next two tests and `character-sheet.spec.ts`/`character-sheet-beta.spec.ts` for
      // where that flag actually gets acted on.
      const sheet = makeSheet({
        level: 3,
        inventoryArmors: [{
          id: 200, armorId: 20, equipped: true,
          armor: { id: 20, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      // Both thresholds use the `+ level` branch here, not the no-armor `level`/`level * 2`
      // branch -- `equippedArmor` is truthy (a restricted stub, but still an equipped entry), so
      // only its own baseMajorThreshold/baseSevereThreshold are what fall back to 0.
      expect(result.armorScore.modified).toBe(0);
      expect(result.majorDamageThreshold.modified).toBe(3);
      expect(result.severeDamageThreshold.modified).toBe(3);
    });

    it('sets armorRestricted when the equipped armor is restricted', () => {
      const sheet = makeSheet({
        inventoryArmors: [{
          id: 200, armorId: 20, equipped: true,
          armor: { id: 20, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' },
        }],
      });

      expect(mapToCharacterSheetView(sheet).armorRestricted).toBe(true);
    });

    it('leaves armorRestricted false for an unrestricted equipped armor', () => {
      const sheet = makeSheet({
        inventoryArmors: [{ id: 200, armorId: 20, equipped: true, armor: { id: 20, name: 'Chainmail', baseScore: 4 } }],
      });

      expect(mapToCharacterSheetView(sheet).armorRestricted).toBe(false);
    });

    it('leaves armorRestricted false when nothing is equipped', () => {
      expect(mapToCharacterSheetView(makeSheet({ inventoryArmors: [] })).armorRestricted).toBe(false);
    });

    it('replaces a restricted inventory item with a safe placeholder', () => {
      const sheet = makeSheet({
        inventoryItems: [{
          id: 300, lootId: 30,
          loot: { id: 30, name: 'ignored', restricted: true, expansionName: 'Hope & Fear' },
        }],
      });

      const result = mapToCharacterSheetView(sheet);

      expect(result.inventoryItems[0]).toEqual({
        id: 30,
        inventoryEntryId: 300,
        name: 'Content Not Available',
        description: expect.stringContaining('Hope & Fear'),
        isConsumable: false,
        costTags: [],
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });
  });
});
