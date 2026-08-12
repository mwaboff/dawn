import {
  CreatureComfortChoices,
  RestCharacterState,
  RestCompanionChange,
  RestCompanionState,
  RestSummaryLine,
} from '../models/rest.model';
import { clearMarked, gainCapped } from './rest-track.utils';

/**
 * How much Stress a downed companion gets back at the start of a long rest: core-01:1343, "they
 * return with 1 Stress cleared". There is no separate downed flag -- marking the last Stress IS the
 * state, and clearing one is what ends it.
 */
const LONG_REST_RETURN_CLEAR = 1;

/** Creature Comfort clears exactly one Stress on each of the pair, or grants exactly one Hope. */
const CREATURE_COMFORT_AMOUNT = 1;

/**
 * A companion is out of the scene once it has marked its last Stress -- core-01:1343, "When they
 * mark their last Stress, they drop out of the scene (by hiding, fleeing, or a similar action).
 * They remain unavailable until the start of your next long rest."
 *
 * Mirrors the backend's `CompanionDerivationService.outOfScene` rather than reading
 * `CompanionApiResponse.outOfScene`, because a rest clears Stress in stages: a companion returned
 * by the long-rest rule is available for the downtime moves that follow it, and only a derived
 * predicate stays true through that.
 */
export function isCompanionDowned(companion: RestCompanionState): boolean {
  return companion.stressMarked >= companion.stressMax;
}

/**
 * Which companions may be offered a Creature Comfort choice for a rest of this type.
 *
 * A downed companion is unavailable through a whole short rest, so it is offered nothing. On a long
 * rest it returns before any downtime happens, so it is offered the choice on the strength of the
 * Stress the return will clear.
 */
export function creatureComfortCandidates(
  companions: readonly RestCompanionState[],
  restType: 'short' | 'long',
): readonly RestCompanionState[] {
  return companions.filter(
    companion =>
      companion.hasCreatureComfort && (restType === 'long' || !isCompanionDowned(companion)),
  );
}

/**
 * The long rest's opening bookkeeping: every companion that is out of the scene returns with one
 * Stress cleared. Not a downtime move and not optional -- it happens "at the start of your next
 * long rest" whether or not the character spends a move on anything.
 */
export function returnDownedCompanions(state: RestCharacterState): {
  readonly state: RestCharacterState;
  readonly line: RestSummaryLine | null;
} {
  const returning = state.companions.filter(isCompanionDowned);
  if (returning.length === 0) return { state, line: null };

  const companions = state.companions.map(companion =>
    isCompanionDowned(companion)
      ? { ...companion, stressMarked: clearMarked(companion.stressMarked, LONG_REST_RETURN_CLEAR).next }
      : companion,
  );

  const names = joinNames(returning.map(companion => companion.name));
  const one = returning.length === 1;
  return {
    state: { ...state, companions },
    line: {
      moveKey: null,
      title: 'Companions return',
      detail: `${names} ${one ? 'returns' : 'return'} from being out of the scene with 1 Stress cleared${one ? '' : ' each'}`,
      noChange: false,
    },
  };
}

/**
 * Sympathetic Stress clearing: core-01:1345, "When you choose a downtime move that clears Stress on
 * yourself, your companion clears an equal number of Stress." Automatic, costs no extra downtime
 * move, and applies to Clear Stress and Clear All Stress alike.
 *
 * `amount` is the number the MOVE names -- the rolled 1d4 + tier, or `Infinity` for Clear All Stress
 * -- not the number that happened to come off the character's own track. A character already at
 * zero Stress still blows off steam with their companion.
 *
 * With more than one companion (a house rule this site allows; the printed sheet assumes exactly
 * one) every companion still present clears that same number. A companion out of the scene is not
 * there to receive it.
 */
export function clearCompanionStress(
  companions: readonly RestCompanionState[],
  amount: number,
): {
  readonly companions: readonly RestCompanionState[];
  readonly detail: string;
  /** Total Stress cleared across every companion, so the caller can tell a no-op from a change. */
  readonly cleared: number;
} {
  if (companions.length === 0) return { companions, detail: '', cleared: 0 };

  const fragments: string[] = [];
  let total = 0;
  const next = companions.map(companion => {
    if (isCompanionDowned(companion)) {
      fragments.push(`${companion.name} is out of the scene`);
      return companion;
    }
    const { next: stressMarked, cleared } = clearMarked(companion.stressMarked, amount);
    total += cleared;
    fragments.push(
      cleared === 0
        ? `${companion.name} had no marked Stress`
        : `${companion.name} cleared ${cleared}`,
    );
    return { ...companion, stressMarked };
  });

  return { companions: next, detail: `; ${fragments.join(', ')}`, cleared: total };
}

/**
 * Creature Comfort, one companion at a time: "Once per rest, when you take time during a quiet
 * moment to give your companion love and attention, you can gain a Hope or you can both clear a
 * Stress" (core-01:1355).
 *
 * Not a downtime move -- it spends no slot -- so it is resolved here rather than as a resolver in
 * the move table. Each companion holding the training gets its own once-per-rest use, which is what
 * the multi-companion house rule implies and what the modal offers.
 *
 * Resolved after the downtime moves, so the Hope option reports honestly when Prepare has already
 * filled the cap rather than silently swallowing the choice.
 */
export function applyCreatureComfort(
  state: RestCharacterState,
  choices: CreatureComfortChoices,
): { readonly state: RestCharacterState; readonly lines: readonly RestSummaryLine[] } {
  const lines: RestSummaryLine[] = [];
  let current = state;

  for (const companion of state.companions) {
    const choice = choices[companion.id];
    if (!choice) continue;

    // Re-read the companion from `current`: an earlier move may have cleared its Stress, and a
    // long rest's return may have brought it back since `choices` was elected in the modal.
    const live = current.companions.find(entry => entry.id === companion.id);
    // An election can only exist for a companion the modal offered, which means one holding the
    // training. A companion that has since lost it has nothing to explain, so it drops silently.
    if (!live || !live.hasCreatureComfort) continue;

    // The modal offers a long rest's downed companions this choice on the strength of the Stress
    // the return will clear. Clearing 1 un-downs any legal companion, but the backend does not
    // clamp `stressMarked` to the max, so one marked PAST its max is still out of the scene here.
    // Saying so beats dropping an election the player made with no explanation.
    if (isCompanionDowned(live)) {
      lines.push({
        moveKey: null,
        title: `Creature Comfort (${live.name})`,
        detail: 'they are still out of the scene, so the quiet moment never happened',
        noChange: true,
      });
      continue;
    }

    if (choice === 'hope') {
      const { next, gained } = gainCapped(current.hopeHeld, CREATURE_COMFORT_AMOUNT, current.hopeCap);
      current = { ...current, hopeHeld: next };
      lines.push({
        moveKey: null,
        title: `Creature Comfort (${live.name})`,
        detail:
          gained === 0
            ? `you were already at your cap of ${current.hopeCap} Hope, so you gained none`
            : `a quiet moment together — gained 1 Hope, now ${next} of ${current.hopeCap}`,
        noChange: gained === 0,
      });
      continue;
    }

    const mine = clearMarked(current.stressMarked, CREATURE_COMFORT_AMOUNT);
    const theirs = clearMarked(live.stressMarked, CREATURE_COMFORT_AMOUNT);
    current = {
      ...current,
      stressMarked: mine.next,
      companions: current.companions.map(entry =>
        entry.id === live.id ? { ...entry, stressMarked: theirs.next } : entry,
      ),
    };
    lines.push({
      moveKey: null,
      title: `Creature Comfort (${live.name})`,
      detail: `a quiet moment together — ${describeShared(mine.cleared, theirs.cleared, live.name)}`,
      noChange: mine.cleared === 0 && theirs.cleared === 0,
    });
  }

  return { state: current, lines };
}

/** The four ways "you can both clear a Stress" can land when one of you has nothing to clear. */
function describeShared(mine: number, theirs: number, name: string): string {
  if (mine > 0 && theirs > 0) return `you and ${name} each cleared 1 Stress`;
  if (mine > 0) return `you cleared 1 Stress; ${name} had none marked`;
  if (theirs > 0) return `${name} cleared 1 Stress; you had none marked`;
  return 'neither of you had marked Stress, so nothing cleared';
}

/** Only the companions whose Stress actually moved -- each one is its own PUT. */
export function toCompanionChanges(
  before: readonly RestCompanionState[],
  after: readonly RestCompanionState[],
): readonly RestCompanionChange[] {
  return after
    .map(companion => {
      const previous = before.find(entry => entry.id === companion.id);
      return previous && previous.stressMarked !== companion.stressMarked
        ? { id: companion.id, stressMarked: companion.stressMarked }
        : null;
    })
    .filter((change): change is RestCompanionChange => change !== null);
}

/** "Rex", "Rex and Mote", "Rex, Mote and Pip". */
function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
