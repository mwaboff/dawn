import { describe, it, expect } from 'vitest';
import {
  FeatureType,
  FEATURE_TYPE_LABELS,
  DEFAULT_FEATURE_TYPE_FOR_CARD,
  defaultFeatureTypeForCard,
} from './feature-type.model';

describe('FEATURE_TYPE_LABELS', () => {
  const allTypes: FeatureType[] = ['HOPE', 'ANCESTRY', 'CLASS', 'COMMUNITY', 'DOMAIN', 'ITEM', 'SUBCLASS', 'OTHER'];

  it('has a label for every FeatureType enum value', () => {
    for (const type of allTypes) {
      expect(FEATURE_TYPE_LABELS[type]).toBeTruthy();
    }
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
});

describe('DEFAULT_FEATURE_TYPE_FOR_CARD', () => {
  it('maps every entry to a valid FeatureType', () => {
    const validTypes = new Set(Object.keys(FEATURE_TYPE_LABELS));
    for (const value of Object.values(DEFAULT_FEATURE_TYPE_FOR_CARD)) {
      expect(validTypes.has(value)).toBe(true);
    }
  });
});
