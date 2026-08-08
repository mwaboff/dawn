import { describe, it, expect } from 'vitest';
import {
  ancestryCardToEntity,
  armorToEntity,
  classCardToEntity,
  communityCardToEntity,
  CUSTOM_ITEM_BADGE,
  domainCardToEntity,
  isCustomItem,
  lootToEntity,
  subclassCardToEntity,
  weaponToEntity,
} from './entity-card.mapper';
import {
  ArmorDisplay,
  CardSummary,
  DomainCardSummary,
  FeatureDisplay,
  LootDisplay,
  SubclassCardSummary,
  WeaponDisplay,
} from '../../character-sheet/models/character-sheet-view.model';

function buildFeature(overrides: Partial<FeatureDisplay> = {}): FeatureDisplay {
  return { name: 'Shadowblighted', description: 'A dark gift.', tags: [], modifiers: [], ...overrides };
}

function buildWeapon(overrides: Partial<WeaponDisplay> = {}): WeaponDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Dagger',
    isPrimary: true,
    damage: '1d4',
    trait: 'Finesse',
    range: 'Melee',
    burden: 'ONE_HANDED',
    features: [],
    ...overrides,
  };
}

function buildArmor(overrides: Partial<ArmorDisplay> = {}): ArmorDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Leather Armor',
    baseScore: 3,
    baseMajorThreshold: 2,
    baseSevereThreshold: 4,
    features: [],
    ...overrides,
  };
}

function buildLoot(overrides: Partial<LootDisplay> = {}): LootDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Torch',
    isConsumable: false,
    costTags: [],
    ...overrides,
  };
}

describe('entity-card.mapper', () => {
  describe('classCardToEntity / ancestryCardToEntity / communityCardToEntity', () => {
    const card: CardSummary = { id: 1, name: 'Sorcerer', description: 'Arcane bloodline.', features: [] };

    it('maps the shared CardSummary fields onto EntityCardData', () => {
      expect(classCardToEntity(card)).toEqual({
        id: 1,
        name: 'Sorcerer',
        cardType: 'class',
        description: 'Arcane bloodline.',
        features: [],
      });
    });

    it('tags each mapper with its own cardType', () => {
      expect(ancestryCardToEntity(card).cardType).toBe('ancestry');
      expect(communityCardToEntity(card).cardType).toBe('community');
    });

    it('drops a blank feature name rather than passing through an empty string', () => {
      const withFeature = { ...card, features: [buildFeature({ name: '' })] };
      expect(classCardToEntity(withFeature).features?.[0].name).toBeUndefined();
    });

    it('carries tags and modifiers through unchanged', () => {
      const withFeature = {
        ...card,
        features: [buildFeature({ tags: ['Spell'], modifiers: [{ label: '+2 Evasion', value: 2, operation: 'ADD' as const, target: 'evasion' }] })],
      };
      const mapped = classCardToEntity(withFeature).features?.[0];
      expect(mapped?.tags).toEqual(['Spell']);
      expect(mapped?.modifiers).toEqual([{ label: '+2 Evasion', value: 2 }]);
    });
  });

  describe('subclassCardToEntity', () => {
    it('maps card.level to the subtitle, not a badge', () => {
      const card: SubclassCardSummary = { id: 2, name: 'Warden of the Elements', features: [], level: 'Mastery' };
      expect(subclassCardToEntity(card).subtitle).toBe('Mastery');
    });

    it('builds "Label: value" meta lines for domains and associated class', () => {
      const card: SubclassCardSummary = {
        id: 2,
        name: 'Warden of the Elements',
        features: [],
        domainNames: ['Sage', 'Valor'],
        associatedClassName: 'Druid',
      };
      expect(subclassCardToEntity(card).meta).toEqual([
        { label: 'Domains', value: 'Sage, Valor' },
        { label: 'Class', value: 'Druid' },
      ]);
    });

    it('omits meta entirely when neither domains nor class are present', () => {
      const card: SubclassCardSummary = { id: 2, name: 'Warden of the Elements', features: [] };
      expect(subclassCardToEntity(card).meta).toBeUndefined();
    });
  });

  describe('domainCardToEntity', () => {
    it('puts the domain name in the eyebrow, overriding the "Domain Card" type tab', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], domainName: 'Valor' };
      expect(domainCardToEntity(card).eyebrow).toBe('Valor');
      expect(domainCardToEntity(card).cardType).toBe('domainCard');
    });

    it('formats level/type/recall as single-string badges with no colon', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], level: 3, type: 'Spell', recallCost: 2 };
      expect(domainCardToEntity(card).badges).toEqual([
        { label: 'Lvl 3' },
        { label: 'Spell' },
        { label: 'Recall 2' },
      ]);
    });

    it('omits badges entirely when level/type/recall are all absent', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [] };
      expect(domainCardToEntity(card).badges).toBeUndefined();
    });
  });

  describe('isCustomItem / CUSTOM_ITEM_BADGE', () => {
    it('is true for gear with an author', () => {
      expect(isCustomItem({ createdByUserId: 42 })).toBe(true);
    });

    it('is false for official gear with a null author', () => {
      expect(isCustomItem({ createdByUserId: null })).toBe(false);
    });

    it('is false when createdByUserId is entirely absent', () => {
      expect(isCustomItem({})).toBe(false);
    });

    it('carries a decorative glyph alongside the "Custom" label', () => {
      expect(CUSTOM_ITEM_BADGE).toEqual({ label: 'Custom', glyph: '✦' });
    });
  });

  describe('weaponToEntity', () => {
    it('labels the eyebrow "Primary Weapon" for a primary-slot weapon', () => {
      expect(weaponToEntity(buildWeapon({ isPrimary: true }), null).eyebrow).toBe('Primary Weapon');
    });

    it('labels the eyebrow "Secondary Weapon" for a secondary-slot weapon', () => {
      expect(weaponToEntity(buildWeapon({ isPrimary: false }), null).eyebrow).toBe('Secondary Weapon');
    });

    it('builds labelled meta rows for damage, range and trait', () => {
      const weapon = buildWeapon({ damage: '2d8+1', range: 'Very Far', trait: 'Instinct', burden: 'ONE_HANDED' });

      expect(weaponToEntity(weapon, null).meta).toEqual([
        { label: 'Damage', value: '2d8+1' },
        { label: 'Range', value: 'Very Far' },
        { label: 'Trait', value: 'Instinct' },
        { label: 'Burden', value: 'One-handed' },
      ]);
    });

    it('humanises a TWO_HANDED burden into "Two-handed"', () => {
      const weapon = buildWeapon({ burden: 'TWO_HANDED' });

      const burdenRow = weaponToEntity(weapon, null).meta?.find(row => row.label === 'Burden');

      expect(burdenRow?.value).toBe('Two-handed');
    });

    it('adds an Equipped/Primary badge only when a slot is passed', () => {
      const weapon = buildWeapon();

      expect(weaponToEntity(weapon, 'primary').badges).toContainEqual({ label: 'Equipped', value: 'Primary' });
      expect(weaponToEntity(weapon, null).badges ?? []).not.toContainEqual(
        expect.objectContaining({ label: 'Equipped' }),
      );
    });

    it('adds an Equipped/Secondary badge for the secondary slot', () => {
      expect(weaponToEntity(buildWeapon(), 'secondary').badges).toContainEqual({ label: 'Equipped', value: 'Secondary' });
    });

    it('includes the Custom badge for an authored weapon', () => {
      const weapon = buildWeapon({ createdByUserId: 7 });

      expect(weaponToEntity(weapon, null).badges).toContainEqual(CUSTOM_ITEM_BADGE);
    });

    it('omits the Custom badge for official gear', () => {
      const weapon = buildWeapon({ createdByUserId: null });

      expect(weaponToEntity(weapon, null).badges ?? []).not.toContainEqual(CUSTOM_ITEM_BADGE);
    });
  });

  describe('armorToEntity', () => {
    it('builds a Damage Thresholds meta line from the major and severe values', () => {
      const armor = buildArmor({ baseScore: 5, baseMajorThreshold: 3, baseSevereThreshold: 6 });

      expect(armorToEntity(armor, false).meta).toEqual([
        { label: 'Armor Score', value: '5' },
        { label: 'Damage Thresholds', value: 'Major 3 / Severe 6' },
      ]);
    });

    it('adds a bare Equipped badge when worn', () => {
      expect(armorToEntity(buildArmor(), true).badges).toContainEqual({ label: 'Equipped' });
    });

    it('omits the Equipped badge when stowed', () => {
      expect(armorToEntity(buildArmor(), false).badges ?? []).not.toContainEqual(
        expect.objectContaining({ label: 'Equipped' }),
      );
    });
  });

  describe('lootToEntity', () => {
    it('labels the eyebrow "Consumable" when the loot is consumable', () => {
      expect(lootToEntity(buildLoot({ isConsumable: true })).eyebrow).toBe('Consumable');
    });

    it('omits the eyebrow for non-consumable loot', () => {
      expect(lootToEntity(buildLoot({ isConsumable: false })).eyebrow).toBeUndefined();
    });
  });
});
