import { describe, it, expect } from 'vitest';
import { hasMartialStances } from './martial-stance-access.utils';
import { SubclassCardResponse } from '../../create-character/models/character-sheet-api.model';

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

describe('hasMartialStances', () => {
  it('should return false when subclassCards is undefined', () => {
    expect(hasMartialStances(undefined)).toBe(false);
  });

  it('should return false for an empty subclassCards array', () => {
    expect(hasMartialStances([])).toBe(false);
  });

  it('should return false when no subclass has a Stance Fighter feature', () => {
    const subclassCards = [buildSubclass('Juggernaut', ['Unstoppable', 'Bare Bones'])];

    expect(hasMartialStances(subclassCards)).toBe(false);
  });

  it('should return true for a Martial Artist subclass card', () => {
    const subclassCards = [buildSubclass('Martial Artist', ['Stance Fighter'])];

    expect(hasMartialStances(subclassCards)).toBe(true);
  });

  it('should return true when the granting subclass is not the first card (multiclass)', () => {
    const subclassCards = [
      buildSubclass('Juggernaut', ['Unstoppable']),
      buildSubclass('Martial Artist', ['Stance Fighter']),
    ];

    expect(hasMartialStances(subclassCards)).toBe(true);
  });

  it('should match the feature name case-insensitively', () => {
    const subclassCards = [buildSubclass('Homebrew Fighter', ['STANCE FIGHTER'])];

    expect(hasMartialStances(subclassCards)).toBe(true);
  });

  it('should ignore surrounding whitespace in the feature name', () => {
    const subclassCards = [buildSubclass('Martial Artist', ['  Stance Fighter  '])];

    expect(hasMartialStances(subclassCards)).toBe(true);
  });

  it('should not match a feature whose name merely contains "stance fighter"', () => {
    const subclassCards = [buildSubclass('Martial Artist', ['Stance Fighter Mastery'])];

    expect(hasMartialStances(subclassCards)).toBe(false);
  });

  it('should return false when a subclass card has no features array', () => {
    const subclassCards: SubclassCardResponse[] = [{ id: 1, name: 'Martial Artist' }];

    expect(hasMartialStances(subclassCards)).toBe(false);
  });

  it('should tolerate a feature with no name', () => {
    const subclassCards: SubclassCardResponse[] = [
      { id: 1, name: 'Martial Artist', features: [{ id: 1, description: 'no name' }] },
    ];

    expect(hasMartialStances(subclassCards)).toBe(false);
  });
});
