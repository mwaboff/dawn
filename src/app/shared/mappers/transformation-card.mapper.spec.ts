import { describe, it, expect } from 'vitest';
import { mapTransformationCardToCardData } from './transformation-card.mapper';
import { TransformationCardResponse } from '../models/transformation-card-api.model';
import { RESTRICTED_CARD_TITLE, restrictedCardMessage } from '../components/daggerheart-card/daggerheart-card.model';

function buildTransformationCardResponse(overrides: Partial<TransformationCardResponse> = {}): TransformationCardResponse {
  return {
    id: 1,
    name: 'Werewolf',
    description: 'A cursed shapeshifter.',
    expansionId: 1,
    featureIds: [10, 11],
    questionIds: [20, 21, 22, 23, 24, 25],
    createdAt: '2025-01-01T00:00:00Z',
    lastModifiedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mapTransformationCardToCardData', () => {
  it('should map card id and name correctly', () => {
    const response = buildTransformationCardResponse({ id: 42, name: 'Vampire' });
    const result = mapTransformationCardToCardData(response);

    expect(result.id).toBe(42);
    expect(result.name).toBe('Vampire');
  });

  it('should map cardType to transformationCard', () => {
    const response = buildTransformationCardResponse();
    const result = mapTransformationCardToCardData(response);

    expect(result.cardType).toBe('transformationCard');
  });

  it('should map description from response', () => {
    const response = buildTransformationCardResponse({ description: 'Rises again, hungry.' });
    const result = mapTransformationCardToCardData(response);

    expect(result.description).toBe('Rises again, hungry.');
  });

  it('should default description to empty string when undefined', () => {
    const response = buildTransformationCardResponse({ description: undefined });
    const result = mapTransformationCardToCardData(response);

    expect(result.description).toBe('');
  });

  it('should map features with id, name and description', () => {
    const response = buildTransformationCardResponse({
      features: [{ id: 10, name: 'Feral Instincts', description: 'Advantage on Instinct rolls.' }],
    });
    const result = mapTransformationCardToCardData(response);

    expect(result.features).toHaveLength(1);
    expect(result.features![0]).toEqual({ id: 10, name: 'Feral Instincts', description: 'Advantage on Instinct rolls.' });
  });

  it('should default a feature with no description to an empty string', () => {
    const response = buildTransformationCardResponse({
      features: [{ id: 10, name: 'Feral Instincts', description: undefined }],
    });
    const result = mapTransformationCardToCardData(response);

    expect(result.features![0].description).toBe('');
  });

  it('should leave features undefined when the response has no features array (no ?expand=features)', () => {
    const response = buildTransformationCardResponse({ features: undefined });
    const result = mapTransformationCardToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should leave features undefined when features is an empty array', () => {
    const response = buildTransformationCardResponse({ features: [] });
    const result = mapTransformationCardToCardData(response);

    expect(result.features).toBeUndefined();
  });

  it('should store expansionId, srd, questionIds and questions in metadata', () => {
    const response = buildTransformationCardResponse({
      expansionId: 3,
      srd: false,
      questionIds: [20, 21],
      questions: [{ id: 20, questionText: 'What did you lose?' }],
    });
    const result = mapTransformationCardToCardData(response);

    expect(result.metadata!['expansionId']).toBe(3);
    expect(result.metadata!['srd']).toBe(false);
    expect(result.metadata!['questionIds']).toEqual([20, 21]);
    expect(result.metadata!['questions']).toEqual([{ id: 20, questionText: 'What did you lose?' }]);
  });

  it('should default metadata.questions to an empty array when the response has no questions (no ?expand=questions)', () => {
    const response = buildTransformationCardResponse({ questions: undefined });
    const result = mapTransformationCardToCardData(response);

    expect(result.metadata!['questions']).toEqual([]);
  });

  describe('restricted', () => {
    it('short-circuits to a locked CardData without reading any other field', () => {
      const response = buildTransformationCardResponse({ id: 99, restricted: true, expansionName: 'Hope & Fear' });
      const result = mapTransformationCardToCardData(response);

      expect(result).toEqual({
        id: 99,
        cardType: 'transformationCard',
        name: RESTRICTED_CARD_TITLE,
        description: restrictedCardMessage('Hope & Fear'),
        restricted: true,
        expansionName: 'Hope & Fear',
      });
    });

    it('degrades the message gracefully when expansionName is absent', () => {
      const response = buildTransformationCardResponse({ id: 99, restricted: true, expansionName: undefined });
      const result = mapTransformationCardToCardData(response);

      expect(result.description).not.toContain('undefined');
    });

    it('does not throw when the source response carries only id', () => {
      expect(() =>
        mapTransformationCardToCardData({ id: 99, restricted: true } as TransformationCardResponse),
      ).not.toThrow();
    });
  });
});
