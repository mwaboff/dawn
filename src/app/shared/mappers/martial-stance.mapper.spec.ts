import { describe, it, expect } from 'vitest';
import { mapMartialStanceToCardData } from './martial-stance.mapper';
import { MartialStanceResponse } from '../models/martial-stance-api.model';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../components/daggerheart-card/daggerheart-card.model';

function buildMartialStanceResponse(overrides: Partial<MartialStanceResponse> = {}): MartialStanceResponse {
  return {
    id: 1,
    name: 'Guarded Stance',
    expansionId: 2,
    tier: 1,
    isOfficial: true,
    description: 'While in this stance, gain a +2 bonus to your Evasion.',
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapMartialStanceToCardData', () => {
  it('should map id, name and cardType', () => {
    const result = mapMartialStanceToCardData(buildMartialStanceResponse({ id: 42, name: 'Reckless Stance' }));

    expect(result.id).toBe(42);
    expect(result.name).toBe('Reckless Stance');
    expect(result.cardType).toBe('martialStance');
  });

  it('should use the effect text as the description', () => {
    const result = mapMartialStanceToCardData(buildMartialStanceResponse({ description: 'Gain a +2 bonus.' }));

    expect(result.description).toBe('Gain a +2 bonus.');
  });

  it('should default description to empty string when absent', () => {
    const result = mapMartialStanceToCardData(buildMartialStanceResponse({ description: undefined }));

    expect(result.description).toBe('');
  });

  describe('entityDisplay', () => {
    it('should carry tier as the scalar', () => {
      const result = mapMartialStanceToCardData(buildMartialStanceResponse({ tier: 3 }));

      expect(result.entityDisplay).toEqual({ scalar: { label: 'Tier', value: '3' } });
    });

    it('should stay unset when the stance has no tier', () => {
      const result = mapMartialStanceToCardData(buildMartialStanceResponse({ tier: undefined }));

      expect(result.entityDisplay).toBeUndefined();
    });

    it('should leave the classic subtitleSecondary and tags untouched', () => {
      const result = mapMartialStanceToCardData(buildMartialStanceResponse({ tier: 3 }));

      expect(result.subtitleSecondary).toBe('Tier 3');
      expect(result.tags).toEqual(['Tier 3']);
    });

    it('should leave the classic subtitleSecondary and tags empty for a tier-less stance', () => {
      const result = mapMartialStanceToCardData(buildMartialStanceResponse({ tier: undefined }));

      expect(result.subtitleSecondary).toBeUndefined();
      expect(result.tags).toEqual([]);
    });
  });

  describe('restricted', () => {
    it('short-circuits to a locked CardData without reading any other field', () => {
      const response = buildMartialStanceResponse({ id: 99, restricted: true, expansionName: 'Hope & Fear' });
      const result = mapMartialStanceToCardData(response);

      expect(result).toEqual({
        id: 99,
        cardType: 'martialStance',
        name: RESTRICTED_CARD_TITLE,
        description: restrictedCardMessage('Hope & Fear'),
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('degrades the message gracefully when expansionName is absent', () => {
      const response = buildMartialStanceResponse({ id: 99, restricted: true, expansionName: undefined });
      const result = mapMartialStanceToCardData(response);

      expect(result.description).not.toContain('undefined');
    });
  });
});
