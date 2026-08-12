import { describe, it, expect, vi } from 'vitest';
import { applyRestMoves, RestDiceRoller } from './rest.utils';
import { RestCharacterState, RestMoveId, RestSelection } from '../models/rest.model';

const BASE_STATE: RestCharacterState = {
  tier: 2,
  hitPointMarked: 4,
  stressMarked: 3,
  armorMarked: 2,
  hopeHeld: 1,
  hopeCap: 6,
  focusHeld: 0,
  focusMax: 6,
  favor: 3,
  spellcastTrait: 2,
  spellcastTraitName: 'PRESENCE',
  instinct: 3,
  wolfFormActive: false,
};

function state(overrides: Partial<RestCharacterState> = {}): RestCharacterState {
  return { ...BASE_STATE, ...overrides };
}

/** Hands back the queued face values one call at a time, so every roll in a test is deterministic. */
function scriptedRoller(...batches: number[][]): RestDiceRoller {
  const queue = [...batches];
  return vi.fn((): readonly number[] => queue.shift() ?? [1]);
}

let nextKey = 0;
function pick(moveId: RestMoveId, overrides: Partial<RestSelection> = {}): RestSelection {
  return { key: `k${nextKey++}`, moveId, target: 'self', withParty: false, ...overrides };
}

describe('applyRestMoves', () => {
  describe('Tend to Wounds', () => {
    it('should clear Hit Points equal to the die plus tier', () => {
      const outcome = applyRestMoves('short', state(), [pick('tendToWounds')], scriptedRoller([1]));

      expect(outcome.changes.hitPointMarked).toBe(1);
    });

    it('should explain the roll in the summary', () => {
      const outcome = applyRestMoves('short', state(), [pick('tendToWounds')], scriptedRoller([3]));

      expect(outcome.summary[0].detail).toBe('rolled 3 + tier 2 = 5, cleared all 4 of your marked HP');
    });

    it('should never clear more Hit Points than are marked', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hitPointMarked: 2 }),
        [pick('tendToWounds')],
        scriptedRoller([4]),
      );

      expect(outcome.changes.hitPointMarked).toBe(0);
    });

    it('should say nothing cleared when no Hit Points are marked', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hitPointMarked: 0 }),
        [pick('tendToWounds')],
        scriptedRoller([4]),
      );

      expect(outcome.summary[0].detail).toBe('rolled 4 + tier 2 = 6, you had no marked HP, so nothing cleared');
    });

    it('should leave this sheet untouched when aimed at an ally', () => {
      const outcome = applyRestMoves(
        'short',
        state(),
        [pick('tendToWounds', { target: 'ally' })],
        scriptedRoller([3]),
      );

      expect(outcome.changes.hitPointMarked).toBe(4);
    });

    it('should still roll for an ally so the player knows what they cleared', () => {
      const roll = scriptedRoller([3]);

      const outcome = applyRestMoves('short', state(), [pick('tendToWounds', { target: 'ally' })], roll);

      expect(outcome.summary[0].detail).toContain('cleared up to 5 of an ally’s marked HP');
    });
  });

  describe('Clear Stress', () => {
    it('should clear Stress equal to the die plus tier', () => {
      const outcome = applyRestMoves('short', state(), [pick('clearStress')], scriptedRoller([1]));

      expect(outcome.changes.stressMarked).toBe(0);
    });

    it('should never clear more Stress than is marked', () => {
      const outcome = applyRestMoves(
        'short',
        state({ stressMarked: 1 }),
        [pick('clearStress')],
        scriptedRoller([4]),
      );

      expect(outcome.changes.stressMarked).toBe(0);
    });
  });

  describe('Repair Armor', () => {
    it('should clear Armor Slots equal to the die plus tier', () => {
      const outcome = applyRestMoves(
        'short',
        state({ armorMarked: 5 }),
        [pick('repairArmor')],
        scriptedRoller([1]),
      );

      expect(outcome.changes.armorMarked).toBe(2);
    });

    it('should leave this sheet untouched when aimed at an ally', () => {
      const outcome = applyRestMoves(
        'short',
        state(),
        [pick('repairArmor', { target: 'ally' })],
        scriptedRoller([3]),
      );

      expect(outcome.changes.armorMarked).toBe(2);
    });
  });

  describe('long rest clears', () => {
    it('should clear all Hit Points', () => {
      const outcome = applyRestMoves('long', state(), [pick('tendToAllWounds')], scriptedRoller());

      expect(outcome.changes.hitPointMarked).toBe(0);
    });

    it('should clear all Stress', () => {
      const outcome = applyRestMoves('long', state(), [pick('clearAllStress')], scriptedRoller());

      expect(outcome.changes.stressMarked).toBe(0);
    });

    it('should clear all Armor Slots', () => {
      const outcome = applyRestMoves('long', state(), [pick('repairAllArmor')], scriptedRoller());

      expect(outcome.changes.armorMarked).toBe(0);
    });

    it('should not roll any dice', () => {
      const roll = scriptedRoller();

      applyRestMoves('long', state(), [pick('tendToAllWounds')], roll);

      expect(roll).not.toHaveBeenCalled();
    });

    it('should leave this sheet untouched when Tend to All Wounds is aimed at an ally', () => {
      const outcome = applyRestMoves(
        'long',
        state(),
        [pick('tendToAllWounds', { target: 'ally' })],
        scriptedRoller(),
      );

      expect(outcome.changes.hitPointMarked).toBe(4);
    });

    it('should say nothing cleared when no Stress is marked', () => {
      const outcome = applyRestMoves(
        'long',
        state({ stressMarked: 0 }),
        [pick('clearAllStress')],
        scriptedRoller(),
      );

      expect(outcome.summary[0].detail).toBe('you had no marked Stress, so nothing cleared');
    });
  });

  describe('Prepare', () => {
    it('should gain one Hope alone', () => {
      const outcome = applyRestMoves('short', state(), [pick('prepare')], scriptedRoller());

      expect(outcome.changes.hopeHeld).toBe(2);
    });

    it('should gain two Hope when prepared with the party', () => {
      const outcome = applyRestMoves(
        'short',
        state(),
        [pick('prepare', { withParty: true })],
        scriptedRoller(),
      );

      expect(outcome.changes.hopeHeld).toBe(3);
    });

    it('should never push Hope past the cap', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hopeHeld: 5, hopeCap: 6 }),
        [pick('prepare', { withParty: true })],
        scriptedRoller(),
      );

      expect(outcome.changes.hopeHeld).toBe(6);
    });

    it('should gain nothing when Hope is already at the cap', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hopeHeld: 6, hopeCap: 6 }),
        [pick('prepare')],
        scriptedRoller(),
      );

      expect(outcome.summary[0].detail).toBe('you were already at your cap of 6 Hope, so you gained none');
    });

    it('should not reduce Hope that is somehow already over the cap', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hopeHeld: 8, hopeCap: 6 }),
        [pick('prepare')],
        scriptedRoller(),
      );

      expect(outcome.changes.hopeHeld).toBe(8);
    });
  });

  describe('Work on a Project', () => {
    it('should change nothing on the sheet', () => {
      const outcome = applyRestMoves('long', state(), [pick('workOnAProject')], scriptedRoller());

      expect(outcome.unchanged).toBe(true);
    });

    it('should still report the move as spent', () => {
      const outcome = applyRestMoves('long', state(), [pick('workOnAProject')], scriptedRoller());

      expect(outcome.summary[0].noChange).toBe(true);
    });
  });

  describe('Show tribute to your patron', () => {
    it('should gain Favor equal to the Spellcast trait', () => {
      const outcome = applyRestMoves('long', state(), [pick('showTribute')], scriptedRoller());

      expect(outcome.changes.favor).toBe(5);
    });

    it('should name the Spellcast trait in the summary', () => {
      const outcome = applyRestMoves('long', state(), [pick('showTribute')], scriptedRoller());

      expect(outcome.summary[0].detail).toBe('gained 2 Favor (Spellcast: PRESENCE) — Favor is now 5');
    });

    it('should gain nothing and say so when no Spellcast trait is recorded', () => {
      const outcome = applyRestMoves(
        'long',
        state({ spellcastTrait: null, spellcastTraitName: null }),
        [pick('showTribute')],
        scriptedRoller(),
      );

      expect(outcome.summary[0].detail).toBe(
        'no Spellcast trait is recorded on your subclass, so record the Favor by hand',
      );
    });

    it('should never lose Favor to a negative Spellcast trait', () => {
      const outcome = applyRestMoves(
        'long',
        state({ spellcastTrait: -1 }),
        [pick('showTribute')],
        scriptedRoller(),
      );

      expect(outcome.changes.favor).toBe(3);
    });
  });

  describe('Refocus', () => {
    it('should set Focus to the highest die rolled', () => {
      const outcome = applyRestMoves('short', state(), [pick('refocus')], scriptedRoller([2, 5, 3]));

      expect(outcome.changes.focusHeld).toBe(5);
    });

    it('should clamp Focus to focusMax', () => {
      const outcome = applyRestMoves(
        'short',
        state({ focusMax: 3 }),
        [pick('refocus')],
        scriptedRoller([6, 4]),
      );

      expect(outcome.changes.focusHeld).toBe(3);
    });

    it('should roll one die per point of Instinct', () => {
      const roll = scriptedRoller([1, 1, 1]);

      applyRestMoves('short', state({ instinct: 3 }), [pick('refocus')], roll);

      expect(roll).toHaveBeenCalledWith(6, 3);
    });

    it('should still roll one die when Instinct is zero or less', () => {
      const roll = scriptedRoller([4]);

      applyRestMoves('short', state({ instinct: 0 }), [pick('refocus')], roll);

      expect(roll).toHaveBeenCalledWith(6, 1);
    });

    it('should clear a Focus track that the roll cannot beat', () => {
      const outcome = applyRestMoves(
        'short',
        state({ focusHeld: 5, instinct: 1 }),
        [pick('refocus')],
        scriptedRoller([2]),
      );

      expect(outcome.changes.focusHeld).toBe(2);
    });
  });

  describe('taking the same move twice', () => {
    it('should apply both, threading state through', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hitPointMarked: 8, tier: 1 }),
        [pick('tendToWounds'), pick('tendToWounds')],
        scriptedRoller([1, 1], [2]),
      );

      expect(outcome.changes.hitPointMarked).toBe(3);
    });

    it('should produce one summary line per selection', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hitPointMarked: 8 }),
        [pick('tendToWounds'), pick('tendToWounds')],
        scriptedRoller([1], [2]),
      );

      expect(outcome.summary).toHaveLength(2);
    });

    it('should let the second clear see what the first already cleared', () => {
      const outcome = applyRestMoves(
        'short',
        state({ hitPointMarked: 4, tier: 1 }),
        [pick('tendToWounds'), pick('tendToWounds')],
        scriptedRoller([3], [3]),
      );

      expect(outcome.summary[1].detail).toBe('rolled 3 + tier 1 = 4, you had no marked HP, so nothing cleared');
    });
  });

  describe('Wolf Form', () => {
    it('should end an active Wolf Form on a short rest', () => {
      const outcome = applyRestMoves('short', state({ wolfFormActive: true }), [], scriptedRoller());

      expect(outcome.changes.wolfFormActive).toBe(false);
    });

    it('should end an active Wolf Form on a long rest', () => {
      const outcome = applyRestMoves('long', state({ wolfFormActive: true }), [], scriptedRoller());

      expect(outcome.changes.wolfFormActive).toBe(false);
    });

    it('should report it as bookkeeping rather than a move', () => {
      const outcome = applyRestMoves('short', state({ wolfFormActive: true }), [], scriptedRoller());

      expect(outcome.summary[0].moveKey).toBeNull();
    });

    it('should add no line when Wolf Form is not active', () => {
      const outcome = applyRestMoves('short', state(), [], scriptedRoller());

      expect(outcome.summary).toHaveLength(0);
    });

    it('should report last, after every downtime move', () => {
      const outcome = applyRestMoves(
        'short',
        state({ wolfFormActive: true }),
        [pick('prepare')],
        scriptedRoller(),
      );

      expect(outcome.summary.map(line => line.title)).toEqual(['Prepare', 'Wolf Form']);
    });
  });

  describe('unchanged', () => {
    it('should be true for a rest that moved nothing', () => {
      const outcome = applyRestMoves('short', state(), [], scriptedRoller());

      expect(outcome.unchanged).toBe(true);
    });

    it('should be false when Wolf Form ends even with no moves taken', () => {
      const outcome = applyRestMoves('short', state({ wolfFormActive: true }), [], scriptedRoller());

      expect(outcome.unchanged).toBe(false);
    });

    it('should be true when every chosen move was aimed at an ally', () => {
      const outcome = applyRestMoves(
        'short',
        state(),
        [pick('tendToWounds', { target: 'ally' }), pick('repairArmor', { target: 'ally' })],
        scriptedRoller([2], [2]),
      );

      expect(outcome.unchanged).toBe(true);
    });
  });

  describe('previous', () => {
    it('should report the pre-rest values so the save can send only what moved', () => {
      const outcome = applyRestMoves('short', state(), [pick('tendToWounds')], scriptedRoller([1]));

      expect(outcome.previous).toMatchObject({ hitPointMarked: 4, stressMarked: 3, favor: 3 });
    });

    it('should match the changes exactly for a rest that moved nothing', () => {
      const outcome = applyRestMoves('short', state(), [], scriptedRoller());

      expect(outcome.previous).toEqual(outcome.changes);
    });
  });

  it('should not mutate the state it was given', () => {
    const original = state();

    applyRestMoves('long', original, [pick('tendToAllWounds'), pick('prepare')], scriptedRoller());

    expect(original.hitPointMarked).toBe(4);
  });

  it('should carry the rest type through to the outcome', () => {
    const outcome = applyRestMoves('long', state(), [], scriptedRoller());

    expect(outcome.restType).toBe('long');
  });
});
