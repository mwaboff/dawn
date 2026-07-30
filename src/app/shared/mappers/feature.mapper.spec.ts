import { describe, it, expect } from 'vitest';
import { mapFeatureResponseToCardData } from './feature.mapper';
import { FeatureResponse } from '../models/feature-api.model';

function buildFeatureResponse(overrides: Partial<FeatureResponse> = {}): FeatureResponse {
  return {
    id: 1,
    name: 'Barrier',
    description: 'A tier 1 barrier feature.',
    featureType: 'OTHER',
    expansionId: 1,
    costTagIds: [],
    modifierIds: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapFeatureResponseToCardData', () => {
  it('should map id and name correctly', () => {
    const result = mapFeatureResponseToCardData(buildFeatureResponse({ id: 42, name: 'Shadowblighted' }));

    expect(result.id).toBe(42);
    expect(result.name).toBe('Shadowblighted');
  });

  it('should map cardType to feature', () => {
    const result = mapFeatureResponseToCardData(buildFeatureResponse());
    expect(result.cardType).toBe('feature');
  });

  it('should map description', () => {
    const result = mapFeatureResponseToCardData(buildFeatureResponse({ description: 'You may add this to any adversary.' }));
    expect(result.description).toBe('You may add this to any adversary.');
  });

  it('should default description to empty string when missing', () => {
    const result = mapFeatureResponseToCardData(buildFeatureResponse({ description: undefined as unknown as string }));
    expect(result.description).toBe('');
  });

  it('should map featureType to a human-readable subtitle', () => {
    const result = mapFeatureResponseToCardData(buildFeatureResponse({ featureType: 'DOMAIN' }));
    expect(result.subtitle).toBe('Domain');
  });

  it('should fall back to the raw featureType string when unrecognized', () => {
    const result = mapFeatureResponseToCardData(
      buildFeatureResponse({ featureType: 'NOT_A_REAL_TYPE' as FeatureResponse['featureType'] }),
    );
    expect(result.subtitle).toBe('NOT_A_REAL_TYPE');
  });

  it('should map cost tags to uppercase tags', () => {
    const result = mapFeatureResponseToCardData(buildFeatureResponse({
      costTags: [{ id: 1, label: 'stress', category: 'cost' }],
    }));
    expect(result.tags).toEqual(['STRESS']);
  });

  it('should leave tags undefined when there are no cost tags', () => {
    const result = mapFeatureResponseToCardData(buildFeatureResponse({ costTags: [] }));
    expect(result.tags).toBeUndefined();
  });

  it('should distinguish same-named feature variants by description (HF-01 find-or-create key)', () => {
    const tier1 = mapFeatureResponseToCardData(buildFeatureResponse({ id: 10, name: 'Barrier', description: 'Tier 1: Mark 2 Stress.' }));
    const tier2 = mapFeatureResponseToCardData(buildFeatureResponse({ id: 11, name: 'Barrier', description: 'Tier 2: Mark 3 Stress.' }));

    expect(tier1.name).toBe(tier2.name);
    expect(tier1.description).not.toBe(tier2.description);
    expect(tier1.id).not.toBe(tier2.id);
  });
});
