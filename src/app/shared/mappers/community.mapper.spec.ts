import { describe, it, expect } from 'vitest';
import { mapCommunityResponseToCardData } from './community.mapper';
import { CommunityCardResponse } from '../models/community-api.model';

function buildCommunityCardResponse(overrides: Partial<CommunityCardResponse> = {}): CommunityCardResponse {
  return {
    id: 1,
    name: 'Highborne',
    description: 'Being part of a highborne community means elegance and prestige',
    cardType: 'COMMUNITY',
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

describe('mapCommunityResponseToCardData', () => {
  it('should map card name and id correctly', () => {
    const response = buildCommunityCardResponse({ id: 42, name: 'Orderborne' });
    const result = mapCommunityResponseToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Orderborne');
  });

  it('should map description', () => {
    const response = buildCommunityCardResponse({ description: 'A disciplined collective' });
    const result = mapCommunityResponseToCardData(response);

    expect(result.description).toBe('A disciplined collective');
  });

  it('should map cardType to community', () => {
    const response = buildCommunityCardResponse();
    const result = mapCommunityResponseToCardData(response);

    expect(result.cardType).toBe('community');
  });

  it('should map features with correct Community Feature subtitle', () => {
    const response = buildCommunityCardResponse({
      features: [
        {
          id: 1,
          name: 'Privilege',
          description: 'You have advantage on rolls to consort with nobles',
          featureType: 'COMMUNITY',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        },
      ],
    });
    const result = mapCommunityResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Privilege');
    expect(result.features![0].description).toBe('You have advantage on rolls to consort with nobles');
    expect(result.features![0].subtitle).toBe('Community Feature');
  });

  it('should map feature costTag labels to uppercase', () => {
    const response = buildCommunityCardResponse({
      features: [
        {
          id: 2,
          name: 'Dedicated',
          description: 'Record three sayings or values',
          featureType: 'COMMUNITY',
          expansionId: 1,
          costTagIds: [1, 2],
          costTags: [
            { id: 1, label: '1 / Rest', category: 'TIMING' },
            { id: 2, label: 'action', category: 'cost' },
          ],
        },
      ],
    });
    const result = mapCommunityResponseToCardData(response);

    expect(result.features![0].tags).toEqual(['1 / REST', 'ACTION']);
  });

  it('should handle features with no costTags', () => {
    const response = buildCommunityCardResponse({
      features: [
        {
          id: 3,
          name: 'Passive Ability',
          description: 'Always active',
          featureType: 'COMMUNITY',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
        },
      ],
    });
    const result = mapCommunityResponseToCardData(response);

    expect(result.features![0].tags).toBeUndefined();
  });

  it('should handle empty features array', () => {
    const response = buildCommunityCardResponse({ features: [] });
    const result = mapCommunityResponseToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should not set tags', () => {
    const response = buildCommunityCardResponse();
    const result = mapCommunityResponseToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should not set subtitle', () => {
    const response = buildCommunityCardResponse();
    const result = mapCommunityResponseToCardData(response);

    expect(result.subtitle).toBeUndefined();
  });

  it('should expose raw features in metadata', () => {
    const response = buildCommunityCardResponse();
    const result = mapCommunityResponseToCardData(response);

    expect(result.metadata?.['features']).toEqual(response.features);
  });
});
