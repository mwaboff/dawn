import { describe, it, expect } from 'vitest';
import { mapSubclassResponseToCardData } from './subclass.mapper';
import { SubclassCardResponse } from '../models/subclass-api.model';

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

  it('should handle card with no features', () => {
    const response = buildSubclassCardResponse({ features: [] });
    const result = mapSubclassResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should map domainNames to subtitle joined with separator', () => {
    const response = buildSubclassCardResponse({ domainNames: ['Arcana', 'Sage'] });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitle).toBe('Arcana · Sage');
  });

  it('should not set subtitle when domainNames is empty', () => {
    const response = buildSubclassCardResponse({ domainNames: [] });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitle).toBeUndefined();
  });

  it('should not set subtitle when domainNames is undefined', () => {
    const response = buildSubclassCardResponse({ domainNames: undefined });
    const result = mapSubclassResponseToCardData(response);

    expect(result.subtitle).toBeUndefined();
  });

  it('should not set tags', () => {
    const response = buildSubclassCardResponse({ expansionName: 'Daggerheart Core Set' });
    const result = mapSubclassResponseToCardData(response);

    expect(result.tags).toBeUndefined();
  });
});
