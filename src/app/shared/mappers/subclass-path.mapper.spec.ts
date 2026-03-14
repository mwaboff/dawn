import { describe, it, expect } from 'vitest';
import { mapSubclassPathToCardData } from './subclass-path.mapper';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';

function buildSubclassPathResponse(overrides: Partial<SubclassPathApiResponse> = {}): SubclassPathApiResponse {
  return {
    id: 1,
    name: 'Beastbound',
    associatedClassId: 1,
    expansionId: 1,
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapSubclassPathToCardData', () => {
  it('should map id and name correctly', () => {
    const response = buildSubclassPathResponse({ id: 5, name: 'Nightwalker' });
    const result = mapSubclassPathToCardData(response);

    expect(result.id).toBe(5);
    expect(result.name).toBe('Nightwalker');
  });

  it('should set description from spellcastingTrait description', () => {
    const response = buildSubclassPathResponse({
      spellcastingTrait: { trait: 'KNOWLEDGE', description: 'A path of stealth', examples: 'Some examples' },
    });
    const result = mapSubclassPathToCardData(response);

    expect(result.description).toBe('A path of stealth');
  });

  it('should default description to empty string when no spellcastingTrait', () => {
    const response = buildSubclassPathResponse({ spellcastingTrait: undefined });
    const result = mapSubclassPathToCardData(response);

    expect(result.description).toBe('');
  });

  it('should include spellcastingTrait in tags when present', () => {
    const response = buildSubclassPathResponse({
      spellcastingTrait: { trait: 'KNOWLEDGE', description: 'Desc', examples: 'Examples' },
    });
    const result = mapSubclassPathToCardData(response);

    expect(result.tags).toContain('Spellcasting: KNOWLEDGE');
  });

  it('should include associated domain names in tags', () => {
    const response = buildSubclassPathResponse({
      associatedDomains: [
        { id: 1, name: 'Arcana' },
        { id: 2, name: 'Midnight' },
      ],
    });
    const result = mapSubclassPathToCardData(response);

    expect(result.tags).toContain('Arcana');
    expect(result.tags).toContain('Midnight');
  });

  it('should have undefined tags when no spellcastingTrait and no domains', () => {
    const response = buildSubclassPathResponse({ spellcastingTrait: undefined, associatedDomains: undefined });
    const result = mapSubclassPathToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should store associatedDomains in metadata', () => {
    const domains = [{ id: 1, name: 'Blade' }];
    const response = buildSubclassPathResponse({ associatedDomains: domains });
    const result = mapSubclassPathToCardData(response);

    expect(result.metadata!['associatedDomains']).toEqual(domains);
  });

  it('should store spellcastingTrait in metadata', () => {
    const trait = { trait: 'AGILITY', description: 'Desc', examples: 'Examples' };
    const response = buildSubclassPathResponse({ spellcastingTrait: trait });
    const result = mapSubclassPathToCardData(response);

    expect(result.metadata!['spellcastingTrait']).toEqual(trait);
  });
});
