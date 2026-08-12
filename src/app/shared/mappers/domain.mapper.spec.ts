import { describe, it, expect } from 'vitest';
import { mapDomainToCardData, DomainResponse } from './domain.mapper';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../components/daggerheart-card/daggerheart-card.model';

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

  describe('restricted', () => {
    it('short-circuits to a locked CardData without reading any other field', () => {
      const response = buildDomainResponse({ id: 99, restricted: true, expansionName: 'Hope & Fear' });
      const result = mapDomainToCardData(response);

      expect(result).toEqual({
        id: 99,
        cardType: 'domain',
        name: RESTRICTED_CARD_TITLE,
        description: restrictedCardMessage('Hope & Fear'),
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('degrades the message gracefully when expansionName is absent', () => {
      const response = buildDomainResponse({ id: 99, restricted: true, expansionName: undefined });
      const result = mapDomainToCardData(response);

      expect(result.description).not.toContain('undefined');
    });
  });
});
