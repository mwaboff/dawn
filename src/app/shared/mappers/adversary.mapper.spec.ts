import { describe, it, expect } from 'vitest';
import { mapAdversaryToAdversaryData } from './adversary.mapper';
import { AdversaryApiResponse } from '../models/adversary-api.model';

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
    const response = buildAdversaryResponse({
      weaponName: 'Short Sword',
      attackRange: 'Melee',
      damage: { notation: '1d8', damageType: 'PHYSICAL' },
    });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.weaponName).toBe('Short Sword');
    expect(result.attackRange).toBe('Melee');
    expect(result.damage).toEqual({ notation: '1d8', damageType: 'PHYSICAL' });
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
    const response = buildAdversaryResponse({ experiences: ['Ambush', 'Patrol'] });
    const result = mapAdversaryToAdversaryData(response);

    expect(result).not.toHaveProperty('experiences');
  });

  it('should map motivesAndTactics when present', () => {
    const response = buildAdversaryResponse({ motivesAndTactics: 'Capture and report' });
    const result = mapAdversaryToAdversaryData(response);

    expect(result.motivesAndTactics).toBe('Capture and report');
  });
});
