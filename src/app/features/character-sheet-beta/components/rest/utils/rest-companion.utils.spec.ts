import { describe, it, expect, vi } from 'vitest';
import { applyRestMoves, RestDiceRoller } from './rest.utils';
import { creatureComfortCandidates, isCompanionDowned } from './rest-companion.utils';
import {
  CreatureComfortChoices,
  RestCharacterState,
  RestCompanionState,
  RestMoveId,
  RestSelection,
} from '../models/rest.model';

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
  companions: [],
};

function companion(overrides: Partial<RestCompanionState> = {}): RestCompanionState {
  return { id: 1, name: 'Rex', stressMarked: 0, stressMax: 3, hasCreatureComfort: false, ...overrides };
}

function state(overrides: Partial<RestCharacterState> = {}): RestCharacterState {
  return { ...BASE_STATE, ...overrides };
}

function scriptedRoller(...batches: number[][]): RestDiceRoller {
  const queue = [...batches];
  return vi.fn((): readonly number[] => queue.shift() ?? [1]);
}

let nextKey = 0;
function pick(moveId: RestMoveId): RestSelection {
  return { key: `k${nextKey++}`, moveId, target: 'self', withParty: false };
}

function rest(
  restType: 'short' | 'long',
  current: RestCharacterState,
  moves: RestSelection[],
  roll: RestDiceRoller = scriptedRoller(),
  comforts: CreatureComfortChoices = {},
) {
  return applyRestMoves(restType, current, moves, roll, comforts);
}

/** The stress a named companion is left on after a rest. */
function stressOf(outcome: ReturnType<typeof rest>, id: number): number {
  return outcome.nextState.companions.find(entry => entry.id === id)!.stressMarked;
}

describe('isCompanionDowned', () => {
  it('is false while a Stress slot remains', () => {
    expect(isCompanionDowned(companion({ stressMarked: 2, stressMax: 3 }))).toBe(false);
  });

  it('is true once the last Stress is marked', () => {
    expect(isCompanionDowned(companion({ stressMarked: 3, stressMax: 3 }))).toBe(true);
  });

  /** The backend does not clamp `stressMarked` to the max, so an over-marked track still counts. */
  it('is true when somehow marked past the maximum', () => {
    expect(isCompanionDowned(companion({ stressMarked: 5, stressMax: 3 }))).toBe(true);
  });
});

describe('sympathetic Stress clearing', () => {
  it('clears the rolled number on the companion, not the number that came off the character', () => {
    const outcome = rest(
      'short',
      state({ stressMarked: 1, companions: [companion({ stressMarked: 3, stressMax: 5 })] }),
      [pick('clearStress')],
      scriptedRoller([3]),
    );

    expect(outcome.changes.stressMarked).toBe(0);
    expect(stressOf(outcome, 1)).toBe(0);
  });

  it('helps the companion even when the character has no marked Stress of their own', () => {
    const outcome = rest(
      'short',
      state({ stressMarked: 0, companions: [companion({ stressMarked: 3, stressMax: 5 })] }),
      [pick('clearStress')],
      scriptedRoller([1]),
    );

    expect(stressOf(outcome, 1)).toBe(0);
  });

  it('clears the whole companion track on Clear All Stress', () => {
    const outcome = rest(
      'long',
      state({ companions: [companion({ stressMarked: 4, stressMax: 5 })] }),
      [pick('clearAllStress')],
    );

    expect(stressOf(outcome, 1)).toBe(0);
  });

  it('clears on every companion, not just the first', () => {
    const outcome = rest(
      'short',
      state({
        companions: [
          companion({ id: 1, stressMarked: 2, stressMax: 4 }),
          companion({ id: 2, name: 'Mote', stressMarked: 3, stressMax: 4 }),
        ],
      }),
      [pick('clearStress')],
      scriptedRoller([1]),
    );

    expect(stressOf(outcome, 1)).toBe(0);
    expect(stressOf(outcome, 2)).toBe(0);
  });

  it('skips a companion that is out of the scene on a short rest', () => {
    const outcome = rest(
      'short',
      state({ companions: [companion({ stressMarked: 3, stressMax: 3 })] }),
      [pick('clearStress')],
      scriptedRoller([4]),
    );

    expect(stressOf(outcome, 1)).toBe(3);
    expect(outcome.summary[0].detail).toContain('Rex is out of the scene');
  });

  it('names what each companion cleared in the summary', () => {
    const outcome = rest(
      'short',
      state({ companions: [companion({ stressMarked: 2, stressMax: 4 })] }),
      [pick('clearStress')],
      scriptedRoller([1]),
    );

    expect(outcome.summary[0].detail).toContain('Rex cleared 2');
  });

  it('reports a rest as changed when only the companion moved', () => {
    const outcome = rest(
      'short',
      state({ stressMarked: 0, companions: [companion({ stressMarked: 2, stressMax: 4 })] }),
      [pick('clearStress')],
      scriptedRoller([1]),
    );

    expect(outcome.unchanged).toBe(false);
    expect(outcome.companionChanges).toEqual([{ id: 1, stressMarked: 0 }]);
  });

  it('leaves companions alone for a move that clears no Stress', () => {
    const outcome = rest(
      'short',
      state({ companions: [companion({ stressMarked: 2, stressMax: 4 })] }),
      [pick('tendToWounds')],
      scriptedRoller([2]),
    );

    expect(stressOf(outcome, 1)).toBe(2);
    expect(outcome.companionChanges).toEqual([]);
  });
});

describe('returning a downed companion', () => {
  it('clears 1 Stress on a long rest', () => {
    const outcome = rest('long', state({ companions: [companion({ stressMarked: 3, stressMax: 3 })] }), []);

    expect(stressOf(outcome, 1)).toBe(2);
    expect(outcome.summary[0].title).toBe('Companions return');
  });

  it('does not return them on a short rest', () => {
    const outcome = rest('short', state({ companions: [companion({ stressMarked: 3, stressMax: 3 })] }), []);

    expect(stressOf(outcome, 1)).toBe(3);
    expect(outcome.unchanged).toBe(true);
  });

  it('leaves an available companion untouched', () => {
    const outcome = rest('long', state({ companions: [companion({ stressMarked: 1, stressMax: 3 })] }), []);

    expect(stressOf(outcome, 1)).toBe(1);
    expect(outcome.summary).toEqual([]);
  });

  /** They return at the START of the long rest, so the downtime that follows reaches them. */
  it('makes them eligible for that same long rest’s sympathetic clearing', () => {
    const outcome = rest(
      'long',
      state({ companions: [companion({ stressMarked: 3, stressMax: 3 })] }),
      [pick('clearAllStress')],
    );

    expect(stressOf(outcome, 1)).toBe(0);
  });

  it('returns every downed companion at once', () => {
    const outcome = rest(
      'long',
      state({
        companions: [
          companion({ id: 1, stressMarked: 3, stressMax: 3 }),
          companion({ id: 2, name: 'Mote', stressMarked: 4, stressMax: 4 }),
        ],
      }),
      [],
    );

    expect(stressOf(outcome, 1)).toBe(2);
    expect(stressOf(outcome, 2)).toBe(3);
    expect(outcome.summary[0].detail).toContain('Rex and Mote');
  });
});

describe('Creature Comfort', () => {
  const trained = companion({ hasCreatureComfort: true, stressMarked: 2, stressMax: 4 });

  it('grants a Hope when that is the choice', () => {
    const outcome = rest('short', state({ companions: [trained] }), [], scriptedRoller(), { 1: 'hope' });

    expect(outcome.changes.hopeHeld).toBe(2);
    expect(stressOf(outcome, 1)).toBe(2);
  });

  it('clears one Stress on each of the pair when that is the choice', () => {
    const outcome = rest('short', state({ companions: [trained] }), [], scriptedRoller(), { 1: 'stress' });

    expect(outcome.changes.stressMarked).toBe(2);
    expect(stressOf(outcome, 1)).toBe(1);
  });

  it('does nothing when no choice was made', () => {
    const outcome = rest('short', state({ companions: [trained] }), []);

    expect(outcome.unchanged).toBe(true);
  });

  it('reports honestly when Hope is already at the cap', () => {
    const outcome = rest('short', state({ hopeHeld: 6, companions: [trained] }), [], scriptedRoller(), {
      1: 'hope',
    });

    expect(outcome.summary[0].noChange).toBe(true);
    expect(outcome.summary[0].detail).toContain('already at your cap');
  });

  it('still helps the companion when the character has no Stress marked', () => {
    const outcome = rest('short', state({ stressMarked: 0, companions: [trained] }), [], scriptedRoller(), {
      1: 'stress',
    });

    expect(stressOf(outcome, 1)).toBe(1);
    expect(outcome.summary[0].detail).toContain('Rex cleared 1 Stress; you had none marked');
  });

  it('ignores an election for a companion that is out of the scene on a short rest', () => {
    const downed = companion({ hasCreatureComfort: true, stressMarked: 3, stressMax: 3 });
    const outcome = rest('short', state({ companions: [downed] }), [], scriptedRoller(), { 1: 'stress' });

    expect(stressOf(outcome, 1)).toBe(3);
    expect(outcome.unchanged).toBe(true);
  });

  /** Silently dropping a choice the player made is worse than saying why it didn't land. */
  it('says why a dropped election did nothing rather than vanishing', () => {
    const downed = companion({ hasCreatureComfort: true, stressMarked: 3, stressMax: 3 });
    const outcome = rest('short', state({ companions: [downed] }), [], scriptedRoller(), { 1: 'stress' });

    expect(outcome.summary[0].detail).toContain('still out of the scene');
    expect(outcome.summary[0].noChange).toBe(true);
  });

  /**
   * The backend does not clamp `stressMarked` to the max, so a companion marked PAST its max is
   * not un-downed by the long rest's single clear -- the one path where the modal offers a choice
   * that then cannot land.
   */
  it('explains an election that a long rest’s return could not enable', () => {
    const overMarked = companion({ hasCreatureComfort: true, stressMarked: 5, stressMax: 3 });
    const outcome = rest('long', state({ companions: [overMarked] }), [], scriptedRoller(), { 1: 'stress' });

    expect(stressOf(outcome, 1)).toBe(4);
    expect(outcome.summary[1].detail).toContain('still out of the scene');
  });

  /** The long rest returns them first, which is exactly what makes the election legal. */
  it('honours an election for a companion the long rest brings back', () => {
    const downed = companion({ hasCreatureComfort: true, stressMarked: 3, stressMax: 3 });
    const outcome = rest('long', state({ companions: [downed] }), [], scriptedRoller(), { 1: 'stress' });

    expect(stressOf(outcome, 1)).toBe(1);
  });

  it('gives each trained companion its own once-per-rest use', () => {
    const outcome = rest(
      'short',
      state({
        stressMarked: 3,
        companions: [
          companion({ id: 1, hasCreatureComfort: true, stressMarked: 2, stressMax: 4 }),
          companion({ id: 2, name: 'Mote', hasCreatureComfort: true, stressMarked: 2, stressMax: 4 }),
        ],
      }),
      [],
      scriptedRoller(),
      { 1: 'stress', 2: 'stress' },
    );

    expect(stressOf(outcome, 1)).toBe(1);
    expect(stressOf(outcome, 2)).toBe(1);
    expect(outcome.changes.stressMarked).toBe(1);
  });

  it('resolves after the downtime moves, so a filled Hope cap is reported not swallowed', () => {
    const outcome = rest(
      'short',
      state({ hopeHeld: 5, companions: [trained] }),
      [pick('prepare')],
      scriptedRoller(),
      { 1: 'hope' },
    );

    expect(outcome.changes.hopeHeld).toBe(6);
    expect(outcome.summary[1].noChange).toBe(true);
  });
});

describe('creatureComfortCandidates', () => {
  it('offers nothing for a companion without the training', () => {
    expect(creatureComfortCandidates([companion()], 'short')).toEqual([]);
  });

  it('offers a trained, available companion on either rest', () => {
    const trained = companion({ hasCreatureComfort: true });

    expect(creatureComfortCandidates([trained], 'short')).toHaveLength(1);
    expect(creatureComfortCandidates([trained], 'long')).toHaveLength(1);
  });

  it('withholds a downed companion on a short rest but offers it on a long one', () => {
    const downed = companion({ hasCreatureComfort: true, stressMarked: 3, stressMax: 3 });

    expect(creatureComfortCandidates([downed], 'short')).toEqual([]);
    expect(creatureComfortCandidates([downed], 'long')).toHaveLength(1);
  });
});
