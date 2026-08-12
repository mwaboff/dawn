import { describe, it, expect } from 'vitest';
import {
  ancestryCardToEntity,
  armorToEntity,
  classCardToEntity,
  communityCardToEntity,
  domainCardToEntity,
  isCustomItem,
  lootToEntity,
  subclassCardToEntity,
  weaponToEntity,
} from './entity-card.mapper';
import { CUSTOM_ITEM_BADGE } from '../../../shared/mappers/custom-content.util';
import {
  ArmorDisplay,
  CardSummary,
  DomainCardSummary,
  FeatureDisplay,
  LootDisplay,
  SubclassCardSummary,
  WeaponDisplay,
} from '../../character-sheet/models/character-sheet-view.model';
import { RESTRICTED_CARD_TITLE } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

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
    it('title-cases the raw server level enum into the subtitle', () => {
      const card: SubclassCardSummary = { id: 2, name: 'Warden of the Elements', features: [], level: 'FOUNDATION' };
      expect(subclassCardToEntity(card).subtitle).toBe('Foundation');
    });

    it('leaves the type tab to say "Subclass" rather than overriding it with the level', () => {
      const card: SubclassCardSummary = { id: 2, name: 'Warden of the Elements', features: [], level: 'MASTERY' };
      expect(subclassCardToEntity(card).eyebrow).toBeUndefined();
    });

    it('emits no subtitle for a subclass card with no level', () => {
      const card: SubclassCardSummary = { id: 2, name: 'Warden of the Elements', features: [] };
      expect(subclassCardToEntity(card).subtitle).toBeUndefined();
    });

    it('builds label/value meta rows for domains and associated class', () => {
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
    it('leaves the type tab to say "Domain Card" rather than overriding it with the domain', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], domainName: 'Valor' };
      expect(domainCardToEntity(card).eyebrow).toBeUndefined();
    });

    it('joins the domain and the title-cased card type into the subtitle', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], domainName: 'Valor', type: 'SPELL' };
      expect(domainCardToEntity(card).subtitle).toBe('Valor · Spell');
    });

    it('drops the separator when only the domain is known', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], domainName: 'Valor' };
      expect(domainCardToEntity(card).subtitle).toBe('Valor');
    });

    it('drops the separator when only the card type is known', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], type: 'GRIMOIRE' };
      expect(domainCardToEntity(card).subtitle).toBe('Grimoire');
    });

    it('omits the subtitle when neither domain nor card type is known', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [] };
      expect(domainCardToEntity(card).subtitle).toBeUndefined();
    });

    it('carries the level as the only badge, in the power-level scalar shape', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], level: 3, type: 'SPELL', recallCost: 2 };
      expect(domainCardToEntity(card).badges).toEqual([{ label: 'Level', value: '3' }]);
    });

    it('omits badges when the card has no level', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], recallCost: 2 };
      expect(domainCardToEntity(card).badges).toBeUndefined();
    });

    it('moves recall cost out of the badges and into a meta row', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], level: 3, recallCost: 2 };
      expect(domainCardToEntity(card).meta).toEqual([{ label: 'Recall', value: '2' }]);
    });

    it('keeps a zero recall cost, which is a real value rather than a missing one', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], recallCost: 0 };
      expect(domainCardToEntity(card).meta).toEqual([{ label: 'Recall', value: '0' }]);
    });

    it('omits meta when the card has no recall cost', () => {
      const card: DomainCardSummary = { id: 3, name: 'Rock Barrage', features: [], level: 3 };
      expect(domainCardToEntity(card).meta).toBeUndefined();
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
    it('emits no eyebrow for a primary-slot weapon', () => {
      expect(weaponToEntity(buildWeapon({ isPrimary: true }), null).eyebrow).toBeUndefined();
    });

    it('emits no eyebrow for a secondary-slot weapon', () => {
      expect(weaponToEntity(buildWeapon({ isPrimary: false }), null).eyebrow).toBeUndefined();
    });

    it('orders stats as damage, trait, range, then humanised burden, each labelled', () => {
      const weapon = buildWeapon({ damage: '2d8+1', range: 'Very Far', trait: 'Instinct', burden: 'ONE_HANDED' });

      expect(weaponToEntity(weapon, null).stats).toEqual([
        { label: 'Damage', value: '2d8+1' },
        { label: 'Trait', value: 'Instinct' },
        { label: 'Range', value: 'Very Far' },
        { label: 'Burden', value: 'One-Handed' },
      ]);
    });

    it('humanises a TWO_HANDED burden into the printed "Two-Handed"', () => {
      const weapon = buildWeapon({ burden: 'TWO_HANDED' });

      expect(weaponToEntity(weapon, null).stats).toContainEqual({ label: 'Burden', value: 'Two-Handed' });
    });

    it('drops a stat whose value is blank rather than emitting an empty cell', () => {
      const weapon = buildWeapon({ trait: '', range: '' });

      expect(weaponToEntity(weapon, null).stats).toEqual([
        { label: 'Damage', value: '1d4' },
        { label: 'Burden', value: 'One-Handed' },
      ]);
    });

    it('bakes no colon into a stat value, since the card draws the label itself', () => {
      const stats = weaponToEntity(buildWeapon(), null).stats ?? [];

      expect(stats.every(stat => !stat.value.includes(':'))).toBe(true);
    });

    it('no longer emits meta', () => {
      expect(weaponToEntity(buildWeapon(), null).meta).toBeUndefined();
    });

    it('adds an Equipped/Primary badge only when a slot is passed', () => {
      const weapon = buildWeapon();

      expect(weaponToEntity(weapon, 'primary').badges).toContainEqual({ label: 'Equipped', value: 'Primary' });
      expect(weaponToEntity(weapon, null).badges ?? []).not.toContainEqual(
        expect.objectContaining({ label: 'Equipped' }),
      );
    });

    it('leads the badges with the tier scalar, ahead of equipped state and provenance', () => {
      const weapon = buildWeapon({ tier: 2, createdByUserId: 7 });

      expect(weaponToEntity(weapon, 'primary').badges).toEqual([
        { label: 'Tier', value: '2' },
        { label: 'Equipped', value: 'Primary' },
        CUSTOM_ITEM_BADGE,
      ]);
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
    it('builds three labelled stats: Score, Major and Severe', () => {
      const armor = buildArmor({ baseScore: 5, baseMajorThreshold: 3, baseSevereThreshold: 6 });

      expect(armorToEntity(armor, false).stats).toEqual([
        { label: 'Score', value: '5' },
        { label: 'Major', value: '3' },
        { label: 'Severe', value: '6' },
      ]);
    });

    it('bakes no colon into a stat value, since the card draws the label itself', () => {
      const stats = armorToEntity(buildArmor(), false).stats ?? [];

      expect(stats.every(stat => !stat.value.includes(':'))).toBe(true);
    });

    it('leads the badges with the tier scalar, ahead of equipped state', () => {
      const armor = buildArmor({ tier: 3 });

      expect(armorToEntity(armor, true).badges).toEqual([{ label: 'Tier', value: '3' }, { label: 'Equipped' }]);
    });

    it('no longer emits meta', () => {
      expect(armorToEntity(buildArmor(), false).meta).toBeUndefined();
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
    it('names a consumable in the subtitle', () => {
      expect(lootToEntity(buildLoot({ isConsumable: true })).subtitle).toBe('Consumable');
    });

    it('leaves the type tab to say "Loot" even for a consumable', () => {
      expect(lootToEntity(buildLoot({ isConsumable: true })).eyebrow).toBeUndefined();
    });

    it('omits the subtitle for non-consumable loot', () => {
      expect(lootToEntity(buildLoot({ isConsumable: false })).subtitle).toBeUndefined();
    });

    it('emits its cost tags as unlabelled stats, since a tag names its own unit', () => {
      const loot = buildLoot({ costTags: ['1 HANDFUL', 'Common'] });

      expect(lootToEntity(loot).stats).toEqual([{ value: '1 HANDFUL' }, { value: 'Common' }]);
    });

    it('omits stats when there are no cost tags', () => {
      expect(lootToEntity(buildLoot({ costTags: [] })).stats).toBeUndefined();
    });
  });

  describe('restricted content (SRD vs. paid-expansion content gating)', () => {
    const restrictedCard: CardSummary = {
      id: 9,
      name: RESTRICTED_CARD_TITLE,
      description: 'This card is from Hope & Fear, which you don’t have access to.',
      features: [],
      restricted: true,
      expansionName: 'Hope & Fear',
    };

    it('draws class/ancestry/community cards as a locked 2-field card, no name/description/badges/features', () => {
      for (const toEntity of [classCardToEntity, ancestryCardToEntity, communityCardToEntity]) {
        const entity = toEntity(restrictedCard);
        // `EntityCard` draws its own locked face off `restricted`/`expansionName` -- no
        // name/description is fabricated here for it to read instead.
        expect(entity.restricted).toBe(true);
        expect(entity.expansionName).toBe('Hope & Fear');
        expect(entity.name).toBeUndefined();
        expect(entity.description).toBeUndefined();
        expect(entity.badges).toBeUndefined();
        expect(entity.features).toBeUndefined();
      }
    });

    it('draws a restricted subclass card without its subclass-only meta', () => {
      const card: SubclassCardSummary = { ...restrictedCard, associatedClassName: 'Druid', level: 'FOUNDATION' };

      const entity = subclassCardToEntity(card);

      expect(entity.cardType).toBe('subclass');
      expect(entity.subtitle).toBeUndefined();
      expect(entity.meta).toBeUndefined();
    });

    it('draws a restricted domain card without its domain-only meta', () => {
      const card: DomainCardSummary = { ...restrictedCard, domainName: 'Valor', level: 3, recallCost: 1 };

      const entity = domainCardToEntity(card);

      expect(entity.cardType).toBe('domainCard');
      expect(entity.subtitle).toBeUndefined();
      expect(entity.badges).toBeUndefined();
      expect(entity.meta).toBeUndefined();
    });

    it('draws a restricted weapon as a locked card, ignoring its (safe-default) stats', () => {
      const weapon = buildWeapon({ restricted: true, expansionName: 'Hope & Fear', name: RESTRICTED_CARD_TITLE });

      const entity = weaponToEntity(weapon, 'primary');

      expect(entity.restricted).toBe(true);
      expect(entity.expansionName).toBe('Hope & Fear');
      expect(entity.name).toBeUndefined();
      expect(entity.badges).toBeUndefined();
      expect(entity.stats).toBeUndefined();
      expect(entity.features).toBeUndefined();
    });

    it('draws a restricted armor as a locked card', () => {
      const armor = buildArmor({ restricted: true, expansionName: undefined, name: RESTRICTED_CARD_TITLE });

      const entity = armorToEntity(armor, true);

      expect(entity.restricted).toBe(true);
      expect(entity.expansionName).toBeUndefined();
      expect(entity.name).toBeUndefined();
      expect(entity.stats).toBeUndefined();
    });

    it('draws restricted loot as a locked card', () => {
      const loot = buildLoot({ restricted: true, expansionName: 'Hope & Fear', name: RESTRICTED_CARD_TITLE });

      const entity = lootToEntity(loot);

      expect(entity.restricted).toBe(true);
      expect(entity.expansionName).toBe('Hope & Fear');
      expect(entity.name).toBeUndefined();
      expect(entity.stats).toBeUndefined();
      expect(entity.subtitle).toBeUndefined();
    });
  });
});
