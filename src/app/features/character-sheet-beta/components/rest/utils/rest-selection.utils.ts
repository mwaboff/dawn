import { RestMoveDefinition, RestMoveTarget, RestSelection } from '../models/rest.model';

let nextSelectionKey = 0;

/** Appends a move to the chosen list. Duplicates are legal -- you may take the same move twice. */
export function addSelection(
  list: readonly RestSelection[],
  move: RestMoveDefinition,
): readonly RestSelection[] {
  return [
    ...list,
    { key: `rest-move-${nextSelectionKey++}`, moveId: move.id, target: 'self', withParty: false },
  ];
}

export function removeSelection(list: readonly RestSelection[], key: string): readonly RestSelection[] {
  return list.filter(selection => selection.key !== key);
}

export function setSelectionTarget(
  list: readonly RestSelection[],
  key: string,
  target: RestMoveTarget,
): readonly RestSelection[] {
  return list.map(selection => (selection.key === key ? { ...selection, target } : selection));
}

export function setSelectionWithParty(
  list: readonly RestSelection[],
  key: string,
  withParty: boolean,
): readonly RestSelection[] {
  return list.map(selection => (selection.key === key ? { ...selection, withParty } : selection));
}

/** Drops trailing selections when the slot count shrinks below what is already chosen. */
export function trimSelections(list: readonly RestSelection[], slots: number): readonly RestSelection[] {
  return list.length <= slots ? list : list.slice(0, Math.max(slots, 0));
}

/**
 * Keeps only selections still legal for the current rest type, class access and substitution
 * state -- turning off "use a long-rest move" must not leave a long-rest move in a short rest.
 */
export function pruneIllegalSelections(
  list: readonly RestSelection[],
  legal: readonly RestMoveDefinition[],
): readonly RestSelection[] {
  const ids = new Set(legal.map(move => move.id));
  return list.filter(selection => ids.has(selection.moveId));
}
