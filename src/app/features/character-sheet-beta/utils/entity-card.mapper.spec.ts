import { describe, it, expect } from 'vitest';
import {
  ancestryCardToEntity,
  classCardToEntity,
  communityCardToEntity,
  domainCardToEntity,
  subclassCardToEntity,
} from './entity-card.mapper';
import { CardSummary, DomainCardSummary, FeatureDisplay, SubclassCardSummary } from '../../character-sheet/models/character-sheet-view.model';

function buildFeature(overrides: Partial<FeatureDisplay> = {}): FeatureDisplay {
  return { name: 'Shadowblighted', description: 'A dark gift.', tags: [], modifiers: [], ...overrides };
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
});
