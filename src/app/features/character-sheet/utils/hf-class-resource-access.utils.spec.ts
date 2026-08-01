import { describe, it, expect } from 'vitest';
import { hasWarlockResources, hasBrawlerResources } from './hf-class-resource-access.utils';
import { ClassCardResponse } from '../../create-character/models/character-sheet-api.model';

function buildClass(name: string, featureNames: string[]): ClassCardResponse {
  return {
    id: 1,
    name,
    classFeatures: featureNames.map((featureName, index) => ({
      id: index + 1,
      name: featureName,
      description: '',
    })),
  };
}

describe('hasWarlockResources', () => {
  it('should return false when classes is undefined', () => {
    expect(hasWarlockResources(undefined)).toBe(false);
  });

  it('should return false for an empty classes array', () => {
    expect(hasWarlockResources([])).toBe(false);
  });

  it('should return false when no class has the Patron\'s Pact feature', () => {
    const classes = [buildClass('Wizard', ['Prestidigitation'])];

    expect(hasWarlockResources(classes)).toBe(false);
  });

  it('should return true for a single-class Warlock', () => {
    const classes = [buildClass('Warlock', ["Patron's Pact", 'Favor'])];

    expect(hasWarlockResources(classes)).toBe(true);
  });

  it('should return true when Warlock is not the first class (multiclass)', () => {
    const classes = [
      buildClass('Wizard', ['Prestidigitation']),
      buildClass('Warlock', ["Patron's Pact"]),
    ];

    expect(hasWarlockResources(classes)).toBe(true);
  });

  it('should match the feature name case-insensitively', () => {
    const classes = [buildClass('Homebrew Pactbound', ["PATRON'S PACT"])];

    expect(hasWarlockResources(classes)).toBe(true);
  });

  it('should ignore surrounding whitespace in the feature name', () => {
    const classes = [buildClass('Warlock', ["  Patron's Pact  "])];

    expect(hasWarlockResources(classes)).toBe(true);
  });

  it('should return false when a class has no classFeatures array', () => {
    const classes: ClassCardResponse[] = [{ id: 1, name: 'Warlock' }];

    expect(hasWarlockResources(classes)).toBe(false);
  });
});

describe('hasBrawlerResources', () => {
  it('should return false when classes is undefined', () => {
    expect(hasBrawlerResources(undefined)).toBe(false);
  });

  it('should return false for an empty classes array', () => {
    expect(hasBrawlerResources([])).toBe(false);
  });

  it('should return false when no class has the Combo Strike feature', () => {
    const classes = [buildClass('Wizard', ['Prestidigitation'])];

    expect(hasBrawlerResources(classes)).toBe(false);
  });

  it('should return true for a single-class Brawler', () => {
    const classes = [buildClass('Brawler', ['I Am the Weapon', 'Combo Strike'])];

    expect(hasBrawlerResources(classes)).toBe(true);
  });

  it('should return true when Brawler is not the first class (multiclass)', () => {
    const classes = [
      buildClass('Wizard', ['Prestidigitation']),
      buildClass('Brawler', ['Combo Strike']),
    ];

    expect(hasBrawlerResources(classes)).toBe(true);
  });

  it('should match the feature name case-insensitively', () => {
    const classes = [buildClass('Homebrew Fighter', ['COMBO STRIKE'])];

    expect(hasBrawlerResources(classes)).toBe(true);
  });

  it('should ignore surrounding whitespace in the feature name', () => {
    const classes = [buildClass('Brawler', ['  Combo Strike  '])];

    expect(hasBrawlerResources(classes)).toBe(true);
  });

  it('should return false when a class has no classFeatures array', () => {
    const classes: ClassCardResponse[] = [{ id: 1, name: 'Brawler' }];

    expect(hasBrawlerResources(classes)).toBe(false);
  });
});
