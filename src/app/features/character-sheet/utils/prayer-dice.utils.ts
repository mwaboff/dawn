import { PrayerDie } from '../../create-character/models/character-sheet-api.model';
import { DiceRollFn } from './focus-refresh.utils';

/** Prayer Dice are always d4s. */
const PRAYER_DIE_SIDES = 4;

/** The outcome of a Prayer Dice roll: the dice kept, plus what Devout discarded, if anything. */
export interface PrayerDiceRollResult {
  /** The dice placed on the sheet, all unspent. */
  readonly dice: readonly PrayerDie[];
  /** Every face rolled, including one dropped by Devout, so the roll can be explained. */
  readonly rolled: readonly number[];
  /** The face Devout discarded, or null when Devout was not applied. */
  readonly dropped: number | null;
}

const EMPTY_ROLL: PrayerDiceRollResult = { dice: [], rolled: [], dropped: null };

/**
 * Seraph "Prayer Dice": "At the beginning of each session, roll a number of d4s equal to your
 * subclass's Spellcast trait and place them on your character sheet."
 *
 * A Spellcast trait of 0 or less rolls no dice. That is the literal reading -- unlike
 * `rollFocusRefresh`, which floors at one die, the Prayer Dice text gives no minimum, so none is
 * invented here.
 *
 * Divine Wielder "Devout": "When you roll your Prayer Dice, you can roll an additional die and
 * discard the lowest result." When `useDevout` is set, this rolls one extra d4 and drops exactly
 * one lowest face -- a tie for lowest drops one die, not both.
 *
 * @param spellcastTrait the character's modified Spellcast trait value
 * @param useDevout whether to apply the Devout feature's extra die
 * @param roll the dice source, so callers supply the app's shared roller
 */
export function rollPrayerDice(
  spellcastTrait: number,
  useDevout: boolean,
  roll: DiceRollFn,
): PrayerDiceRollResult {
  const keep = Math.max(spellcastTrait, 0);
  if (keep === 0) return EMPTY_ROLL;

  const rolled = roll(PRAYER_DIE_SIDES, useDevout ? keep + 1 : keep);
  if (!useDevout) {
    return { dice: rolled.map(toReadyDie), rolled, dropped: null };
  }

  const lowestIndex = indexOfLowest(rolled);
  const kept = rolled.filter((_, index) => index !== lowestIndex);
  return { dice: kept.map(toReadyDie), rolled, dropped: rolled[lowestIndex] };
}

function toReadyDie(value: number): PrayerDie {
  return { value, spent: false };
}

/** Index of the first lowest face, so a tie discards exactly one die. */
function indexOfLowest(values: readonly number[]): number {
  return values.reduce(
    (lowest, value, index) => (value < values[lowest] ? index : lowest),
    0,
  );
}

/** Flips one die's spent state, returning a new list. Out-of-range indexes are a no-op. */
export function togglePrayerDieSpent(
  dice: readonly PrayerDie[],
  index: number,
): readonly PrayerDie[] {
  if (index < 0 || index >= dice.length) return dice;
  return dice.map((die, i) => (i === index ? { ...die, spent: !die.spent } : die));
}

/** How many dice are still available to spend. */
export function readyPrayerDiceCount(dice: readonly PrayerDie[]): number {
  return dice.filter(die => !die.spent).length;
}
