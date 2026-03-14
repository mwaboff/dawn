import { describe, it, expect } from 'vitest';
import { mapCompanionToCardData } from './companion.mapper';
import { CompanionApiResponse } from '../models/companion-api.model';

function buildCompanionResponse(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 1,
    characterSheetId: 1,
    name: 'Forest Wolf',
    evasion: 10,
    attackName: 'Bite',
    attackRange: 'MELEE',
    damageDice: '1d6',
    stressMax: 3,
    stressMarked: 0,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapCompanionToCardData', () => {
  it('should map id and name correctly', () => {
    const response = buildCompanionResponse({ id: 7, name: 'Shadow Cat' });
    const result = mapCompanionToCardData(response);

    expect(result.id).toBe(7);
    expect(result.name).toBe('Shadow Cat');
  });

  it('should set description from response', () => {
    const response = buildCompanionResponse({ description: 'A loyal wolf companion' });
    const result = mapCompanionToCardData(response);

    expect(result.description).toBe('A loyal wolf companion');
  });

  it('should default description to empty string when undefined', () => {
    const response = buildCompanionResponse({ description: undefined });
    const result = mapCompanionToCardData(response);

    expect(result.description).toBe('');
  });

  it('should include formatted attackRange in tags', () => {
    const response = buildCompanionResponse({ attackRange: 'VERY_CLOSE' });
    const result = mapCompanionToCardData(response);

    expect(result.tags).toContain('Very Close');
  });

  it('should include damageDice in tags', () => {
    const response = buildCompanionResponse({ damageDice: '2d8' });
    const result = mapCompanionToCardData(response);

    expect(result.tags).toContain('2d8');
  });

  it('should include attack feature with name and description', () => {
    const response = buildCompanionResponse({ attackName: 'Claw', attackRange: 'MELEE', damageDice: '1d6' });
    const result = mapCompanionToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Claw');
    expect(result.features![0].description).toBe('Range: Melee · Damage: 1d6');
  });

  it('should store evasion in metadata', () => {
    const response = buildCompanionResponse({ evasion: 12 });
    const result = mapCompanionToCardData(response);

    expect(result.metadata!['evasion']).toBe(12);
  });

  it('should store stressMax in metadata', () => {
    const response = buildCompanionResponse({ stressMax: 5 });
    const result = mapCompanionToCardData(response);

    expect(result.metadata!['stressMax']).toBe(5);
  });

  it('should store attackName in metadata', () => {
    const response = buildCompanionResponse({ attackName: 'Bite' });
    const result = mapCompanionToCardData(response);

    expect(result.metadata!['attackName']).toBe('Bite');
  });
});
