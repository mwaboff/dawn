import { describe, it, expect } from 'vitest';
import { sumFeatureModifier } from './feature-modifier.utils';
import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

interface TestFeature {
  modifiers?: ModifierResponse[];
}

function mod(target: string, operation: string, value: number): ModifierResponse {
  return { target, operation, value };
}

describe('sumFeatureModifier', () => {
  it('returns 0 when features is undefined', () => {
    expect(sumFeatureModifier(undefined, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(0);
  });

  it('returns 0 for empty features array', () => {
    expect(sumFeatureModifier([], 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(0);
  });

  it('returns 0 when no modifiers match the target', () => {
    const features: TestFeature[] = [
      { modifiers: [mod('EVASION', 'ADD', 1)] },
    ];
    expect(sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(0);
  });

  it('returns 0 when a feature has no modifiers', () => {
    const features: TestFeature[] = [{}];
    expect(sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(0);
  });

  it('sums a single ADD modifier', () => {
    const features: TestFeature[] = [
      { modifiers: [mod('BONUS_DOMAIN_CARD_SELECTIONS', 'ADD', 1)] },
    ];
    expect(sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(1);
  });

  it('sums modifiers across multiple features', () => {
    const features: TestFeature[] = [
      { modifiers: [mod('BONUS_DOMAIN_CARD_SELECTIONS', 'ADD', 1)] },
      { modifiers: [mod('BONUS_DOMAIN_CARD_SELECTIONS', 'ADD', 2)] },
    ];
    expect(sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(3);
  });

  it('sums multiple matching modifiers within one feature', () => {
    const features: TestFeature[] = [
      {
        modifiers: [
          mod('BONUS_DOMAIN_CARD_SELECTIONS', 'ADD', 1),
          mod('BONUS_DOMAIN_CARD_SELECTIONS', 'ADD', 2),
        ],
      },
    ];
    expect(sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(3);
  });

  it('ignores non-ADD operations (SET, MULTIPLY)', () => {
    const features: TestFeature[] = [
      {
        modifiers: [
          mod('BONUS_DOMAIN_CARD_SELECTIONS', 'SET', 5),
          mod('BONUS_DOMAIN_CARD_SELECTIONS', 'MULTIPLY', 2),
          mod('BONUS_DOMAIN_CARD_SELECTIONS', 'ADD', 1),
        ],
      },
    ];
    expect(sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(1);
  });

  it('ignores modifiers targeting a different string', () => {
    const features: TestFeature[] = [
      {
        modifiers: [
          mod('EVASION', 'ADD', 5),
          mod('BONUS_DOMAIN_CARD_SELECTIONS', 'ADD', 1),
        ],
      },
    ];
    expect(sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')).toBe(1);
  });
});
