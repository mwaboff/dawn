import { describe, it, expect } from 'vitest';
import { mapDomainCardResponseToCardData, DOMAIN_THEME_COLORS } from './domain-card.mapper';
import { DomainCardResponse } from '../models/domain-card-api.model';

function buildDomainCardResponse(overrides: Partial<DomainCardResponse> = {}): DomainCardResponse {
  return {
    id: 1,
    name: 'Rune Ward',
    description: 'A protective rune',
    cardType: 'DOMAIN',
    expansionId: 1,
    isOfficial: true,
    featureIds: [],
    features: [],
    costTagIds: [],
    costTags: [],
    associatedDomainId: 3,
    associatedDomain: { id: 3, name: 'Codex', description: '', expansionId: 1 },
    level: 1,
    recallCost: 0,
    type: 'SPELL',
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapDomainCardResponseToCardData', () => {
  it('should map id and name', () => {
    const response = buildDomainCardResponse({ id: 42, name: 'Void Blast' });
    const result = mapDomainCardResponseToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Void Blast');
  });

  it('should set cardType to domainCard', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse());

    expect(result.cardType).toBe('domainCard');
  });

  it('should set subtitle to domain name', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse());

    expect(result.subtitle).toBe('Codex');
  });

  it('should set subtitle to undefined when associatedDomain is absent', () => {
    const response = buildDomainCardResponse({ associatedDomain: undefined });
    const result = mapDomainCardResponseToCardData(response);

    expect(result.subtitle).toBeUndefined();
  });

  it('should include level and card type in tags', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ type: 'SPELL', level: 2 }));

    expect(result.tags).toContain('Level 2');
    expect(result.tags).toContain('Spell');
  });

  it('should include recall cost tag when recallCost > 0', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ recallCost: 2 }));

    expect(result.tags).toContain('Recall: 2');
  });

  it('should not include recall cost tag when recallCost is 0', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ recallCost: 0 }));

    expect(result.tags?.some(t => t.startsWith('Recall:'))).toBe(false);
  });

  it('should format multi-word type in title case', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ type: 'WILD' }));

    expect(result.tags).toContain('Wild');
  });

  it('should map features with subtitle matching card type', () => {
    const response = buildDomainCardResponse({
      type: 'GRIMOIRE',
      features: [
        {
          id: 1,
          name: 'Ward',
          description: 'Block damage',
          featureType: 'DOMAIN',
          expansionId: 1,
          costTagIds: [],
          costTags: [],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapDomainCardResponseToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0].name).toBe('Ward');
    expect(result.features![0].description).toBe('Block damage');
    expect(result.features![0].subtitle).toBe('Grimoire Feature');
  });

  it('should map feature cost tags to uppercase', () => {
    const response = buildDomainCardResponse({
      features: [
        {
          id: 1,
          name: 'Strike',
          description: 'Attack',
          featureType: 'DOMAIN',
          expansionId: 1,
          costTagIds: [1],
          costTags: [{ id: 1, label: 'action', category: 'cost' }],
          modifierIds: [],
          modifiers: [],
        },
      ],
    });
    const result = mapDomainCardResponseToCardData(response);

    expect(result.features![0].tags).toEqual(['ACTION']);
  });

  it('should set features to undefined when no features', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ features: [] }));

    expect(result.features).toBeUndefined();
  });

  it('should return empty description when no explicit description exists', () => {
    const response = buildDomainCardResponse({ description: '', type: 'ABILITY' });
    const result = mapDomainCardResponseToCardData(response);

    expect(result.description).toBe('');
  });

  it('should use provided description when available', () => {
    const response = buildDomainCardResponse({ description: 'A powerful spell' });
    const result = mapDomainCardResponseToCardData(response);

    expect(result.description).toBe('A powerful spell');
  });

  it('should store domainName in metadata', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse());

    expect(result.metadata!['domainName']).toBe('Codex');
  });

  it('should store domainId in metadata', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ associatedDomainId: 7 }));

    expect(result.metadata!['domainId']).toBe(7);
  });

  it('should store type in metadata', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ type: 'ABILITY' }));

    expect(result.metadata!['type']).toBe('ABILITY');
  });

  it('should store level in metadata', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ level: 1 }));

    expect(result.metadata!['level']).toBe(1);
  });

  it('should store recallCost in metadata', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ recallCost: 3 }));

    expect(result.metadata!['recallCost']).toBe(3);
  });

  it('should store accentColor in metadata for known domain', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse());

    expect(result.metadata!['accentColor']).toBe(DOMAIN_THEME_COLORS['Codex']);
  });

  it('should store undefined accentColor for unknown domain', () => {
    const response = buildDomainCardResponse({
      associatedDomain: { id: 99, name: 'Unknown', description: '', expansionId: 1 },
    });
    const result = mapDomainCardResponseToCardData(response);

    expect(result.metadata!['accentColor']).toBeUndefined();
  });

  it('should store empty modifiers array when no features', () => {
    const result = mapDomainCardResponseToCardData(buildDomainCardResponse({ features: [] }));

    expect(result.metadata!['modifiers']).toEqual([]);
  });
});
