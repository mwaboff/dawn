import { describe, it, expect } from 'vitest';
import { mapArmorResponseToCardData } from './armor.mapper';
import { ArmorResponse } from '../models/armor-api.model';

function buildArmorResponse(overrides: Partial<ArmorResponse> = {}): ArmorResponse {
  return {
    id: 1,
    name: 'Chainmail',
    expansionId: 1,
    tier: 1,
    isOfficial: true,
    baseScore: 5,
    baseMajorThreshold: 7,
    baseSevereThreshold: 13,
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapArmorResponseToCardData', () => {
  it('should map card name and id correctly', () => {
    const response = buildArmorResponse({ id: 42, name: 'Plate Armor' });
    const result = mapArmorResponseToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Plate Armor');
  });

  it('should map cardType to armor', () => {
    const response = buildArmorResponse();
    const result = mapArmorResponseToCardData(response);

    expect(result.cardType).toBe('armor');
  });

  it('should set description to empty string', () => {
    const response = buildArmorResponse();
    const result = mapArmorResponseToCardData(response);

    expect(result.description).toBe('');
  });

  it('should generate tags with score, major threshold, and severe threshold', () => {
    const response = buildArmorResponse({
      baseScore: 3,
      baseMajorThreshold: 8,
      baseSevereThreshold: 15,
    });
    const result = mapArmorResponseToCardData(response);

    expect(result.tags).toEqual(['Score: 3', 'Major: 8+', 'Severe: 15+']);
  });

  it('should map features with correct Armor Feature subtitle', () => {
    const response = buildArmorResponse({
      features: [
        {
          id: 1,
          name: 'Heavy Plating',
          description: 'Reduces incoming damage',
          featureType: 'ARMOR',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapArmorResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Heavy Plating');
    expect(result.features![0].description).toBe('Reduces incoming damage');
    expect(result.features![0].subtitle).toBe('Armor Feature');
  });

  it('should map feature costTag labels to uppercase', () => {
    const response = buildArmorResponse({
      features: [
        {
          id: 2,
          name: 'Shield Wall',
          description: 'Raise your shield',
          featureType: 'ARMOR',
          expansionId: 1,
          costTagIds: [1, 2],
          costTags: [
            { id: 1, label: 'action', category: 'cost' },
            { id: 2, label: '1 / Rest', category: 'TIMING' },
          ],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapArmorResponseToCardData(response);

    expect(result.features![0].tags).toEqual(['ACTION', '1 / REST']);
  });

  it('should handle features with no costTags', () => {
    const response = buildArmorResponse({
      features: [
        {
          id: 3,
          name: 'Passive',
          description: 'Always active',
          featureType: 'ARMOR',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapArmorResponseToCardData(response);

    expect(result.features![0].tags).toBeUndefined();
  });

  it('should handle empty features array', () => {
    const response = buildArmorResponse({ features: [] });
    const result = mapArmorResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should handle undefined features', () => {
    const response = buildArmorResponse({ features: undefined });
    const result = mapArmorResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should store baseScore in metadata', () => {
    const response = buildArmorResponse({ baseScore: 6 });
    const result = mapArmorResponseToCardData(response);

    expect(result.metadata!['baseScore']).toBe(6);
  });

  it('should store baseMajorThreshold in metadata', () => {
    const response = buildArmorResponse({ baseMajorThreshold: 9 });
    const result = mapArmorResponseToCardData(response);

    expect(result.metadata!['baseMajorThreshold']).toBe(9);
  });

  it('should store baseSevereThreshold in metadata', () => {
    const response = buildArmorResponse({ baseSevereThreshold: 16 });
    const result = mapArmorResponseToCardData(response);

    expect(result.metadata!['baseSevereThreshold']).toBe(16);
  });

  it('should store tier in metadata', () => {
    const response = buildArmorResponse({ tier: 2 });
    const result = mapArmorResponseToCardData(response);

    expect(result.metadata!['tier']).toBe(2);
  });

  it('should store flattened modifiers from all features in metadata', () => {
    const response = buildArmorResponse({
      features: [
        {
          id: 1,
          name: 'Feature 1',
          description: 'Desc',
          featureType: 'ARMOR',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [1],
          modifiers: [{ id: 1, target: 'score', operation: 'ADD', value: 2 }],
        },
        {
          id: 2,
          name: 'Feature 2',
          description: 'Desc',
          featureType: 'ARMOR',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [2],
          modifiers: [{ id: 2, target: 'threshold', operation: 'ADD', value: 1 }],
        },
      ],
    });
    const result = mapArmorResponseToCardData(response);

    expect(result.metadata!['modifiers']).toEqual([
      { id: 1, target: 'score', operation: 'ADD', value: 2 },
      { id: 2, target: 'threshold', operation: 'ADD', value: 1 },
    ]);
  });

  it('should handle features with no modifiers', () => {
    const response = buildArmorResponse({
      features: [
        {
          id: 1,
          name: 'Simple',
          description: 'Desc',
          featureType: 'ARMOR',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapArmorResponseToCardData(response);

    expect(result.metadata!['modifiers']).toEqual([]);
  });

  it('should not set subtitle', () => {
    const response = buildArmorResponse();
    const result = mapArmorResponseToCardData(response);

    expect(result.subtitle).toBeUndefined();
  });
});
