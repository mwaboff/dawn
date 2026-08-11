import { describe, it, expect } from 'vitest';
import { movesForRest, REST_MOVES, REST_MOVES_BY_ID } from './rest-catalog';
import { RestMoveAccess } from '../models/rest.model';

const NO_ACCESS: RestMoveAccess = { warlockResources: false, martialStances: false };
const ALL_ACCESS: RestMoveAccess = { warlockResources: true, martialStances: true };

function idsFor(...args: Parameters<typeof movesForRest>): string[] {
  return movesForRest(...args).map(move => move.id);
}

describe('movesForRest', () => {
  it('should offer the four short rest moves by default', () => {
    expect(idsFor('short', NO_ACCESS, false)).toEqual([
      'tendToWounds',
      'clearStress',
      'repairArmor',
      'prepare',
    ]);
  });

  it('should offer the five long rest moves by default', () => {
    expect(idsFor('long', NO_ACCESS, false)).toEqual([
      'tendToAllWounds',
      'clearAllStress',
      'repairAllArmor',
      'prepare',
      'workOnAProject',
    ]);
  });

  it('should offer Prepare on both rest types', () => {
    expect(idsFor('long', NO_ACCESS, false)).toContain('prepare');
  });

  it('should hide the Warlock move without Warlock resources', () => {
    expect(idsFor('short', NO_ACCESS, false)).not.toContain('showTribute');
  });

  it('should offer the Warlock move with Warlock resources', () => {
    expect(idsFor('short', { ...NO_ACCESS, warlockResources: true }, false)).toContain('showTribute');
  });

  it('should hide Refocus without martial stances', () => {
    expect(idsFor('short', NO_ACCESS, false)).not.toContain('refocus');
  });

  it('should offer Refocus with martial stances', () => {
    expect(idsFor('long', { ...NO_ACCESS, martialStances: true }, false)).toContain('refocus');
  });

  it('should union the long rest moves into a short rest when substitution is on', () => {
    expect(idsFor('short', NO_ACCESS, true)).toContain('tendToAllWounds');
  });

  it('should keep the short rest moves available alongside the substituted ones', () => {
    expect(idsFor('short', NO_ACCESS, true)).toContain('tendToWounds');
  });

  it('should ignore substitution on a long rest', () => {
    expect(idsFor('long', NO_ACCESS, true)).toEqual(idsFor('long', NO_ACCESS, false));
  });

  it('should never offer a class move through substitution alone', () => {
    expect(idsFor('short', NO_ACCESS, true)).not.toContain('refocus');
  });

  it('should offer every move to a Warlock Martial Artist substituting on a short rest', () => {
    expect(idsFor('short', ALL_ACCESS, true)).toHaveLength(REST_MOVES.length);
  });
});

describe('REST_MOVES_BY_ID', () => {
  it('should index every move', () => {
    expect(Object.keys(REST_MOVES_BY_ID)).toHaveLength(REST_MOVES.length);
  });

  it('should look a move up by id', () => {
    expect(REST_MOVES_BY_ID['prepare'].name).toBe('Prepare');
  });
});

describe('REST_MOVES', () => {
  it('should mark only Tend and Repair moves as ally-targetable', () => {
    expect(REST_MOVES.filter(move => move.targetable).map(move => move.id)).toEqual([
      'tendToWounds',
      'repairArmor',
      'tendToAllWounds',
      'repairAllArmor',
    ]);
  });

  it('should mark only Prepare as having a party option', () => {
    expect(REST_MOVES.filter(move => move.partyOption).map(move => move.id)).toEqual(['prepare']);
  });

  it('should give every move a unique id', () => {
    expect(new Set(REST_MOVES.map(move => move.id)).size).toBe(REST_MOVES.length);
  });
});
