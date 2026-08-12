import { describe, it, expect } from 'vitest';
import { mapAdversaryToAdversaryData } from './adversary.mapper';
import { AdversaryApiResponse } from '../models/adversary-api.model';
import { RESTRICTED_CARD_TITLE } from '../components/daggerheart-card/daggerheart-card.model';

function buildAdversaryResponse(overrides: Partial<AdversaryApiResponse> = {}): AdversaryApiResponse {
  return {
    id: 1,
    name: 'Goblin Scout',
    tier: 1,
    adversaryType: 'MINION',
    ...overrides,
  };
}

describe('mapAdversaryToAdversaryData', () => {
  it('should map id and name correctly', () => {
    const response = buildAdversaryResponse({ id: 5, name: 'Dragon' });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.id).toBe(5);
    expect(result.name).toBe('Dragon');
  });

  it('should set description from response', () => {
    const response = buildAdversaryResponse({ description: 'A fearsome foe' });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.description).toBe('A fearsome foe');
  });

  it('should default description to empty string when undefined', () => {
    const response = buildAdversaryResponse({ description: undefined });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.description).toBe('');
  });

  it('should map tier and adversaryType', () => {
    const response = buildAdversaryResponse({ tier: 3, adversaryType: 'SOLO' });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.tier).toBe(3);
    expect(result.adversaryType).toBe('SOLO');
  });

  it('should map combat stats when present', () => {
    const response = buildAdversaryResponse({
      hitPointMax: 20,
      stressMax: 6,
      evasion: 14,
      majorThreshold: 8,
      severeThreshold: 16,
      attackModifier: 3,
    });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.hitPointMax).toBe(20);
    expect(result.stressMax).toBe(6);
    expect(result.evasion).toBe(14);
    expect(result.majorThreshold).toBe(8);
    expect(result.severeThreshold).toBe(16);
    expect(result.attackModifier).toBe(3);
  });

  it('should map weapon info when present', () => {
    // Real shape from GET /api/dh/adversaries?search=Bugboar (Acid Burrower): damage always
    // carries diceCount/diceType/modifier alongside notation/damageType, not just the latter two.
    const response = buildAdversaryResponse({
      weaponName: 'Short Sword',
      attackRange: 'Melee',
      damage: { diceCount: 1, diceType: 'D12', modifier: 2, damageType: 'PHYSICAL', notation: '1d12+2 phy' },
    });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.weaponName).toBe('Short Sword');
    expect(result.attackRange).toBe('Melee');
    expect(result.damage).toEqual({ diceCount: 1, diceType: 'D12', modifier: 2, damageType: 'PHYSICAL', notation: '1d12+2 phy' });
  });

  it('should map weapon info with null diceCount/modifier (flat-die attacks)', () => {
    // Real shape confirmed via GET /api/dh/weapons?search=Katana: flat-die weapons like
    // Broadsword ("d8 phy") send diceCount/modifier as null, not merely absent.
    const response = buildAdversaryResponse({
      damage: { diceCount: null, diceType: 'D8', modifier: null, damageType: 'PHYSICAL', notation: 'd8 phy' },
    });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.damage).toEqual({ diceCount: null, diceType: 'D8', modifier: null, damageType: 'PHYSICAL', notation: 'd8 phy' });
  });

  it('should map features when present', () => {
    const response = buildAdversaryResponse({
      features: [{ name: 'Pack Tactics', description: 'Advantage when allies are adjacent' }],
    });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Pack Tactics');
    expect(result.features![0].description).toBe('Advantage when allies are adjacent');
  });

  it('should have undefined features when empty features array', () => {
    const response = buildAdversaryResponse({ features: [] });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.features).toBeUndefined();
  });

  it('should map experiences when present', () => {
    const response = buildAdversaryResponse({
      experiences: [
        { id: 1, description: 'Thief', modifier: 2 },
        { id: 2, description: 'Ambush', modifier: 1 },
      ],
    });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.experiences).toEqual([
      { description: 'Thief', modifier: 2 },
      { description: 'Ambush', modifier: 1 },
    ]);
  });

  it('should have undefined experiences when empty experiences array', () => {
    const response = buildAdversaryResponse({ experiences: [] });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.experiences).toBeUndefined();
  });

  it('should have undefined experiences when experiences is absent', () => {
    const response = buildAdversaryResponse();
    const result = mapAdversaryToAdversaryData(response);

    expect(result.experiences).toBeUndefined();
  });

  describe('feature timing badge', () => {
    it('should strip a Passive suffix and set it as the subtitle', () => {
      const response = buildAdversaryResponse({
        features: [{ name: 'Relentless (3) - Passive', description: 'Acts again.' }],
      });
      const result = mapAdversaryToAdversaryData(response);

      expect(result.features![0].name).toBe('Relentless (3)');
      expect(result.features![0].subtitle).toBe('Passive');
    });

    it('should strip an Action suffix and set it as the subtitle', () => {
      const response = buildAdversaryResponse({
        features: [{ name: 'Earth Eruption - Action', description: 'Deals damage.' }],
      });
      const result = mapAdversaryToAdversaryData(response);

      expect(result.features![0].name).toBe('Earth Eruption');
      expect(result.features![0].subtitle).toBe('Action');
    });

    it('should strip a Reaction suffix and set it as the subtitle', () => {
      const response = buildAdversaryResponse({
        features: [{ name: 'Team-Up - Reaction', description: 'Assists an ally.' }],
      });
      const result = mapAdversaryToAdversaryData(response);

      expect(result.features![0].name).toBe('Team-Up');
      expect(result.features![0].subtitle).toBe('Reaction');
    });

    it('should leave a name with no recognized suffix unchanged and set no subtitle', () => {
      const response = buildAdversaryResponse({
        features: [{ name: 'Horde', description: 'A group of minions.' }],
      });
      const result = mapAdversaryToAdversaryData(response);

      expect(result.features![0].name).toBe('Horde');
      expect(result.features![0].subtitle).toBeUndefined();
    });
  });

  it('should map motivesAndTactics when present', () => {
    const response = buildAdversaryResponse({ motivesAndTactics: 'Capture and report' });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.motivesAndTactics).toBe('Capture and report');
  });

  describe('restricted', () => {
    it('short-circuits to a locked AdversaryData without reading any other field', () => {
      const response = buildAdversaryResponse({
        id: 99,
        restricted: true,
        expansionName: 'Hope & Fear',
        difficulty: 20,
        motivesAndTactics: 'should be ignored',
      });
      const result = mapAdversaryToAdversaryData(response);

      expect(result).toEqual({
        id: 99,
        name: RESTRICTED_CARD_TITLE,
        restricted: true,
        expansionName: 'Hope & Fear',
      });
      // `tier`/`adversaryType` stay absent rather than a `0`/`''` placeholder that could read as
      // fact -- `AdversaryCard` never displays them once `restricted` is true.
      expect(result.tier).toBeUndefined();
      expect(result.adversaryType).toBeUndefined();
    });

    it('does not throw when the source response carries only id and tier/adversaryType', () => {
      expect(() =>
        mapAdversaryToAdversaryData({ id: 99, tier: 1, adversaryType: 'MINION', restricted: true } as AdversaryApiResponse),
      ).not.toThrow();
    });
  });
});
