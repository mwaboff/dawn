import { describe, it, expect } from 'vitest';
import {
  FeatureType,
  FEATURE_TYPE_LABELS,
  DEFAULT_FEATURE_TYPE_FOR_CARD,
  defaultFeatureTypeForCard,
} from './feature-type.model';

describe('FEATURE_TYPE_LABELS', () => {
  const allTypes: FeatureType[] = [
    'HOPE', 'ANCESTRY', 'CLASS', 'COMMUNITY', 'DOMAIN', 'ITEM', 'SUBCLASS', 'OTHER',
    'TRANSFORMATION', 'ENVIRONMENT', 'CAMPAIGN_FRAME',
    'BEASTFORM', 'MARTIAL_STANCE', 'ADVERSARY',
  ];

  it('has a label for every FeatureType enum value', () => {
    for (const type of allTypes) {
      expect(FEATURE_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('labels BEASTFORM as Beastform', () => {
    expect(FEATURE_TYPE_LABELS.BEASTFORM).toBe('Beastform');
  });

  it('labels MARTIAL_STANCE as Martial Stance', () => {
    expect(FEATURE_TYPE_LABELS.MARTIAL_STANCE).toBe('Martial Stance');
  });

  it('labels ADVERSARY as Adversary', () => {
    expect(FEATURE_TYPE_LABELS.ADVERSARY).toBe('Adversary');
  });

  it('labels are human-readable (first letter capitalized)', () => {
    for (const type of allTypes) {
      const label = FEATURE_TYPE_LABELS[type];
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});

describe('defaultFeatureTypeForCard', () => {
  it('maps domainCard to DOMAIN', () => {
    expect(defaultFeatureTypeForCard('domainCard')).toBe('DOMAIN');
  });

  it('maps ancestry to ANCESTRY', () => {
    expect(defaultFeatureTypeForCard('ancestry')).toBe('ANCESTRY');
  });

  it('maps community to COMMUNITY', () => {
    expect(defaultFeatureTypeForCard('community')).toBe('COMMUNITY');
  });

  it('maps subclass to SUBCLASS', () => {
    expect(defaultFeatureTypeForCard('subclass')).toBe('SUBCLASS');
  });

  it('maps class to CLASS', () => {
    expect(defaultFeatureTypeForCard('class')).toBe('CLASS');
  });

  it('maps weapon / armor / loot to ITEM', () => {
    expect(defaultFeatureTypeForCard('weapon')).toBe('ITEM');
    expect(defaultFeatureTypeForCard('armor')).toBe('ITEM');
    expect(defaultFeatureTypeForCard('loot')).toBe('ITEM');
  });

  it('falls back to OTHER for unknown card types', () => {
    expect(defaultFeatureTypeForCard('adversary')).toBe('OTHER');
    expect(defaultFeatureTypeForCard('companion')).toBe('OTHER');
    expect(defaultFeatureTypeForCard('not-a-real-type')).toBe('OTHER');
  });

  it('maps transformationCard to TRANSFORMATION', () => {
    expect(defaultFeatureTypeForCard('transformationCard')).toBe('TRANSFORMATION');
  });

  it('maps environment to ENVIRONMENT', () => {
    expect(defaultFeatureTypeForCard('environment')).toBe('ENVIRONMENT');
  });

  it('maps beastform to BEASTFORM', () => {
    expect(defaultFeatureTypeForCard('beastform')).toBe('BEASTFORM');
  });

  it('maps martialStance to MARTIAL_STANCE', () => {
    expect(defaultFeatureTypeForCard('martialStance')).toBe('MARTIAL_STANCE');
  });

  it('maps condition to OTHER (Condition has no features relationship, so no CONDITION value exists)', () => {
    expect(defaultFeatureTypeForCard('condition')).toBe('OTHER');
  });

  it('has no entry for expansion (an Expansion has no attachable features)', () => {
    expect(DEFAULT_FEATURE_TYPE_FOR_CARD['expansion']).toBeUndefined();
  });
});

describe('DEFAULT_FEATURE_TYPE_FOR_CARD', () => {
  it('maps every entry to a valid FeatureType', () => {
    const validTypes = new Set(Object.keys(FEATURE_TYPE_LABELS));
    for (const value of Object.values(DEFAULT_FEATURE_TYPE_FOR_CARD)) {
      expect(validTypes.has(value)).toBe(true);
    }
  });
});
