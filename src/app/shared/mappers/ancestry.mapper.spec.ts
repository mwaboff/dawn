import { describe, it, expect } from 'vitest';
import { mapAncestryResponseToCardData } from './ancestry.mapper';
import { AncestryCardResponse } from '../models/ancestry-api.model';

function buildAncestryCardResponse(overrides: Partial<AncestryCardResponse> = {}): AncestryCardResponse {
  return {
    id: 1,
    name: 'Clank',
    description: 'Clanks are sentient mechanical beings',
    cardType: 'ANCESTRY',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapAncestryResponseToCardData', () => {
  it('should map card name and id correctly', () => {
    const response = buildAncestryCardResponse({ id: 42, name: 'Firbolg' });
    const result = mapAncestryResponseToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Firbolg');
  });

  it('should map description', () => {
    const response = buildAncestryCardResponse({ description: 'A gentle giant of the forest' });
    const result = mapAncestryResponseToCardData(response);

    expect(result.description).toBe('A gentle giant of the forest');
  });

  it('should map cardType to ancestry', () => {
    const response = buildAncestryCardResponse();
    const result = mapAncestryResponseToCardData(response);

    expect(result.cardType).toBe('ancestry');
  });

  it('should map features with correct Ancestry Feature subtitle', () => {
    const response = buildAncestryCardResponse({
      features: [
        {
          id: 1,
          name: 'Purposeful Design',
          description: 'Decide who made you and for what purpose',
          featureType: 'ANCESTRY',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        },
      ],
    });
    const result = mapAncestryResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Purposeful Design');
    expect(result.features![0].description).toBe('Decide who made you and for what purpose');
    expect(result.features![0].subtitle).toBe('Ancestry Feature');
  });

  it('should map feature costTag labels to uppercase', () => {
    const response = buildAncestryCardResponse({
      features: [
        {
          id: 2,
          name: 'Efficient',
          description: 'When you take a short rest',
          featureType: 'ANCESTRY',
          expansionId: 1,
          costTagIds: [1, 2],
          costTags: [
            { id: 1, label: 'Short Rest', category: 'TIMING' },
            { id: 2, label: 'action', category: 'cost' },
          ],
        },
      ],
    });
    const result = mapAncestryResponseToCardData(response);

    expect(result.features![0].tags).toEqual(['SHORT REST', 'ACTION']);
  });

  it('should handle features with no costTags', () => {
    const response = buildAncestryCardResponse({
      features: [
        {
          id: 3,
          name: 'Passive Ability',
          description: 'Always active',
          featureType: 'ANCESTRY',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        },
      ],
    });
    const result = mapAncestryResponseToCardData(response);

    expect(result.features![0].tags).toBeUndefined();
  });

  it('should handle empty features array', () => {
    const response = buildAncestryCardResponse({ features: [] });
    const result = mapAncestryResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should not set tags', () => {
    const response = buildAncestryCardResponse();
    const result = mapAncestryResponseToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should not set subtitle', () => {
    const response = buildAncestryCardResponse();
    const result = mapAncestryResponseToCardData(response);

    expect(result.subtitle).toBeUndefined();
  });

  it('should not set metadata', () => {
    const response = buildAncestryCardResponse();
    const result = mapAncestryResponseToCardData(response);

    expect(result.metadata).toBeUndefined();
  });
});
