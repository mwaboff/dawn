import {
  SUGGESTED_TRAITS,
  suggestedTraitsFor,
  TRAITS,
  TRAIT_VALUE_POOL,
  TraitAssignments,
} from './trait.model';

describe('SUGGESTED_TRAITS', () => {
  const classNames = Object.keys(SUGGESTED_TRAITS);

  function sortedValues(assignments: TraitAssignments): number[] {
    return Object.values(assignments)
      .map((v) => v as number)
      .sort((a, b) => b - a);
  }

  it('should cover every core and Hope & Fear class', () => {
    expect([...classNames].sort()).toEqual(
      [
        'assassin',
        'bard',
        'brawler',
        'druid',
        'guardian',
        'ranger',
        'rogue',
        'seraph',
        'sorcerer',
        'warlock',
        'warrior',
        'witch',
        'wizard',
      ].sort(),
    );
  });

  it.each(classNames)('should spend exactly the trait value pool for %s', (className) => {
    const expected = [...TRAIT_VALUE_POOL].sort((a, b) => b - a);
    expect(sortedValues(SUGGESTED_TRAITS[className])).toEqual(expected);
  });

  it.each(classNames)('should assign all six traits for %s', (className) => {
    for (const trait of TRAITS) {
      expect(SUGGESTED_TRAITS[className][trait.key]).not.toBeNull();
    }
  });

  it('should match the spread printed in the core rulebook for sorcerer', () => {
    expect(SUGGESTED_TRAITS['sorcerer']).toEqual({
      agility: 0,
      strength: -1,
      finesse: 1,
      instinct: 2,
      presence: 1,
      knowledge: 0,
    });
  });
});

describe('suggestedTraitsFor', () => {
  it('should look up a class by name', () => {
    expect(suggestedTraitsFor('Wizard')).toEqual(SUGGESTED_TRAITS['wizard']);
  });

  it('should ignore surrounding whitespace and casing', () => {
    expect(suggestedTraitsFor('  BARD  ')).toEqual(SUGGESTED_TRAITS['bard']);
  });

  it('should return null for an unknown class', () => {
    expect(suggestedTraitsFor('Homebrew Necromancer')).toBeNull();
  });

  it('should return null for an empty name', () => {
    expect(suggestedTraitsFor('')).toBeNull();
  });

  it('should return null for null', () => {
    expect(suggestedTraitsFor(null)).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(suggestedTraitsFor(undefined)).toBeNull();
  });
});
