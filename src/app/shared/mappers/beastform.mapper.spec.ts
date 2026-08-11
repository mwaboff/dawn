import { describe, it, expect } from 'vitest';
import { mapBeastformToCardData } from './beastform.mapper';
import { BeastformResponse } from '../models/beastform-api.model';

function buildBeastformResponse(overrides: Partial<BeastformResponse> = {}): BeastformResponse {
  return {
    id: 1,
    name: 'Agile Scout',
    attackRange: 'MELEE',
    attackTrait: 'AGILITY',
    damage: { diceType: 'D6', damageType: 'PHYSICAL', notation: '1d6 phy' },
    expansionId: 1,
    isOfficial: true,
    isPublic: false,
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * The "Evolved" meta-cards (Legendary Beast, Mythic Beast) print no stat line at all, so the
 * backend returns them with attackTrait/attackRange/damage/evasion and every trait modifier
 * absent. Fixtures that always populated those fields are why a `.split()` on undefined reached
 * a real page. Shaped after the actual uploaded record (id 17).
 */
function buildStatlessBeastformResponse(overrides: Partial<BeastformResponse> = {}): BeastformResponse {
  return {
    id: 17,
    name: 'Legendary Beast',
    example: 'Upgraded Tier 1 Options',
    tier: 3,
    expansionId: 1,
    isOfficial: true,
    isPublic: true,
    features: [{ id: 777, name: 'Evolved', description: 'Pick a Tier 1 Beastform option...' }],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  } as BeastformResponse;
}

describe('mapBeastformToCardData — stat-less "Evolved" cards', () => {
  it('should not throw when attackTrait and attackRange are absent', () => {
    expect(() => mapBeastformToCardData(buildStatlessBeastformResponse())).not.toThrow();
  });

  it('should leave subtitle undefined when attackTrait is absent', () => {
    const result = mapBeastformToCardData(buildStatlessBeastformResponse());

    expect(result.subtitle).toBeUndefined();
  });

  it('should omit the attackRange tag when attackRange is absent, keeping the Tier tag', () => {
    const result = mapBeastformToCardData(buildStatlessBeastformResponse());

    expect(result.tags).toEqual(['Tier 3']);
  });

  it('should still map name, example and features for a stat-less card', () => {
    const result = mapBeastformToCardData(buildStatlessBeastformResponse());

    expect(result.name).toBe('Legendary Beast');
    expect(result.description).toBe('Upgraded Tier 1 Options');
    expect(result.features).toHaveLength(1);
  });

  it('should not throw when damage is absent and tier is undefined', () => {
    const response = buildStatlessBeastformResponse({ tier: undefined });

    expect(() => mapBeastformToCardData(response)).not.toThrow();
    expect(mapBeastformToCardData(response).subtitleSecondary).toBeUndefined();
  });
});

describe('mapBeastformToCardData', () => {
  it('should map card id and name correctly', () => {
    const response = buildBeastformResponse({ id: 42, name: 'Nimble Grazer' });
    const result = mapBeastformToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Nimble Grazer');
  });

  it('should map cardType to beastform', () => {
    const response = buildBeastformResponse();
    const result = mapBeastformToCardData(response);

    expect(result.cardType).toBe('beastform');
  });

  it('should set description from the example field', () => {
    const response = buildBeastformResponse({ example: 'A quick, wiry hound.' });
    const result = mapBeastformToCardData(response);

    expect(result.description).toBe('A quick, wiry hound.');
  });

  it('should default description to empty string when example is undefined', () => {
    const response = buildBeastformResponse({ example: undefined });
    const result = mapBeastformToCardData(response);

    expect(result.description).toBe('');
  });

  it('should title-case the attackTrait for the subtitle', () => {
    const response = buildBeastformResponse({ attackTrait: 'FINESSE' });
    const result = mapBeastformToCardData(response);

    expect(result.subtitle).toBe('Finesse');
  });

  it('should set subtitleSecondary to Tier label when tier is set', () => {
    const response = buildBeastformResponse({ tier: 3 });
    const result = mapBeastformToCardData(response);

    expect(result.subtitleSecondary).toBe('Tier 3');
  });

  it('should fall back to the damage notation for subtitleSecondary when tier is undefined', () => {
    const response = buildBeastformResponse({
      tier: undefined,
      damage: { diceType: 'D8', damageType: 'PHYSICAL', notation: '2d8 phy' },
    });
    const result = mapBeastformToCardData(response);

    expect(result.subtitleSecondary).toBe('2d8 phy');
  });

  it('should title-case the attackRange into tags', () => {
    const response = buildBeastformResponse({ attackRange: 'VERY_CLOSE' });
    const result = mapBeastformToCardData(response);

    expect(result.tags).toContain('Very Close');
  });

  it('should include a Tier tag when tier is set', () => {
    const response = buildBeastformResponse({ tier: 2 });
    const result = mapBeastformToCardData(response);

    expect(result.tags).toContain('Tier 2');
  });

  it('should map features with name and description', () => {
    const response = buildBeastformResponse({
      features: [{ id: 1, name: 'Pounce', description: 'Leap at a foe.' }],
    });
    const result = mapBeastformToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Pounce');
    expect(result.features![0].description).toBe('Leap at a foe.');
  });

  it('should default a feature with no description to an empty string', () => {
    const response = buildBeastformResponse({
      features: [{ id: 1, name: 'Pounce', description: undefined }],
    });
    const result = mapBeastformToCardData(response);

    expect(result.features![0].description).toBe('');
  });

  it('should handle empty features array', () => {
    const response = buildBeastformResponse({ features: [] });
    const result = mapBeastformToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should handle undefined features', () => {
    const response = buildBeastformResponse({ features: undefined });
    const result = mapBeastformToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should store example, advantages, attack info, damage, evasion, tier and isOfficial in metadata', () => {
    const response = buildBeastformResponse({
      example: 'A quick hound.',
      advantages: 'Advantage on Agility rolls.',
      attackTrait: 'AGILITY',
      attackRange: 'MELEE',
      evasion: 12,
      tier: 2,
      isOfficial: false,
    });
    const result = mapBeastformToCardData(response);

    expect(result.metadata!['example']).toBe('A quick hound.');
    expect(result.metadata!['advantages']).toBe('Advantage on Agility rolls.');
    expect(result.metadata!['attackTrait']).toBe('AGILITY');
    expect(result.metadata!['attackRange']).toBe('MELEE');
    expect(result.metadata!['damage']).toEqual(response.damage);
    expect(result.metadata!['evasion']).toBe(12);
    expect(result.metadata!['tier']).toBe(2);
    expect(result.metadata!['isOfficial']).toBe(false);
  });

  it('should copy every trait modifier into metadata', () => {
    const response = buildBeastformResponse({
      agilityModifier: 1,
      strengthModifier: 2,
      finesseModifier: -1,
      instinctModifier: 0,
      presenceModifier: 3,
      knowledgeModifier: 4,
    });
    const result = mapBeastformToCardData(response);

    expect(result.metadata!['agilityModifier']).toBe(1);
    expect(result.metadata!['strengthModifier']).toBe(2);
    expect(result.metadata!['finesseModifier']).toBe(-1);
    expect(result.metadata!['instinctModifier']).toBe(0);
    expect(result.metadata!['presenceModifier']).toBe(3);
    expect(result.metadata!['knowledgeModifier']).toBe(4);
  });

  it('should leave trait modifiers undefined in metadata for a stat-less card', () => {
    const result = mapBeastformToCardData(buildStatlessBeastformResponse());

    expect(result.metadata!['agilityModifier']).toBeUndefined();
    expect(result.metadata!['knowledgeModifier']).toBeUndefined();
    expect(result.metadata!['evasion']).toBeUndefined();
  });

  describe('entityDisplay', () => {
    it('should carry tier as the scalar and damage and range as stats', () => {
      const result = mapBeastformToCardData(buildBeastformResponse({ tier: 2 }));

      expect(result.entityDisplay).toEqual({
        scalar: { label: 'Tier', value: '2' },
        stats: [
          { label: 'Damage', value: '1d6 phy' },
          { label: 'Range', value: 'Melee' },
        ],
      });
    });

    it('should leave the scalar unset when the beastform has no tier', () => {
      const result = mapBeastformToCardData(buildBeastformResponse({ tier: undefined }));

      expect(result.entityDisplay!.scalar).toBeUndefined();
    });

    it('should leave stats unset for a stat-less Evolved card', () => {
      const result = mapBeastformToCardData(buildStatlessBeastformResponse());

      expect(result.entityDisplay!.stats).toBeUndefined();
      expect(result.entityDisplay!.scalar).toEqual({ label: 'Tier', value: '3' });
    });

    it('should leave the classic subtitle, subtitleSecondary and tags untouched', () => {
      const result = mapBeastformToCardData(buildBeastformResponse({ tier: 2 }));

      expect(result.subtitle).toBe('Agility');
      expect(result.subtitleSecondary).toBe('Tier 2');
      expect(result.tags).toEqual(['Tier 2', 'Melee']);
    });
  });
});
