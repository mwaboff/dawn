import { describe, it, expect } from 'vitest';
import { hasCompanionFeature, showCompanionPanel, canCreateCompanion, companionClassFeatureReminders } from './companion-access.utils';
import { SubclassCardResponse } from '../../create-character/models/character-sheet-api.model';

function buildSubclass(
  name: string,
  features: { name: string; featureType?: string }[],
): SubclassCardResponse {
  return {
    id: 1,
    name,
    features: features.map((f, index) => ({
      id: index + 1,
      name: f.name,
      description: '',
      featureType: f.featureType,
    })),
  };
}

describe('hasCompanionFeature', () => {
  it('should return false when subclassCards is undefined', () => {
    expect(hasCompanionFeature(undefined)).toBe(false);
  });

  it('should return false for an empty subclassCards array', () => {
    expect(hasCompanionFeature([])).toBe(false);
  });

  it('should return true for the Beastbound Companion feature', () => {
    const subclassCards = [buildSubclass('Beastbound', [{ name: 'Companion', featureType: 'SUBCLASS' }])];

    expect(hasCompanionFeature(subclassCards)).toBe(true);
  });

  it('should return false for a same-named feature with a different featureType', () => {
    // Production has a second "Companion" feature with featureType BEASTFORM -- this must not match.
    const subclassCards = [buildSubclass('Some Other Subclass', [{ name: 'Companion', featureType: 'BEASTFORM' }])];

    expect(hasCompanionFeature(subclassCards)).toBe(false);
  });

  it('should return false when featureType is missing entirely', () => {
    const subclassCards = [buildSubclass('Beastbound', [{ name: 'Companion' }])];

    expect(hasCompanionFeature(subclassCards)).toBe(false);
  });

  it('should match the feature name case-insensitively', () => {
    const subclassCards = [buildSubclass('Beastbound', [{ name: 'COMPANION', featureType: 'SUBCLASS' }])];

    expect(hasCompanionFeature(subclassCards)).toBe(true);
  });

  it('should ignore surrounding whitespace in the feature name', () => {
    const subclassCards = [buildSubclass('Beastbound', [{ name: '  Companion  ', featureType: 'SUBCLASS' }])];

    expect(hasCompanionFeature(subclassCards)).toBe(true);
  });

  it('should not match a feature whose name merely contains "companion"', () => {
    const subclassCards = [buildSubclass('Beastbound', [{ name: 'Companion Case', featureType: 'SUBCLASS' }])];

    expect(hasCompanionFeature(subclassCards)).toBe(false);
  });

  it('should return true when the granting subclass is not the first card (multiclass)', () => {
    const subclassCards = [
      buildSubclass('Juggernaut', [{ name: 'Unstoppable', featureType: 'SUBCLASS' }]),
      buildSubclass('Beastbound', [{ name: 'Companion', featureType: 'SUBCLASS' }]),
    ];

    expect(hasCompanionFeature(subclassCards)).toBe(true);
  });

  it('should return false when a subclass card has no features array', () => {
    const subclassCards: SubclassCardResponse[] = [{ id: 1, name: 'Beastbound' }];

    expect(hasCompanionFeature(subclassCards)).toBe(false);
  });

  it('should tolerate a feature with no name', () => {
    const subclassCards: SubclassCardResponse[] = [
      { id: 1, name: 'Beastbound', features: [{ id: 1, description: 'no name', featureType: 'SUBCLASS' }] },
    ];

    expect(hasCompanionFeature(subclassCards)).toBe(false);
  });
});

describe('showCompanionPanel', () => {
  it('should return false when nothing grants or holds a companion', () => {
    expect(showCompanionPanel(false, false, 0)).toBe(false);
  });

  it('should return true when the character has the Companion feature', () => {
    expect(showCompanionPanel(true, false, 0)).toBe(true);
  });

  it('should return true when a GM has enabled companions', () => {
    expect(showCompanionPanel(false, true, 0)).toBe(true);
  });

  it('should return true when an active companion exists, even with no feature and the flag off', () => {
    expect(showCompanionPanel(false, false, 1)).toBe(true);
  });

  it('should not hide an existing companion when the GM later turns the flag back off', () => {
    // The exact §3.4 scenario: flag off, no subclass feature, but a companion still exists.
    expect(showCompanionPanel(false, false, 2)).toBe(true);
  });
});

describe('canCreateCompanion', () => {
  it('should return false when neither the feature nor the flag is set', () => {
    expect(canCreateCompanion(false, false)).toBe(false);
  });

  it('should return true when the character has the Companion feature', () => {
    expect(canCreateCompanion(true, false)).toBe(true);
  });

  it('should return true when a GM has enabled companions', () => {
    expect(canCreateCompanion(false, true)).toBe(true);
  });

  it('should not be affected by existing companion count', () => {
    // canCreateCompanion deliberately ignores active companion count, unlike showCompanionPanel --
    // having one companion already does not by itself unlock creating another.
    expect(canCreateCompanion(false, false)).toBe(false);
  });
});

describe('companionClassFeatureReminders', () => {
  it('should return [] when subclassCards is undefined', () => {
    expect(companionClassFeatureReminders(undefined)).toEqual([]);
  });

  it('should return [] when neither feature is present', () => {
    const subclassCards = [buildSubclass('Beastbound', [{ name: 'Companion', featureType: 'SUBCLASS' }])];
    expect(companionClassFeatureReminders(subclassCards)).toEqual([]);
  });

  it('should include Battle-Bonded when the character has that Specialization feature', () => {
    const subclassCards = [buildSubclass('Beastbound Specialization', [
      { name: 'Expert Training', featureType: 'SUBCLASS' },
      { name: 'Battle-Bonded', featureType: 'SUBCLASS' },
    ])];

    const result = companionClassFeatureReminders(subclassCards);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Battle-Bonded');
    expect(result[0].text).toContain('+2 bonus to your Evasion');
  });

  it('should include Loyal Friend when the character has that Mastery feature', () => {
    const subclassCards = [buildSubclass('Beastbound Mastery', [
      { name: 'Advanced Training', featureType: 'SUBCLASS' },
      { name: 'Loyal Friend', featureType: 'SUBCLASS' },
    ])];

    const result = companionClassFeatureReminders(subclassCards);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Loyal Friend');
    expect(result[0].text).toContain('Once per long rest');
  });

  it('should include both when the character has both Specialization and Mastery', () => {
    const subclassCards = [
      buildSubclass('Beastbound Specialization', [{ name: 'Battle-Bonded', featureType: 'SUBCLASS' }]),
      buildSubclass('Beastbound Mastery', [{ name: 'Loyal Friend', featureType: 'SUBCLASS' }]),
    ];

    const result = companionClassFeatureReminders(subclassCards);

    expect(result.map(r => r.label)).toEqual(['Battle-Bonded', 'Loyal Friend']);
  });

  it('should not match a same-named feature of a different featureType', () => {
    const subclassCards = [buildSubclass('Homebrew', [{ name: 'Battle-Bonded', featureType: 'PASSIVE' }])];
    expect(companionClassFeatureReminders(subclassCards)).toEqual([]);
  });

  it('should match case/whitespace-insensitively', () => {
    const subclassCards = [buildSubclass('Beastbound Specialization', [{ name: '  battle-bonded  ', featureType: 'SUBCLASS' }])];
    expect(companionClassFeatureReminders(subclassCards)).toHaveLength(1);
  });
});
