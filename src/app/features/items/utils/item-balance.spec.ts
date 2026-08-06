import { DEFAULT_ITEM_FORM_VALUE, ItemFormValue } from '../models/item-form-value.model';
import {
  DICE_COUNT_NOTE,
  MODIFIER_ADVISORY_TOLERANCE,
  PUBLISHED_MAX_ARMOR_SCORE,
  armorScoreAdvice,
  damageModifierAdvice,
  expectedDamageModifier,
  itemAdvisories,
} from './item-balance';

function value(overrides: Partial<ItemFormValue> = {}): ItemFormValue {
  return { ...DEFAULT_ITEM_FORM_VALUE, ...overrides };
}

describe('expectedDamageModifier', () => {
  it('gives a primary weapon +3 per tier', () => {
    expect(expectedDamageModifier(3, true)).toBe(9);
  });

  it('gives a secondary weapon +2 per tier', () => {
    expect(expectedDamageModifier(3, false)).toBe(6);
  });

  it('scales from tier 1 through tier 4 for primaries', () => {
    expect([1, 2, 3, 4].map(t => expectedDamageModifier(t, true))).toEqual([3, 6, 9, 12]);
  });

  it('scales from tier 1 through tier 4 for secondaries', () => {
    expect([1, 2, 3, 4].map(t => expectedDamageModifier(t, false))).toEqual([2, 4, 6, 8]);
  });
});

describe('damageModifierAdvice', () => {
  it('says nothing when a primary modifier matches the printed baseline', () => {
    expect(damageModifierAdvice(3, true, 9)).toBeNull();
  });

  it('says nothing when a modifier is exactly at the tolerance edge', () => {
    expect(damageModifierAdvice(3, true, 9 + MODIFIER_ADVISORY_TOLERANCE)).toBeNull();
  });

  it('advises when a primary modifier is far above the baseline', () => {
    expect(damageModifierAdvice(3, true, 20)).toBe('Tier 3 primaries in the books deal about +9.');
  });

  it('advises when a primary modifier is far below the baseline', () => {
    expect(damageModifierAdvice(3, true, 0)).toBe('Tier 3 primaries in the books deal about +9.');
  });

  it('uses the secondary baseline for secondary weapons', () => {
    expect(damageModifierAdvice(2, false, 15)).toBe('Tier 2 secondaries in the books deal about +4.');
  });

  it('says nothing for a tier below 1', () => {
    expect(damageModifierAdvice(0, true, 99)).toBeNull();
  });

  it('says nothing for a tier above 4', () => {
    expect(damageModifierAdvice(5, true, 99)).toBeNull();
  });

  it('says nothing for a non-integer tier', () => {
    expect(damageModifierAdvice(2.5, true, 99)).toBeNull();
  });

  it('says nothing when the modifier is not a finite number', () => {
    expect(damageModifierAdvice(3, true, Number.NaN)).toBeNull();
  });
});

describe('armorScoreAdvice', () => {
  it('says nothing at the published maximum', () => {
    expect(armorScoreAdvice(PUBLISHED_MAX_ARMOR_SCORE)).toBeNull();
  });

  it('advises one point above the published maximum', () => {
    expect(armorScoreAdvice(13)).toBe('Armor Score above 12 exceeds anything published.');
  });

  it('says nothing for an ordinary low score', () => {
    expect(armorScoreAdvice(4)).toBeNull();
  });

  it('says nothing when the score is not a finite number', () => {
    expect(armorScoreAdvice(Number.NaN)).toBeNull();
  });
});

describe('itemAdvisories', () => {
  it('says nothing about an ordinary weapon', () => {
    expect(itemAdvisories(value({ kind: 'weapon', tier: 1, isPrimary: true, modifier: 3 }))).toEqual([]);
  });

  it('reports an out-of-line weapon modifier', () => {
    expect(itemAdvisories(value({ kind: 'weapon', tier: 1, isPrimary: true, modifier: 30 })))
      .toEqual(['Tier 1 primaries in the books deal about +3.']);
  });

  it('reports an out-of-line armor score', () => {
    expect(itemAdvisories(value({ kind: 'armor', baseScore: 30 })))
      .toEqual(['Armor Score above 12 exceeds anything published.']);
  });

  it('does not mention armor score while a weapon is selected', () => {
    expect(itemAdvisories(value({ kind: 'weapon', tier: 1, modifier: 3, baseScore: 30 }))).toEqual([]);
  });

  it('does not mention damage while armor is selected', () => {
    expect(itemAdvisories(value({ kind: 'armor', baseScore: 4, modifier: 99 }))).toEqual([]);
  });

  it('has nothing to say about loot', () => {
    expect(itemAdvisories(value({ kind: 'loot', modifier: 99, baseScore: 99 }))).toEqual([]);
  });

  it('coerces the strings a select and a number input hand back', () => {
    const raw = { ...value({ kind: 'weapon', isPrimary: true }), tier: '1', modifier: '30' };

    expect(itemAdvisories(raw as unknown as ItemFormValue))
      .toEqual(['Tier 1 primaries in the books deal about +3.']);
  });
});

describe('DICE_COUNT_NOTE', () => {
  it('explains where the dice count actually comes from', () => {
    expect(DICE_COUNT_NOTE).toBe('Damage dice count comes from your Proficiency.');
  });
});
