import { describe, it, expect } from 'vitest';
import { mapSubclassResponseToCardData } from './subclass.mapper';
import { SubclassCardResponse } from '../models/subclass-api.model';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../components/daggerheart-card/daggerheart-card.model';

function buildSubclassCardResponse(overrides: Partial<SubclassCardResponse> = {}): SubclassCardResponse {
  return {
    id: 1,
    name: 'Path of the Blade',
    description: 'A deadly swordmaster',
    cardType: 'SUBCLASS',
    expansionId: 1,
    expansionName: 'Daggerheart Core Set',
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    subclassPathId: 10,
    domainNames: ['Codex', 'Grace'],
    level: 'FOUNDATION',
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapSubclassResponseToCardData', () => {
  it('should map card name and id correctly', () => {
    const response = buildSubclassCardResponse({ id: 42, name: 'Shadow Step' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Shadow Step');
  });

  it('should always set description to empty string', () => {
    const response = buildSubclassCardResponse({ description: 'A stealthy approach' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.description).toBe('');
  });

  it('should map cardType to subclass', () => {
    const response = buildSubclassCardResponse();
    const result = mapSubclassResponseToCardData(response);

    expect(result.cardType).toBe('subclass');
  });

  it('should map features with correct Subclass Feature subtitle', () => {
    const response = buildSubclassCardResponse({
      features: [
        {
          id: 1,
          name: 'Blade Dance',
          description: 'Strike with grace',
          featureType: 'SUBCLASS',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        },
      ],
    });
    const result = mapSubclassResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Blade Dance');
    expect(result.features![0].description).toBe('Strike with grace');
    expect(result.features![0].subtitle).toBe('Subclass Feature');
  });

  it('should map feature costTag labels to uppercase', () => {
    const response = buildSubclassCardResponse({
      features: [
        {
          id: 2,
          name: 'Power Strike',
          description: 'A powerful blow',
          featureType: 'SUBCLASS',
          expansionId: 1,
          costTagIds: [1, 2],
          costTags: [
            { id: 1, label: 'action', category: 'cost' },
            { id: 2, label: 'stress', category: 'cost' },
          ],
        },
      ],
    });
    const result = mapSubclassResponseToCardData(response);

    expect(result.features![0].tags).toEqual(['ACTION', 'STRESS']);
  });

  it('should handle features with no costTags', () => {
    const response = buildSubclassCardResponse({
      features: [
        {
          id: 3,
          name: 'Passive Ability',
          description: 'Always active',
          featureType: 'SUBCLASS',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        },
      ],
    });
    const result = mapSubclassResponseToCardData(response);

    expect(result.features![0].tags).toBeUndefined();
  });

  it('should store subclassPathId in metadata', () => {
    const response = buildSubclassCardResponse({ subclassPathId: 25 });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['subclassPathId']).toBe(25);
  });

  it('should store level in metadata', () => {
    const response = buildSubclassCardResponse({ level: 'MASTERY' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['level']).toBe('MASTERY');
  });

  it('should store domainNames in metadata', () => {
    const response = buildSubclassCardResponse({ domainNames: ['Arcana', 'Sage'] });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['domainNames']).toEqual(['Arcana', 'Sage']);
  });

  it('should store empty array in metadata when domainNames is undefined', () => {
    const response = buildSubclassCardResponse({ domainNames: undefined });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['domainNames']).toEqual([]);
  });

  it('should store subclassPathName in metadata', () => {
    const response = buildSubclassCardResponse({ subclassPathName: 'Way of Shadow' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['subclassPathName']).toBe('Way of Shadow');
  });

  it('should store associatedClassId in metadata', () => {
    const response = buildSubclassCardResponse({ associatedClassId: 7 });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['associatedClassId']).toBe(7);
  });

  it('should store associatedClassName in metadata', () => {
    const response = buildSubclassCardResponse({ associatedClassName: 'Warrior' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['associatedClassName']).toBe('Warrior');
  });

  it('should handle card with no features', () => {
    const response = buildSubclassCardResponse({ features: [] });
    const result = mapSubclassResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should map associatedClassName to subtitle', () => {
    const response = buildSubclassCardResponse({ associatedClassName: 'Bard' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitle).toBe('Bard');
  });

  it('should not set subtitle when associatedClassName is undefined', () => {
    const response = buildSubclassCardResponse({ associatedClassName: undefined });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitle).toBeUndefined();
  });

  it('should map domainNames to subtitleSecondary joined with separator', () => {
    const response = buildSubclassCardResponse({ domainNames: ['Arcana', 'Sage'] });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitleSecondary).toBe('Arcana · Sage');
  });

  it('should not set subtitleSecondary when domainNames is empty', () => {
    const response = buildSubclassCardResponse({ domainNames: [] });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitleSecondary).toBeUndefined();
  });

  it('should not set subtitleSecondary when domainNames is undefined', () => {
    const response = buildSubclassCardResponse({ domainNames: undefined });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitleSecondary).toBeUndefined();
  });

  it('should not set tags when no spellcastingTrait', () => {
    const response = buildSubclassCardResponse({ expansionName: 'Daggerheart Core Set' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should store spellcastingTrait in metadata when present', () => {
    const spellcastingTrait = { trait: 'Presence', description: 'Cast with charisma', examples: 'Charm, Illusion' };
    const response = buildSubclassCardResponse({ spellcastingTrait });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['spellcastingTrait']).toEqual(spellcastingTrait);
  });

  it('should add spellcasting tag when spellcastingTrait is present', () => {
    const spellcastingTrait = { trait: 'Presence', description: 'Cast with charisma', examples: 'Charm, Illusion' };
    const response = buildSubclassCardResponse({ spellcastingTrait });
    const result = mapSubclassResponseToCardData(response);

    expect(result.tags).toEqual(['Spellcasting: Presence']);
  });

  it('should not store spellcastingTrait in metadata when null', () => {
    const response = buildSubclassCardResponse({ spellcastingTrait: null });
    const result = mapSubclassResponseToCardData(response);

    expect(result.metadata!['spellcastingTrait']).toBeUndefined();
  });

  it('should not add spellcasting tag when spellcastingTrait is null', () => {
    const response = buildSubclassCardResponse({ spellcastingTrait: null });
    const result = mapSubclassResponseToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should not add spellcasting tag when spellcastingTrait is undefined', () => {
    const response = buildSubclassCardResponse({ spellcastingTrait: undefined });
    const result = mapSubclassResponseToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  describe('entityDisplay', () => {
    it('should name the spellcasting trait and the domain list as meta rows', () => {
      const spellcastingTrait = { trait: 'Presence', description: 'Cast with charisma', examples: 'Charm' };
      const response = buildSubclassCardResponse({ spellcastingTrait, domainNames: ['Arcana', 'Sage'] });
      const result = mapSubclassResponseToCardData(response);

      expect(result.entityDisplay).toEqual({
        meta: [
          { label: 'Spellcasting', value: 'Presence' },
          { label: 'Domains', value: 'Arcana, Sage' },
        ],
      });
    });

    it('should list only the domains when the subclass does not cast', () => {
      const response = buildSubclassCardResponse({ spellcastingTrait: null, domainNames: ['Blade'] });
      const result = mapSubclassResponseToCardData(response);

      expect(result.entityDisplay!.meta).toEqual([{ label: 'Domains', value: 'Blade' }]);
    });

    it('should stay unset when there is neither a spellcasting trait nor a domain', () => {
      const response = buildSubclassCardResponse({ spellcastingTrait: null, domainNames: [] });
      const result = mapSubclassResponseToCardData(response);

      expect(result.entityDisplay).toBeUndefined();
    });

    it('should leave the classic subtitle, subtitleSecondary and tags untouched', () => {
      const spellcastingTrait = { trait: 'Presence', description: 'Cast with charisma', examples: 'Charm' };
      const response = buildSubclassCardResponse({
        spellcastingTrait,
        associatedClassName: 'Bard',
        domainNames: ['Arcana', 'Sage'],
      });
      const result = mapSubclassResponseToCardData(response);

      expect(result.subtitle).toBe('Bard');
      expect(result.subtitleSecondary).toBe('Arcana · Sage');
      expect(result.tags).toEqual(['Spellcasting: Presence']);
    });
  });

  describe('restricted', () => {
    it('short-circuits to a locked CardData without reading any other field', () => {
      const response = buildSubclassCardResponse({ id: 99, restricted: true, expansionName: 'Hope & Fear' });
      const result = mapSubclassResponseToCardData(response);

      expect(result).toEqual({
        id: 99,
        cardType: 'subclass',
        name: RESTRICTED_CARD_TITLE,
        description: restrictedCardMessage('Hope & Fear'),
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('degrades the message gracefully when expansionName is absent', () => {
      const response = buildSubclassCardResponse({ id: 99, restricted: true, expansionName: undefined });
      const result = mapSubclassResponseToCardData(response);

      expect(result.description).not.toContain('undefined');
    });
  });
});
