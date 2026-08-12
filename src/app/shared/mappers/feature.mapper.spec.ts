import { describe, it, expect } from 'vitest';
import { mapFeatureResponseToCardData } from './feature.mapper';
import { FeatureResponse } from '../models/feature-api.model';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../components/daggerheart-card/daggerheart-card.model';

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

  describe('entityDisplay', () => {
    it('should turn the cost tags into stats that carry no label', () => {
      const result = mapFeatureResponseToCardData(buildFeatureResponse({
        costTags: [{ id: 1, label: 'stress', category: 'cost' }, { id: 2, label: '1 hope', category: 'cost' }],
      }));

      expect(result.entityDisplay).toEqual({ stats: [{ value: 'STRESS' }, { value: '1 HOPE' }] });
    });

    it('should stay unset when there are no cost tags', () => {
      const result = mapFeatureResponseToCardData(buildFeatureResponse({ costTags: [] }));

      expect(result.entityDisplay).toBeUndefined();
    });

    it('should leave the classic subtitle and tags untouched', () => {
      const result = mapFeatureResponseToCardData(buildFeatureResponse({
        featureType: 'DOMAIN',
        costTags: [{ id: 1, label: 'stress', category: 'cost' }],
      }));

      expect(result.subtitle).toBe('Domain');
      expect(result.tags).toEqual(['STRESS']);
    });
  });

  it('should distinguish same-named feature variants by description (HF-01 find-or-create key)', () => {
    const tier1 = mapFeatureResponseToCardData(buildFeatureResponse({ id: 10, name: 'Barrier', description: 'Tier 1: Mark 2 Stress.' }));
    const tier2 = mapFeatureResponseToCardData(buildFeatureResponse({ id: 11, name: 'Barrier', description: 'Tier 2: Mark 3 Stress.' }));

    expect(tier1.name).toBe(tier2.name);
    expect(tier1.description).not.toBe(tier2.description);
    expect(tier1.id).not.toBe(tier2.id);
  });

  describe('restricted', () => {
    it('short-circuits to a locked CardData without reading any other field', () => {
      const response = buildFeatureResponse({ id: 99, restricted: true, expansionName: 'Hope & Fear' });
      const result = mapFeatureResponseToCardData(response);

      expect(result).toEqual({
        id: 99,
        cardType: 'feature',
        name: RESTRICTED_CARD_TITLE,
        description: restrictedCardMessage('Hope & Fear'),
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('degrades the message gracefully when expansionName is absent', () => {
      const response = buildFeatureResponse({ id: 99, restricted: true, expansionName: undefined });
      const result = mapFeatureResponseToCardData(response);

      expect(result.description).not.toContain('undefined');
    });
  });
});
