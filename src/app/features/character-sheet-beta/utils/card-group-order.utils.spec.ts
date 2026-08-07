import { describe, expect, it } from 'vitest';

import { CardSummary, SubclassCardSummary } from '../../character-sheet/models/character-sheet-view.model';
import { orderClassGroupCards } from './card-group-order.utils';

function classCard(id: number, name: string): CardSummary {
  return { id, name, features: [] };
}

function subclassCard(id: number, name: string, associatedClassId?: number, level?: string): SubclassCardSummary {
  return { id, name, features: [], associatedClassId, level };
}

describe('orderClassGroupCards', () => {
  it('returns an empty list when the character has no cards', () => {
    expect(orderClassGroupCards([], [])).toEqual([]);
  });

  it('places every class card before every subclass card', () => {
    const result = orderClassGroupCards(
      [classCard(1, 'Sorcerer'), classCard(2, 'Warrior')],
      [subclassCard(10, 'Call of the Brave', 2, 'FOUNDATION')],
    );

    expect(result.map(entry => entry.kind)).toEqual(['class', 'class', 'subclass']);
  });

  it('preserves the acquisition order the server sends class cards in', () => {
    const result = orderClassGroupCards([classCard(9, 'Warrior'), classCard(2, 'Bard')], []);

    expect(result.map(entry => entry.card.name)).toEqual(['Warrior', 'Bard']);
  });

  it('groups subclass cards under their class, following the class order', () => {
    const result = orderClassGroupCards(
      [classCard(9, 'Warrior'), classCard(2, 'Bard')],
      [
        subclassCard(20, 'Wordsmith', 2, 'FOUNDATION'),
        subclassCard(10, 'Call of the Brave', 9, 'FOUNDATION'),
      ],
    );

    expect(result.map(entry => entry.card.name)).toEqual(['Warrior', 'Bard', 'Call of the Brave', 'Wordsmith']);
  });

  it('orders a class group Foundation, then Specialization, then Mastery', () => {
    const result = orderClassGroupCards(
      [classCard(1, 'Sorcerer')],
      [
        subclassCard(12, 'Mastery card', 1, 'MASTERY'),
        subclassCard(11, 'Specialization card', 1, 'SPECIALIZATION'),
        subclassCard(10, 'Foundation card', 1, 'FOUNDATION'),
      ],
    );

    expect(result.map(entry => entry.card.name)).toEqual([
      'Sorcerer',
      'Foundation card',
      'Specialization card',
      'Mastery card',
    ]);
  });

  it('matches the level order regardless of casing', () => {
    const result = orderClassGroupCards(
      [classCard(1, 'Sorcerer')],
      [subclassCard(12, 'Mastery card', 1, 'Mastery'), subclassCard(10, 'Foundation card', 1, 'Foundation')],
    );

    expect(result.map(entry => entry.card.name)).toEqual(['Sorcerer', 'Foundation card', 'Mastery card']);
  });

  it('sorts an unknown or missing level after the three known levels', () => {
    const result = orderClassGroupCards(
      [classCard(1, 'Sorcerer')],
      [subclassCard(12, 'No level', 1, undefined), subclassCard(10, 'Foundation card', 1, 'FOUNDATION')],
    );

    expect(result.map(entry => entry.card.name)).toEqual(['Sorcerer', 'Foundation card', 'No level']);
  });

  it('keeps subclass cards whose class is absent, after every grouped card', () => {
    const result = orderClassGroupCards(
      [classCard(1, 'Sorcerer')],
      [
        subclassCard(30, 'Orphan B', 77, 'FOUNDATION'),
        subclassCard(10, 'Elemental Origin', 1, 'FOUNDATION'),
        subclassCard(31, 'Orphan A', undefined, 'MASTERY'),
      ],
    );

    expect(result.map(entry => entry.card.name)).toEqual(['Sorcerer', 'Elemental Origin', 'Orphan B', 'Orphan A']);
  });

  it('level-orders the unmatched bucket too, rather than trusting arrival order', () => {
    const result = orderClassGroupCards(
      [],
      [subclassCard(31, 'Orphan Mastery', 77, 'MASTERY'), subclassCard(30, 'Orphan Foundation', 77, 'FOUNDATION')],
    );

    expect(result.map(entry => entry.card.name)).toEqual(['Orphan Foundation', 'Orphan Mastery']);
  });

  it('returns subclass cards even when no class cards were sent at all', () => {
    const result = orderClassGroupCards([], [subclassCard(10, 'Elemental Origin', 1, 'FOUNDATION')]);

    expect(result).toEqual([{ kind: 'subclass', card: expect.objectContaining({ name: 'Elemental Origin' }) }]);
  });

  it('does not mutate the arrays it is given', () => {
    const subclasses = [subclassCard(12, 'Mastery card', 1, 'MASTERY'), subclassCard(10, 'Foundation card', 1, 'FOUNDATION')];

    orderClassGroupCards([classCard(1, 'Sorcerer')], subclasses);

    expect(subclasses.map(card => card.name)).toEqual(['Mastery card', 'Foundation card']);
  });
});
