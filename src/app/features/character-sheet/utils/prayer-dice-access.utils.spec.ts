import { describe, it, expect } from 'vitest';
import { hasDevout, hasPrayerDice } from './prayer-dice-access.utils';
import {
  ClassCardResponse,
  SubclassCardResponse,
} from '../../create-character/models/character-sheet-api.model';

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

function buildSubclass(name: string, featureNames: string[]): SubclassCardResponse {
  return {
    id: 1,
    name,
    features: featureNames.map((featureName, index) => ({
      id: index + 1,
      name: featureName,
      description: '',
    })),
  };
}

describe('hasPrayerDice', () => {
  it('should return false when classes is undefined', () => {
    expect(hasPrayerDice(undefined)).toBe(false);
  });

  it('should return false for an empty classes array', () => {
    expect(hasPrayerDice([])).toBe(false);
  });

  it('should return false when no class has the Prayer Dice feature', () => {
    expect(hasPrayerDice([buildClass('Wizard', ['Prestidigitation'])])).toBe(false);
  });

  it('should return true for a single-class Seraph', () => {
    expect(hasPrayerDice([buildClass('Seraph', ['Prayer Dice'])])).toBe(true);
  });

  it('should return true when Seraph is not the first class (multiclass)', () => {
    const classes = [
      buildClass('Wizard', ['Prestidigitation']),
      buildClass('Seraph', ['Prayer Dice']),
    ];

    expect(hasPrayerDice(classes)).toBe(true);
  });

  it('should match the feature name case-insensitively', () => {
    expect(hasPrayerDice([buildClass('Homebrew Devotee', ['PRAYER DICE'])])).toBe(true);
  });

  it('should ignore surrounding whitespace in the feature name', () => {
    expect(hasPrayerDice([buildClass('Seraph', ['  Prayer Dice  '])])).toBe(true);
  });

  it('should return false when a class has no classFeatures array', () => {
    expect(hasPrayerDice([{ id: 1, name: 'Seraph' }])).toBe(false);
  });

  it('should not be fooled by a subclass feature of the same name', () => {
    expect(hasPrayerDice([buildClass('Seraph', ['Life Support'])])).toBe(false);
  });
});

describe('hasDevout', () => {
  it('should return false when subclassCards is undefined', () => {
    expect(hasDevout(undefined)).toBe(false);
  });

  it('should return false for an empty subclassCards array', () => {
    expect(hasDevout([])).toBe(false);
  });

  it('should return false for a Divine Wielder without the Devout feature yet', () => {
    const cards = [buildSubclass('Divine Wielder', ['Spirit Weapon', 'Sparing Touch'])];

    expect(hasDevout(cards)).toBe(false);
  });

  it('should return true for a Divine Wielder with the Devout feature', () => {
    const cards = [buildSubclass('Divine Wielder', ['Devout'])];

    expect(hasDevout(cards)).toBe(true);
  });

  it('should match the feature name case-insensitively', () => {
    expect(hasDevout([buildSubclass('Homebrew Path', ['DEVOUT'])])).toBe(true);
  });

  it('should ignore surrounding whitespace in the feature name', () => {
    expect(hasDevout([buildSubclass('Divine Wielder', ['  Devout  '])])).toBe(true);
  });

  it('should return false when a subclass card has no features array', () => {
    expect(hasDevout([{ id: 1, name: 'Divine Wielder' }])).toBe(false);
  });
});
