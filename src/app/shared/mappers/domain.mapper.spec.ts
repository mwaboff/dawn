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

  it('should set description to empty string', () => {
    const response = buildDomainResponse();
    const result = mapDomainToCardData(response);

    expect(result.description).toBe('');
  });

  it('should not set tags', () => {
    const response = buildDomainResponse();
    const result = mapDomainToCardData(response);

    expect(result.tags).toBeUndefined();
  });

  it('should not set features', () => {
    const response = buildDomainResponse();
    const result = mapDomainToCardData(response);

    expect(result.features).toBeUndefined();
  });
});
