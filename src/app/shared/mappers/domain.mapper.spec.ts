import { describe, it, expect } from 'vitest';
import { mapDomainToCardData, DomainResponse } from './domain.mapper';

function buildDomainResponse(overrides: Partial<DomainResponse> = {}): DomainResponse {
  return {
    id: 1,
    name: 'Arcana',
    ...overrides,
  };
}

describe('mapDomainToCardData', () => {
  it('should map id and name correctly', () => {
    const response = buildDomainResponse({ id: 42, name: 'Blade' });
    const result = mapDomainToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Blade');
  });

  it('should set cardType to domain', () => {
    const response = buildDomainResponse();
    const result = mapDomainToCardData(response);

    expect(result.cardType).toBe('domain');
  });

  it('should set description from response', () => {
    const response = buildDomainResponse({ description: 'Fire magic domain' });
    const result = mapDomainToCardData(response);

    expect(result.description).toBe('Fire magic domain');
  });

  it('should default description to empty string when missing', () => {
    const response = buildDomainResponse();
    const result = mapDomainToCardData(response);

    expect(result.description).toBe('');
  });

  it('should set accent color from domain theme colors', () => {
    const response = buildDomainResponse({ name: 'Arcana' });
    const result = mapDomainToCardData(response);

    expect(result.metadata!['accentColor']).toBe('#7c3aed');
  });
});
