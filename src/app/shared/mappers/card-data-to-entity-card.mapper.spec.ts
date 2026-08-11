import { cardDataToEntityCard } from './card-data-to-entity-card.mapper';
import { CUSTOM_ITEM_BADGE } from './custom-content.util';
import { CardData, CardType } from '../components/daggerheart-card/daggerheart-card.model';
import { CUSTOM_CONTENT_TAG } from './custom-content.util';

function buildCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    name: 'Test Card',
    description: 'A card used for tests.',
    cardType: 'weapon',
    ...overrides,
  };
}

describe('cardDataToEntityCard', () => {
  it('maps id, name and cardType straight through', () => {
    const result = cardDataToEntityCard(buildCard({ id: 42, name: 'Broadsword', cardType: 'weapon' }));

    expect(result.id).toBe(42);
    expect(result.name).toBe('Broadsword');
    expect(result.cardType).toBe('weapon');
  });

  it('maps subtitle straight through', () => {
    const result = cardDataToEntityCard(buildCard({ subtitle: 'Physical Weapon' }));

    expect(result.subtitle).toBe('Physical Weapon');
  });

  it('leaves subtitle undefined when absent', () => {
    const result = cardDataToEntityCard(buildCard({ subtitle: undefined }));

    expect(result.subtitle).toBeUndefined();
  });

  it('maps description straight through', () => {
    const result = cardDataToEntityCard(buildCard({ description: 'Deals heavy damage.' }));

    expect(result.description).toBe('Deals heavy damage.');
  });

  it('maps an empty description to undefined rather than an empty string', () => {
    const result = cardDataToEntityCard(buildCard({ description: '' }));

    expect(result.description).toBeUndefined();
  });

  describe('tags -> badges', () => {
    it('maps each tag to a badge with the tag as its label and no value', () => {
      const result = cardDataToEntityCard(buildCard({ tags: ['TWO-HANDED', 'Physical', '1 HOPE'] }));

      expect(result.badges).toEqual([
        { label: 'TWO-HANDED' },
        { label: 'Physical' },
        { label: '1 HOPE' },
      ]);
    });

    it('leaves badges undefined when there are no tags', () => {
      const result = cardDataToEntityCard(buildCard({ tags: undefined }));

      expect(result.badges).toBeUndefined();
    });

    it('leaves badges undefined for an empty tags array', () => {
      const result = cardDataToEntityCard(buildCard({ tags: [] }));

      expect(result.badges).toBeUndefined();
    });
  });

  describe('subtitleSecondary -> meta', () => {
    it('maps subtitleSecondary to a single bare-label meta row', () => {
      const result = cardDataToEntityCard(buildCard({ subtitleSecondary: 'Tier 3' }));

      expect(result.meta).toEqual([{ label: 'Tier 3' }]);
    });

    it('leaves meta undefined when subtitleSecondary is absent', () => {
      const result = cardDataToEntityCard(buildCard({ subtitleSecondary: undefined }));

      expect(result.meta).toBeUndefined();
    });
  });

  describe('metadata is dropped', () => {
    it('does not surface metadata onto the result', () => {
      const result = cardDataToEntityCard(
        buildCard({ metadata: { tier: 3, modifiers: [{ target: 'evasion', operation: 'ADD', value: 1 }] } }),
      );

      expect(result).not.toHaveProperty('metadata');
    });
  });

  describe('headline, eyebrow and stats are left unset without an entityDisplay', () => {
    it('never sets headline, eyebrow or stats', () => {
      const result = cardDataToEntityCard(buildCard({ tags: ['Physical'], subtitleSecondary: 'Tier 3' }));

      expect(result.headline).toBeUndefined();
      expect(result.eyebrow).toBeUndefined();
      expect(result.stats).toBeUndefined();
    });
  });

  describe('features', () => {
    it('leaves features undefined when there are none', () => {
      const result = cardDataToEntityCard(buildCard({ features: undefined }));

      expect(result.features).toBeUndefined();
    });

    it('leaves features undefined for an empty features array', () => {
      const result = cardDataToEntityCard(buildCard({ features: [] }));

      expect(result.features).toBeUndefined();
    });

    it('maps feature name, description and tags straight through', () => {
      const result = cardDataToEntityCard(
        buildCard({
          features: [{ name: 'Bleeding', description: 'Deals extra damage over time.', tags: ['1 HOPE'] }],
        }),
      );

      expect(result.features).toEqual([
        { name: 'Bleeding', description: 'Deals extra damage over time.', tags: ['1 HOPE'] },
      ]);
    });

    it('maps a blank feature name to undefined rather than an empty string', () => {
      const result = cardDataToEntityCard(
        buildCard({ features: [{ name: '', description: 'No rules name of its own.' }] }),
      );

      expect(result.features?.[0].name).toBeUndefined();
    });

    it('drops feature subtitle -- EntityCardFeature has no equivalent field', () => {
      const result = cardDataToEntityCard(
        buildCard({ features: [{ name: 'Reliable', description: 'Text.', subtitle: 'Weapon Feature' }] }),
      );

      expect(result.features?.[0]).not.toHaveProperty('subtitle');
    });

    it('leaves feature modifiers unset -- CardFeature carries none to map from', () => {
      const result = cardDataToEntityCard(
        buildCard({ features: [{ name: 'Reliable', description: 'Text.' }] }),
      );

      expect(result.features?.[0].modifiers).toBeUndefined();
    });
  });

  describe('entityDisplay', () => {
    it('puts the scalar first, then state, then the Custom chip', () => {
      const result = cardDataToEntityCard(
        buildCard({
          tags: ['1d8+3', CUSTOM_CONTENT_TAG],
          entityDisplay: {
            scalar: { label: 'Tier', value: '2' },
            state: ['Equipped'],
          },
        }),
      );

      expect(result.badges).toEqual([
        { label: 'Tier', value: '2' },
        { label: 'Equipped' },
        CUSTOM_ITEM_BADGE,
      ]);
    });

    it('never turns the tags into badges once a mapper has split them', () => {
      const result = cardDataToEntityCard(
        buildCard({ tags: ['Score: 4', 'Major: 8+'], entityDisplay: { stats: [{ label: 'Score', value: '4' }] } }),
      );

      expect(result.badges).toBeUndefined();
    });

    it('omits the Custom chip when the tags do not carry the custom-content tag', () => {
      const result = cardDataToEntityCard(
        buildCard({ tags: ['1d8+3'], entityDisplay: { scalar: { label: 'Level', value: '3' } } }),
      );

      expect(result.badges).toEqual([{ label: 'Level', value: '3' }]);
    });

    it('maps the stats ledger straight through', () => {
      const result = cardDataToEntityCard(
        buildCard({ entityDisplay: { stats: [{ label: 'Score', value: '4' }, { value: '1 HANDFUL' }] } }),
      );

      expect(result.stats).toEqual([{ label: 'Score', value: '4' }, { value: '1 HANDFUL' }]);
    });

    it('leaves stats undefined for an empty stats array', () => {
      const result = cardDataToEntityCard(buildCard({ entityDisplay: { stats: [] } }));

      expect(result.stats).toBeUndefined();
    });

    it('maps the meta rows straight through', () => {
      const result = cardDataToEntityCard(
        buildCard({
          subtitleSecondary: 'Arcana · Sage',
          entityDisplay: { meta: [{ label: 'Domains', value: 'Arcana, Sage' }] },
        }),
      );

      expect(result.meta).toEqual([{ label: 'Domains', value: 'Arcana, Sage' }]);
    });

    it('drops the subtitleSecondary row once the display carries the scalar it duplicated', () => {
      const result = cardDataToEntityCard(
        buildCard({ subtitleSecondary: 'Tier 3', entityDisplay: { scalar: { label: 'Tier', value: '3' } } }),
      );

      expect(result.meta).toBeUndefined();
    });

    it('keeps the subtitleSecondary row when the display carries nothing that could replace it', () => {
      const result = cardDataToEntityCard(
        buildCard({ subtitleSecondary: 'Tier 3', entityDisplay: { subtitle: 'Consumable' } }),
      );

      expect(result.meta).toEqual([{ label: 'Tier 3' }]);
    });

    it('overrides the subtitle when the display supplies one', () => {
      const result = cardDataToEntityCard(
        buildCard({ subtitle: 'Codex', entityDisplay: { subtitle: 'Codex · Spell' } }),
      );

      expect(result.subtitle).toBe('Codex · Spell');
    });

    it('falls back to the card subtitle when the display omits one', () => {
      const result = cardDataToEntityCard(
        buildCard({ subtitle: 'Physical Weapon', entityDisplay: { scalar: { label: 'Tier', value: '1' } } }),
      );

      expect(result.subtitle).toBe('Physical Weapon');
    });

    it('shows no subtitle at all when the display blanks it', () => {
      const result = cardDataToEntityCard(buildCard({ subtitle: 'Armor', entityDisplay: { subtitle: '' } }));

      expect(result.subtitle).toBeUndefined();
    });
  });

  describe('every CardType maps without throwing and passes cardType through', () => {
    const allCardTypes: CardType[] = [
      'class', 'subclass', 'heritage', 'community', 'ancestry', 'domain', 'domainCard',
      'weapon', 'armor', 'loot', 'companion', 'subclassPath', 'feature', 'environment',
      'beastform', 'transformationCard', 'martialStance',
    ];

    it.each(allCardTypes)('handles cardType %s', (cardType) => {
      const result = cardDataToEntityCard(buildCard({ cardType }));

      expect(result.cardType).toBe(cardType);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Card');
    });
  });
});
