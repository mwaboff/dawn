import { describe, it, expect } from 'vitest';
import { mapLootToCardData } from './loot.mapper';
import { LootApiResponse } from '../models/loot-api.model';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../components/daggerheart-card/daggerheart-card.model';

function buildLootResponse(overrides: Partial<LootApiResponse> = {}): LootApiResponse {
  return {
    id: 1,
    name: 'Health Potion',
    ...overrides,
  };
}

describe('mapLootToCardData', () => {
  it('should map id and name correctly', () => {
    const response = buildLootResponse({ id: 10, name: 'Magic Ring' });
    const result = mapLootToCardData(response);

    expect(result.id).toBe(10);
    expect(result.name).toBe('Magic Ring');
  });

  it('should set description from response', () => {
    const response = buildLootResponse({ description: 'Restores health' });
    const result = mapLootToCardData(response);

    expect(result.description).toBe('Restores health');
  });

  it('should default description to empty string when undefined', () => {
    const response = buildLootResponse({ description: undefined });
    const result = mapLootToCardData(response);

    expect(result.description).toBe('');
  });

  it('should include tier in tags when present', () => {
    const response = buildLootResponse({ tier: 2 });
    const result = mapLootToCardData(response);

    expect(result.tags).toContain('Tier 2');
  });

  it('should include Consumable tag when isConsumable is true', () => {
    const response = buildLootResponse({ isConsumable: true });
    const result = mapLootToCardData(response);

    expect(result.tags).toContain('Consumable');
  });

  it('should not include Consumable tag when isConsumable is false', () => {
    const response = buildLootResponse({ isConsumable: false });
    const result = mapLootToCardData(response);

    expect(result.tags ?? []).not.toContain('Consumable');
  });

  it('should include costTags in tags', () => {
    const response = buildLootResponse({ costTags: ['ACTION', 'RARE'] });
    const result = mapLootToCardData(response);

    expect(result.tags).toContain('ACTION');
    expect(result.tags).toContain('RARE');
  });

  it('should have undefined tags when no tier, isConsumable, or costTags', () => {
    const response = buildLootResponse({ tier: undefined, isConsumable: undefined, costTags: undefined });
    const result = mapLootToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should map features when present', () => {
    const response = buildLootResponse({
      features: [{ name: 'Healing', description: 'Restore 2d6 HP' }],
    });
    const result = mapLootToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Healing');
    expect(result.features![0].description).toBe('Restore 2d6 HP');
  });

  it('should have undefined features when empty features array', () => {
    const response = buildLootResponse({ features: [] });
    const result = mapLootToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should store tier in metadata', () => {
    const response = buildLootResponse({ tier: 3 });
    const result = mapLootToCardData(response);

    expect(result.metadata!['tier']).toBe(3);
  });

  it('should store isConsumable in metadata', () => {
    const response = buildLootResponse({ isConsumable: true });
    const result = mapLootToCardData(response);

    expect(result.metadata!['isConsumable']).toBe(true);
  });

  describe('entityDisplay', () => {
    it('should carry tier as the scalar, Consumable as the subtitle and cost tags as unlabelled stats', () => {
      const response = buildLootResponse({ tier: 2, isConsumable: true, costTags: ['1 HANDFUL'] });
      const result = mapLootToCardData(response);

      expect(result.entityDisplay).toEqual({
        subtitle: 'Consumable',
        scalar: { label: 'Tier', value: '2' },
        stats: [{ value: '1 HANDFUL' }],
      });
    });

    it('should leave the beta subtitle unset for loot that is not consumable', () => {
      const result = mapLootToCardData(buildLootResponse({ isConsumable: false }));

      expect(result.entityDisplay!.subtitle).toBeUndefined();
    });

    it('should leave the scalar and stats unset when there is no tier or cost tag', () => {
      const result = mapLootToCardData(buildLootResponse());

      expect(result.entityDisplay!.scalar).toBeUndefined();
      expect(result.entityDisplay!.stats).toBeUndefined();
    });

    it('should leave the classic tags untouched', () => {
      const response = buildLootResponse({
        tier: 2,
        isConsumable: true,
        costTags: ['1 HANDFUL'],
        isOfficial: false,
      });
      const result = mapLootToCardData(response);

      expect(result.tags).toEqual(['Tier 2', 'Consumable', '1 HANDFUL', 'Custom']);
    });
  });

  describe('restricted', () => {
    it('short-circuits to a locked CardData without reading any other field', () => {
      const response = buildLootResponse({ id: 99, restricted: true, expansionName: 'Hope & Fear' });
      const result = mapLootToCardData(response);

      expect(result).toEqual({
        id: 99,
        cardType: 'loot',
        name: RESTRICTED_CARD_TITLE,
        description: restrictedCardMessage('Hope & Fear'),
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('degrades the message gracefully when expansionName is absent', () => {
      const response = buildLootResponse({ id: 99, restricted: true, expansionName: undefined });
      const result = mapLootToCardData(response);

      expect(result.description).not.toContain('undefined');
    });
  });
});
