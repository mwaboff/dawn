import { describe, it, expect } from 'vitest';
import { mapEnvironmentToCardData } from './environment.mapper';
import { EnvironmentResponse } from '../models/environment-api.model';

function buildEnvironmentResponse(overrides: Partial<EnvironmentResponse> = {}): EnvironmentResponse {
  return {
    id: 1,
    name: 'Sundered Ruins',
    tier: 2,
    environmentType: 'EXPLORATION',
    difficulty: 12,
    isOfficial: true,
    isPublic: false,
    expansionId: 1,
    features: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapEnvironmentToCardData', () => {
  it('should map card id and name correctly', () => {
    const response = buildEnvironmentResponse({ id: 42, name: 'The Hollow Vale' });
    const result = mapEnvironmentToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('The Hollow Vale');
  });

  it('should map cardType to environment', () => {
    const response = buildEnvironmentResponse();
    const result = mapEnvironmentToCardData(response);

    expect(result.cardType).toBe('environment');
  });

  it('should set description from response', () => {
    const response = buildEnvironmentResponse({ description: 'A crumbling stone ruin.' });
    const result = mapEnvironmentToCardData(response);

    expect(result.description).toBe('A crumbling stone ruin.');
  });

  it('should default description to empty string when undefined', () => {
    const response = buildEnvironmentResponse({ description: undefined });
    const result = mapEnvironmentToCardData(response);

    expect(result.description).toBe('');
  });

  it('should title-case the environmentType for the subtitle', () => {
    const response = buildEnvironmentResponse({ environmentType: 'TRAVERSAL' });
    const result = mapEnvironmentToCardData(response);

    expect(result.subtitle).toBe('Traversal');
  });

  it('should set subtitleSecondary to Tier label', () => {
    const response = buildEnvironmentResponse({ tier: 3 });
    const result = mapEnvironmentToCardData(response);

    expect(result.subtitleSecondary).toBe('Tier 3');
  });

  it('should include a numeric Difficulty tag when difficulty is set', () => {
    const response = buildEnvironmentResponse({ difficulty: 15, difficultySpecial: undefined });
    const result = mapEnvironmentToCardData(response);

    expect(result.tags).toContain('Difficulty 15');
  });

  it('should include the verbatim Difficulty text when difficultySpecial is set instead', () => {
    const response = buildEnvironmentResponse({
      difficulty: undefined,
      difficultySpecial: 'Special (see "Relative Strength")',
    });
    const result = mapEnvironmentToCardData(response);

    expect(result.tags).toContain('Difficulty: Special (see "Relative Strength")');
  });

  it('should map features with name and description', () => {
    const response = buildEnvironmentResponse({
      features: [{ id: 1, name: 'Ambush', description: 'Foes strike from hiding.' }],
    });
    const result = mapEnvironmentToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Ambush');
    expect(result.features![0].description).toBe('Foes strike from hiding.');
  });

  it('should default a feature with no description to an empty string', () => {
    const response = buildEnvironmentResponse({
      features: [{ id: 1, name: 'Ambush', description: undefined }],
    });
    const result = mapEnvironmentToCardData(response);

    expect(result.features![0].description).toBe('');
  });

  it('should handle empty features array', () => {
    const response = buildEnvironmentResponse({ features: [] });
    const result = mapEnvironmentToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should handle undefined features', () => {
    const response = buildEnvironmentResponse({ features: undefined });
    const result = mapEnvironmentToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should strip a printed timing suffix from a feature name and set it as the subtitle', () => {
    const response = buildEnvironmentResponse({
      features: [{ id: 1, name: 'Overwhelming Assault - Action', description: 'The siege presses forward.' }],
    });
    const result = mapEnvironmentToCardData(response);

    expect(result.features![0].name).toBe('Overwhelming Assault');
    expect(result.features![0].subtitle).toBe('Action');
  });

  it('should store environmentType, tier, impulses, and potentialAdversaries in metadata', () => {
    const response = buildEnvironmentResponse({
      environmentType: 'SOCIAL',
      tier: 4,
      impulses: 'Gather information, spread rumors',
      potentialAdversaries: 'Any social adversary',
    });
    const result = mapEnvironmentToCardData(response);

    expect(result.metadata!['environmentType']).toBe('SOCIAL');
    expect(result.metadata!['tier']).toBe(4);
    expect(result.metadata!['impulses']).toBe('Gather information, spread rumors');
    expect(result.metadata!['potentialAdversaries']).toBe('Any social adversary');
  });

  it('should store isOfficial in metadata', () => {
    const response = buildEnvironmentResponse({ isOfficial: false });
    const result = mapEnvironmentToCardData(response);

    expect(result.metadata!['isOfficial']).toBe(false);
  });
});
