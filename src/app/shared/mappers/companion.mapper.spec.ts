import { describe, it, expect } from 'vitest';
import { mapCompanionToCardData } from './companion.mapper';
import { CompanionApiResponse } from '../models/companion-api.model';

function buildCompanionResponse(overrides: Partial<CompanionApiResponse> = {}): CompanionApiResponse {
  return {
    id: 1,
    name: 'Forest Wolf',
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

  it('should include companionType in tags when present', () => {
    const response = buildCompanionResponse({ companionType: 'BEAST' });
    const result = mapCompanionToCardData(response);

    expect(result.tags).toContain('BEAST');
  });

  it('should have undefined tags when no companionType', () => {
    const response = buildCompanionResponse({ companionType: undefined });
    const result = mapCompanionToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should store companionType in metadata', () => {
    const response = buildCompanionResponse({ companionType: 'MAGICAL' });
    const result = mapCompanionToCardData(response);

    expect(result.metadata!['companionType']).toBe('MAGICAL');
  });

  it('should store expansionId in metadata', () => {
    const response = buildCompanionResponse({ expansionId: 3 });
    const result = mapCompanionToCardData(response);

    expect(result.metadata!['expansionId']).toBe(3);
  });

  it('should store isOfficial in metadata', () => {
    const response = buildCompanionResponse({ isOfficial: true });
    const result = mapCompanionToCardData(response);

    expect(result.metadata!['isOfficial']).toBe(true);
  });
});
