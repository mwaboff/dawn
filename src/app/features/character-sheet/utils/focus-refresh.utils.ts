/** Rolls `count` dice with `sides` faces and returns each face value, in roll order. */
export type DiceRollFn = (sides: number, count: number) => readonly number[];

export interface FocusRefreshResult {
  /** Every d6 face rolled, so the caller can explain the roll. */
  readonly rolled: readonly number[];
  /** The highest single die -- not a sum. */
  readonly highest: number;
  /** `highest` clamped to `focusMax`; the value to store as `focusMarked`. */
  readonly focus: number;
}

/**
 * Martial Artist Focus: "Once per rest during a moment of calm, you can clear your mind and
 * refocus your martial instincts. Clear your Focus track, then roll a number of d6s equal to your
 * Instinct and gain Focus equal to the highest result rolled."
 *
 * An Instinct of 0 or less still rolls one die. That has always been `refreshFocus`'s behaviour and
 * the rules give no reading for "roll zero dice", so it is preserved here rather than changed while
 * moving the logic.
 */
export function rollFocusRefresh(
  instinct: number,
  focusMax: number,
  roll: DiceRollFn,
): FocusRefreshResult {
  const rolled = roll(6, Math.max(instinct, 1));
  const highest = Math.max(...rolled);
  return { rolled, highest, focus: Math.min(highest, Math.max(focusMax, 0)) };
}
