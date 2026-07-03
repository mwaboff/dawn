import { describe, it, expect } from 'vitest';
import { canEditCustomItem } from './card-permissions.utils';
import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

function buildCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 1,
    name: 'Longsword',
    description: '',
    cardType: 'weapon',
    metadata: { isOfficial: false, creatorId: 42 },
    ...overrides,
  };
}

describe('canEditCustomItem', () => {
  it('returns true when the current user is the creator', () => {
    const card = buildCard();
    expect(canEditCustomItem(card, 42, false)).toBe(true);
  });

  it('returns false when the current user is a different user', () => {
    const card = buildCard();
    expect(canEditCustomItem(card, 99, false)).toBe(false);
  });

  it('returns true for a privileged user regardless of ownership', () => {
    const card = buildCard();
    expect(canEditCustomItem(card, 99, true)).toBe(true);
  });

  it('returns false when currentUserId is undefined and not privileged', () => {
    const card = buildCard();
    expect(canEditCustomItem(card, undefined, false)).toBe(false);
  });

  it('returns false for an official item even for its creator', () => {
    const card = buildCard({ metadata: { isOfficial: true, creatorId: 42 } });
    expect(canEditCustomItem(card, 42, false)).toBe(false);
  });

  it('returns false for an official item even for a privileged user (admin portal handles this)', () => {
    const card = buildCard({ metadata: { isOfficial: true, creatorId: 42 } });
    expect(canEditCustomItem(card, 42, true)).toBe(false);
  });

  it('returns false when metadata is missing', () => {
    const card = buildCard({ metadata: undefined });
    expect(canEditCustomItem(card, 42, false)).toBe(false);
  });

  it.each(['class', 'subclass', 'heritage', 'community', 'ancestry', 'domain', 'domainCard', 'companion', 'subclassPath'] as const)(
    'returns false for non-item card type %s even when custom and owned',
    (cardType) => {
      const card = buildCard({ cardType });
      expect(canEditCustomItem(card, 42, false)).toBe(false);
    },
  );

  it.each(['weapon', 'armor', 'loot'] as const)(
    'returns true for owned custom %s',
    (cardType) => {
      const card = buildCard({ cardType });
      expect(canEditCustomItem(card, 42, false)).toBe(true);
    },
  );
});
