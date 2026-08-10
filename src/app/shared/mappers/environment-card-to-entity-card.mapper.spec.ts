import { describe, it, expect } from 'vitest';
import { environmentCardToEntityCard } from './environment-card-to-entity-card.mapper';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

function buildEnvironmentCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 9,
    name: 'Raging River',
    description: 'A swift-moving river.',
    cardType: 'environment',
    subtitle: 'Traversal',
    subtitleSecondary: 'Tier 1',
    tags: ['Difficulty 10'],
    ...overrides,
  };
}

describe('environmentCardToEntityCard', () => {
  it('carries every field cardDataToEntityCard already produces', () => {
    const card = buildEnvironmentCard();
    const result = environmentCardToEntityCard(card);

    expect(result.id).toBe(9);
    expect(result.name).toBe('Raging River');
    expect(result.cardType).toBe('environment');
    expect(result.subtitle).toBe('Traversal');
    expect(result.meta).toEqual([{ label: 'Tier 1' }]);
    expect(result.badges).toEqual([{ label: 'Difficulty 10' }]);
    expect(result.description).toBe('A swift-moving river.');
  });

  it('sets headline to the first tag, for the compact glance', () => {
    const result = environmentCardToEntityCard(buildEnvironmentCard({ tags: ['Difficulty 15'] }));

    expect(result.headline).toBe('Difficulty 15');
  });

  it('reuses the verbatim special-difficulty callout as the headline when that is the first tag', () => {
    const result = environmentCardToEntityCard(
      buildEnvironmentCard({ tags: ['Difficulty: Special (see "Relative Strength")'] }),
    );

    expect(result.headline).toBe('Difficulty: Special (see "Relative Strength")');
  });

  it('leaves headline unset when there are no tags', () => {
    const result = environmentCardToEntityCard(buildEnvironmentCard({ tags: undefined }));

    expect(result.headline).toBeUndefined();
  });
});
