import { describe, it, expect } from 'vitest';
import { buildTraitRollRequest, buildWeaponDamageRollRequest } from './roll-request.utils';
import { DisplayStat, TraitDisplay, WeaponDisplay } from '../models/character-sheet-view.model';

function makeStat(modified: number, overrides: Partial<DisplayStat> = {}): DisplayStat {
  return { base: modified, modified, hasModifier: false, modifierSources: [], ...overrides };
}

function makeTrait(overrides: Partial<TraitDisplay> = {}): TraitDisplay {
  return {
    name: 'Agility',
    abbreviation: 'AGI',
    modifier: makeStat(2),
    marked: false,
    ...overrides,
  };
}

function makeWeapon(overrides: Partial<WeaponDisplay> = {}): WeaponDisplay {
  return {
    id: 1,
    inventoryEntryId: 1,
    name: 'Longsword',
    isPrimary: true,
    damage: '1d8+3 Phy',
    damageDice: { type: 'd8', diceCount: 1, modifier: 3 },
    trait: 'Strength',
    range: 'Melee',
    burden: 'One-Handed',
    features: [],
    ...overrides,
  };
}

describe('buildTraitRollRequest', () => {
  it('builds a duality request with the trait modifier and label', () => {
    const request = buildTraitRollRequest(makeTrait({ name: 'Finesse', modifier: makeStat(1) }));

    expect(request).toEqual({
      dice: [],
      includeDuality: true,
      modifiers: [{ label: 'Finesse', value: 1 }],
      advantage: undefined,
      autoRoll: true,
      label: 'Finesse Roll',
    });
  });

  it('carries a modifier of 0 through unchanged', () => {
    const request = buildTraitRollRequest(makeTrait({ modifier: makeStat(0) }));

    expect(request.modifiers).toEqual([{ label: 'Agility', value: 0 }]);
  });

  it('carries a negative modifier through unchanged', () => {
    const request = buildTraitRollRequest(makeTrait({ modifier: makeStat(-2) }));

    expect(request.modifiers).toEqual([{ label: 'Agility', value: -2 }]);
  });

  it('passes the caller-selected advantage state through', () => {
    const request = buildTraitRollRequest(makeTrait(), 'advantage');

    expect(request.advantage).toBe('advantage');
  });

  it('passes the caller-selected disadvantage state through', () => {
    const request = buildTraitRollRequest(makeTrait(), 'disadvantage');

    expect(request.advantage).toBe('disadvantage');
  });
});

describe('buildWeaponDamageRollRequest', () => {
  it('multiplies the dice count by Proficiency but adds the modifier only once', () => {
    const weapon = makeWeapon({ damageDice: { type: 'd6', diceCount: null, modifier: 3 } });

    const request = buildWeaponDamageRollRequest(weapon, 3);

    expect(request).toEqual({
      dice: [{ type: 'd6', count: 3 }],
      includeDuality: false,
      modifiers: [{ label: 'Longsword', value: 3 }],
      autoRoll: true,
      label: 'Longsword Damage',
    });
  });

  it('does not include an advantage field on a damage request', () => {
    const request = buildWeaponDamageRollRequest(makeWeapon(), 1);

    expect(request).not.toBeNull();
    expect(request).not.toHaveProperty('advantage');
  });

  it('uses the explicit diceCount from the weapon over Proficiency when present', () => {
    const weapon = makeWeapon({ damageDice: { type: 'd8', diceCount: 2, modifier: 0 } });

    const request = buildWeaponDamageRollRequest(weapon, 5);

    expect(request?.dice).toEqual([{ type: 'd8', count: 2 }]);
  });

  it('falls back to Proficiency when diceCount is null', () => {
    const weapon = makeWeapon({ damageDice: { type: 'd10', diceCount: null, modifier: 1 } });

    const request = buildWeaponDamageRollRequest(weapon, 4);

    expect(request?.dice).toEqual([{ type: 'd10', count: 4 }]);
  });

  it('defaults a missing modifier to 0', () => {
    const weapon = makeWeapon({ damageDice: { type: 'd8', diceCount: 1, modifier: 0 } });

    const request = buildWeaponDamageRollRequest(weapon, 1);

    expect(request?.modifiers).toEqual([{ label: 'Longsword', value: 0 }]);
  });

  it('returns null for a weapon with no damage at all', () => {
    const weapon = makeWeapon({ damageDice: null });

    expect(buildWeaponDamageRollRequest(weapon, 2)).toBeNull();
  });

  it('returns null for a weapon with an unparseable dice type (damageDice already null from the mapper)', () => {
    const weapon = makeWeapon({ damageDice: undefined });

    expect(buildWeaponDamageRollRequest(weapon, 2)).toBeNull();
  });

  it('returns null when the resolved dice count is zero', () => {
    const weapon = makeWeapon({ damageDice: { type: 'd6', diceCount: 0, modifier: 2 } });

    expect(buildWeaponDamageRollRequest(weapon, 3)).toBeNull();
  });

  it('returns null when diceCount is null and Proficiency itself is zero', () => {
    const weapon = makeWeapon({ damageDice: { type: 'd6', diceCount: null, modifier: 2 } });

    expect(buildWeaponDamageRollRequest(weapon, 0)).toBeNull();
  });
});
