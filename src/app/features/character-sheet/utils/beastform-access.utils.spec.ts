import { describe, it, expect } from 'vitest';
import { hasBeastformFeature, tierForLevel } from './beastform-access.utils';
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

describe('tierForLevel', () => {
  it('should return tier 1 for level 1', () => {
    expect(tierForLevel(1)).toBe(1);
  });

  it('should return tier 2 for level 2', () => {
    expect(tierForLevel(2)).toBe(2);
  });

  it('should return tier 2 for level 4', () => {
    expect(tierForLevel(4)).toBe(2);
  });

  it('should return tier 3 for level 5', () => {
    expect(tierForLevel(5)).toBe(3);
  });

  it('should return tier 3 for level 7', () => {
    expect(tierForLevel(7)).toBe(3);
  });

  it('should return tier 4 for level 8', () => {
    expect(tierForLevel(8)).toBe(4);
  });

  it('should return tier 4 for level 10', () => {
    expect(tierForLevel(10)).toBe(4);
  });

  it('should clamp levels below 1 to tier 1', () => {
    expect(tierForLevel(0)).toBe(1);
  });
});

describe('hasBeastformFeature', () => {
  it('should return false when classes is undefined', () => {
    expect(hasBeastformFeature(undefined)).toBe(false);
  });

  it('should return false for an empty classes array', () => {
    expect(hasBeastformFeature([])).toBe(false);
  });

  it('should return false when no class has a Beastform feature', () => {
    const classes = [buildClass('Wizard', ['Prestidigitation', 'Strange Patterns'])];

    expect(hasBeastformFeature(classes)).toBe(false);
  });

  it('should return true for a single-class Druid', () => {
    const classes = [buildClass('Druid', ['Beastform', 'Wildtouch'])];

    expect(hasBeastformFeature(classes)).toBe(true);
  });

  it('should return true when Druid is not the first class (multiclass)', () => {
    const classes = [
      buildClass('Wizard', ['Prestidigitation']),
      buildClass('Druid', ['Beastform']),
    ];

    expect(hasBeastformFeature(classes)).toBe(true);
  });

  it('should match the feature name case-insensitively', () => {
    const classes = [buildClass('Homebrew Shifter', ['BEASTFORM'])];

    expect(hasBeastformFeature(classes)).toBe(true);
  });

  it('should ignore surrounding whitespace in the feature name', () => {
    const classes = [buildClass('Druid', ['  Beastform  '])];

    expect(hasBeastformFeature(classes)).toBe(true);
  });

  it('should not match a feature whose name merely contains "beastform"', () => {
    const classes = [buildClass('Druid', ['Beastform Mastery'])];

    expect(hasBeastformFeature(classes)).toBe(false);
  });

  it('should return false when a class has no classFeatures array', () => {
    const classes: ClassCardResponse[] = [{ id: 1, name: 'Druid' }];

    expect(hasBeastformFeature(classes)).toBe(false);
  });

  it('should tolerate a feature with no name', () => {
    const classes: ClassCardResponse[] = [
      { id: 1, name: 'Druid', classFeatures: [{ id: 1, description: 'no name' }] },
    ];

    expect(hasBeastformFeature(classes)).toBe(false);
  });
});
