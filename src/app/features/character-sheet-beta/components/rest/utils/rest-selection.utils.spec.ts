import { describe, it, expect } from 'vitest';
import {
  addSelection,
  pruneIllegalSelections,
  removeSelection,
  setSelectionTarget,
  setSelectionWithParty,
  trimSelections,
} from './rest-selection.utils';
import { REST_MOVES_BY_ID } from './rest-catalog';
import { RestSelection } from '../models/rest.model';

const PREPARE = REST_MOVES_BY_ID['prepare'];
const TEND = REST_MOVES_BY_ID['tendToWounds'];
const TEND_ALL = REST_MOVES_BY_ID['tendToAllWounds'];

describe('addSelection', () => {
  it('should append the move to the list', () => {
    expect(addSelection([], PREPARE).map(s => s.moveId)).toEqual(['prepare']);
  });

  it('should default a new selection to self', () => {
    expect(addSelection([], TEND)[0].target).toBe('self');
  });

  it('should default a new selection to preparing alone', () => {
    expect(addSelection([], PREPARE)[0].withParty).toBe(false);
  });

  it('should allow the same move twice', () => {
    const list = addSelection(addSelection([], PREPARE), PREPARE);

    expect(list).toHaveLength(2);
  });

  it('should give duplicate moves distinct keys', () => {
    const list = addSelection(addSelection([], PREPARE), PREPARE);

    expect(list[0].key).not.toBe(list[1].key);
  });

  it('should not mutate the list it was given', () => {
    const original: readonly RestSelection[] = [];

    addSelection(original, PREPARE);

    expect(original).toHaveLength(0);
  });
});

describe('removeSelection', () => {
  it('should drop only the matching key', () => {
    const list = addSelection(addSelection([], PREPARE), TEND);

    expect(removeSelection(list, list[0].key).map(s => s.moveId)).toEqual(['tendToWounds']);
  });

  it('should leave the list alone for an unknown key', () => {
    const list = addSelection([], PREPARE);

    expect(removeSelection(list, 'nope')).toHaveLength(1);
  });
});

describe('setSelectionTarget', () => {
  it('should retarget only the matching selection', () => {
    const list = addSelection(addSelection([], TEND), TEND);

    const updated = setSelectionTarget(list, list[0].key, 'ally');

    expect(updated.map(s => s.target)).toEqual(['ally', 'self']);
  });
});

describe('setSelectionWithParty', () => {
  it('should set the party flag on the matching selection', () => {
    const list = addSelection([], PREPARE);

    expect(setSelectionWithParty(list, list[0].key, true)[0].withParty).toBe(true);
  });
});

describe('trimSelections', () => {
  it('should leave the list alone when it fits the slots', () => {
    const list = addSelection([], PREPARE);

    expect(trimSelections(list, 2)).toBe(list);
  });

  it('should drop trailing selections when slots shrink', () => {
    const list = addSelection(addSelection(addSelection([], PREPARE), TEND), PREPARE);

    expect(trimSelections(list, 2)).toHaveLength(2);
  });

  it('should keep the earliest selections when trimming', () => {
    const list = addSelection(addSelection([], PREPARE), TEND);

    expect(trimSelections(list, 1).map(s => s.moveId)).toEqual(['prepare']);
  });

  it('should empty the list for a slot count of zero', () => {
    const list = addSelection([], PREPARE);

    expect(trimSelections(list, 0)).toHaveLength(0);
  });
});

describe('pruneIllegalSelections', () => {
  it('should drop a move that is no longer offered', () => {
    const list = addSelection(addSelection([], TEND), TEND_ALL);

    expect(pruneIllegalSelections(list, [TEND]).map(s => s.moveId)).toEqual(['tendToWounds']);
  });

  it('should keep every selection when all are still legal', () => {
    const list = addSelection([], TEND);

    expect(pruneIllegalSelections(list, [TEND, TEND_ALL])).toHaveLength(1);
  });

  it('should empty the list when nothing is legal', () => {
    const list = addSelection([], TEND);

    expect(pruneIllegalSelections(list, [])).toHaveLength(0);
  });
});
