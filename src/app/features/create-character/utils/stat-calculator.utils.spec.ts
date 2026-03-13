import { describe, it, expect } from 'vitest';
import { calculateDisplayEvasion } from './stat-calculator.utils';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

function makeCard(overrides: Partial<CardData> = {}): CardData {
  return { id: 1, name: 'Card', description: '', cardType: 'armor', ...overrides };
}

describe('calculateDisplayEvasion', () => {
  it('should return base evasion when no equipment', () => {
    expect(calculateDisplayEvasion(10, null, null, null)).toBe(10);
  });

  it('should apply ADD modifier from armor', () => {
    const armor = makeCard({
      metadata: { modifiers: [{ target: 'EVASION', operation: 'ADD', value: 2 }] },
    });
    expect(calculateDisplayEvasion(10, armor, null, null)).toBe(12);
  });

  it('should apply SET modifier from armor', () => {
    const armor = makeCard({
      metadata: { modifiers: [{ target: 'EVASION', operation: 'SET', value: 7 }] },
    });
    expect(calculateDisplayEvasion(10, armor, null, null)).toBe(7);
  });

  it('should apply MULTIPLY modifier from armor', () => {
    const armor = makeCard({
      metadata: { modifiers: [{ target: 'EVASION', operation: 'MULTIPLY', value: 2 }] },
    });
    expect(calculateDisplayEvasion(5, armor, null, null)).toBe(10);
  });

  it('should apply modifier from primary weapon', () => {
    const weapon = makeCard({
      cardType: 'weapon',
      metadata: { modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }] },
    });
    expect(calculateDisplayEvasion(8, null, weapon, null)).toBe(9);
  });

  it('should apply modifier from secondary weapon', () => {
    const weapon = makeCard({
      cardType: 'weapon',
      metadata: { modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }] },
    });
    expect(calculateDisplayEvasion(8, null, null, weapon)).toBe(9);
  });

  it('should stack modifiers from multiple equipment', () => {
    const armor = makeCard({
      metadata: { modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }] },
    });
    const primary = makeCard({
      cardType: 'weapon',
      metadata: { modifiers: [{ target: 'EVASION', operation: 'ADD', value: 1 }] },
    });
    expect(calculateDisplayEvasion(8, armor, primary, null)).toBe(10);
  });

  it('should ignore modifiers for other targets', () => {
    const armor = makeCard({
      metadata: { modifiers: [{ target: 'ARMOR', operation: 'ADD', value: 5 }] },
    });
    expect(calculateDisplayEvasion(10, armor, null, null)).toBe(10);
  });

  it('should return base evasion when equipment has no modifiers', () => {
    const armor = makeCard({ metadata: {} });
    expect(calculateDisplayEvasion(10, armor, null, null)).toBe(10);
  });
});
