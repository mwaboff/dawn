import { DiceRollFn, rollFocusRefresh } from '../../../../character-sheet/utils/focus-refresh.utils';
import {
  CreatureComfortChoices,
  RestCharacterState,
  RestMoveId,
  RestOutcome,
  RestResourceChanges,
  RestSelection,
  RestSummaryLine,
  RestType,
} from '../models/rest.model';
import {
  applyCreatureComfort,
  clearCompanionStress,
  returnDownedCompanions,
  toCompanionChanges,
} from './rest-companion.utils';
import { clearMarked, gainCapped } from './rest-track.utils';

/** Injected so `applyRestMoves` stays pure and specs can script the dice. */
export type RestDiceRoller = DiceRollFn;

interface ResolvedMove {
  readonly state: RestCharacterState;
  readonly title: string;
  readonly detail: string;
  readonly noChange: boolean;
}

function clearedDetail(prefix: string, cleared: number, before: number, label: string): string {
  if (before === 0) return `${prefix}you had no marked ${label}, so nothing cleared`;
  if (cleared < before) return `${prefix}cleared ${cleared} of your ${before} marked ${label}`;
  return `${prefix}cleared all ${before} of your marked ${label}`;
}

function clearedAllDetail(cleared: number, label: string): string {
  return cleared === 0
    ? `you had no marked ${label}, so nothing cleared`
    : `cleared all ${cleared} of your marked ${label}`;
}

/** 1d4 + tier, with the sentence fragment that explains it. */
function tierPool(
  state: RestCharacterState,
  roll: RestDiceRoller,
): { readonly amount: number; readonly prefix: string } {
  const [die] = roll(4, 1);
  const amount = die + state.tier;
  return { amount, prefix: `rolled ${die} + tier ${state.tier} = ${amount}, ` };
}

type RestMoveResolver = (
  state: RestCharacterState,
  selection: RestSelection,
  roll: RestDiceRoller,
) => ResolvedMove;

const RESOLVERS: Readonly<Record<RestMoveId, RestMoveResolver>> = {
  tendToWounds: (state, selection, roll) => {
    const { amount, prefix } = tierPool(state, roll);
    const title = 'Tend to Wounds';
    if (selection.target === 'ally') {
      return {
        state,
        title,
        noChange: true,
        detail: `${prefix}cleared up to ${amount} of an ally’s marked HP — nothing changed here`,
      };
    }
    const { next, cleared } = clearMarked(state.hitPointMarked, amount);
    return {
      state: { ...state, hitPointMarked: next },
      title,
      noChange: cleared === 0,
      detail: clearedDetail(prefix, cleared, state.hitPointMarked, 'HP'),
    };
  },

  // Sympathetic clearing passes the ROLLED number, not the number that came off this character's
  // own track -- see `clearCompanionStress`.
  clearStress: (state, _selection, roll) => {
    const { amount, prefix } = tierPool(state, roll);
    const { next, cleared } = clearMarked(state.stressMarked, amount);
    const sympathetic = clearCompanionStress(state.companions, amount);
    return {
      state: { ...state, stressMarked: next, companions: sympathetic.companions },
      title: 'Clear Stress',
      noChange: cleared === 0 && sympathetic.cleared === 0,
      detail: clearedDetail(prefix, cleared, state.stressMarked, 'Stress') + sympathetic.detail,
    };
  },

  repairArmor: (state, selection, roll) => {
    const { amount, prefix } = tierPool(state, roll);
    const title = 'Repair Armor';
    if (selection.target === 'ally') {
      return {
        state,
        title,
        noChange: true,
        detail: `${prefix}cleared up to ${amount} of an ally’s Armor Slots — nothing changed here`,
      };
    }
    const { next, cleared } = clearMarked(state.armorMarked, amount);
    return {
      state: { ...state, armorMarked: next },
      title,
      noChange: cleared === 0,
      detail: clearedDetail(prefix, cleared, state.armorMarked, 'Armor Slots'),
    };
  },

  tendToAllWounds: (state, selection) => {
    const title = 'Tend to All Wounds';
    if (selection.target === 'ally') {
      return { state, title, noChange: true, detail: 'cleared all of an ally’s Hit Points — nothing changed here' };
    }
    const cleared = state.hitPointMarked;
    return {
      state: { ...state, hitPointMarked: 0 },
      title,
      noChange: cleared === 0,
      detail: clearedAllDetail(cleared, 'HP'),
    };
  },

  // "Clear All Stress" names no number, so the equal number a companion clears is likewise all of
  // theirs -- `Infinity` is how `clearMarked` expresses that without a second code path.
  clearAllStress: state => {
    const cleared = state.stressMarked;
    const sympathetic = clearCompanionStress(state.companions, Infinity);
    return {
      state: { ...state, stressMarked: 0, companions: sympathetic.companions },
      title: 'Clear All Stress',
      noChange: cleared === 0 && sympathetic.cleared === 0,
      detail: clearedAllDetail(cleared, 'Stress') + sympathetic.detail,
    };
  },

  repairAllArmor: (state, selection) => {
    const title = 'Repair All Armor';
    if (selection.target === 'ally') {
      return { state, title, noChange: true, detail: 'cleared all of an ally’s Armor Slots — nothing changed here' };
    }
    const cleared = state.armorMarked;
    return {
      state: { ...state, armorMarked: 0 },
      title,
      noChange: cleared === 0,
      detail: clearedAllDetail(cleared, 'Armor Slots'),
    };
  },

  prepare: (state, selection) => {
    const { next, gained } = gainCapped(state.hopeHeld, selection.withParty ? 2 : 1, state.hopeCap);
    const how = selection.withParty ? ' (prepared with the party)' : '';
    const detail =
      gained === 0
        ? `you were already at your cap of ${state.hopeCap} Hope, so you gained none${how}`
        : `gained ${gained} Hope${how} — Hope is now ${next} of ${state.hopeCap}`;
    return { state: { ...state, hopeHeld: next }, title: 'Prepare', noChange: gained === 0, detail };
  },

  workOnAProject: state => ({
    state,
    title: 'Work on a Project',
    noChange: true,
    detail: 'you spent the downtime on your project — nothing on the sheet changed',
  }),

  showTribute: state => {
    const title = 'Show tribute to your patron';
    if (state.spellcastTrait === null) {
      return {
        state,
        title,
        noChange: true,
        detail: 'no Spellcast trait is recorded on your subclass, so record the Favor by hand',
      };
    }
    const gained = Math.max(0, state.spellcastTrait);
    const next = state.favor + gained;
    const named = state.spellcastTraitName ? ` (Spellcast: ${state.spellcastTraitName})` : '';
    const detail =
      gained === 0
        ? `your Spellcast trait is ${state.spellcastTrait}${named}, so you gained no Favor`
        : `gained ${gained} Favor${named} — Favor is now ${next}`;
    return { state: { ...state, favor: next }, title, noChange: gained === 0, detail };
  },

  refocus: (state, _selection, roll) => {
    const result = rollFocusRefresh(state.instinct, state.focusMax, roll);
    return {
      state: { ...state, focusHeld: result.focus },
      title: 'Refocus',
      noChange: result.focus === state.focusHeld,
      detail:
        `cleared your Focus, rolled ${result.rolled.join(', ')} on ${result.rolled.length}d6 ` +
        `and took the highest — Focus is now ${result.focus}`,
    };
  },
};

function toChanges(state: RestCharacterState): RestResourceChanges {
  return {
    hitPointMarked: state.hitPointMarked,
    stressMarked: state.stressMarked,
    armorMarked: state.armorMarked,
    hopeHeld: state.hopeHeld,
    focusHeld: state.focusHeld,
    favor: state.favor,
    wolfFormActive: state.wolfFormActive,
  };
}

/**
 * Resolves a whole rest.
 *
 * Selections are applied in order, threading state through, so two Tend to Wounds in a row
 * correctly see the HP the first one already cleared. `roll` is called exactly once per rolling
 * move and never for a move that rolls nothing.
 *
 * Companion bookkeeping brackets the downtime moves, in the order the rules put it:
 *
 * 1. On a long rest ONLY, every companion out of the scene returns with 1 Stress cleared. This is
 *    "the start of your next long rest" (core-01:1343), so it lands before any move and a returned
 *    companion is present for the sympathetic clearing that follows.
 * 2. The moves themselves; Clear Stress and Clear All Stress carry companions along.
 * 3. Creature Comfort, which is not a downtime move and spends no slot.
 *
 * `comforts` trails `roll` and defaults to "none elected" because the overwhelming majority of
 * rests have no companion to elect for, and every caller that predates companions reads correctly
 * against that default.
 */
export function applyRestMoves(
  restType: RestType,
  state: RestCharacterState,
  selections: readonly RestSelection[],
  roll: RestDiceRoller,
  comforts: CreatureComfortChoices = {},
): RestOutcome {
  const summary: RestSummaryLine[] = [];
  let current = state;

  if (restType === 'long') {
    const returned = returnDownedCompanions(current);
    current = returned.state;
    if (returned.line) summary.push(returned.line);
  }

  for (const selection of selections) {
    const resolved = RESOLVERS[selection.moveId](current, selection, roll);
    current = resolved.state;
    summary.push({
      moveKey: selection.key,
      title: resolved.title,
      detail: resolved.detail,
      noChange: resolved.noChange,
    });
  }

  const comforted = applyCreatureComfort(current, comforts);
  current = comforted.state;
  summary.push(...comforted.lines);

  // Automatic bookkeeping: not downtime moves, they just happen when the rest ends.
  // Expiring conditions and per-rest feature-use refreshes belong here when those are modelled;
  // both are deliberately unbuilt today, and `moveKey: null` is already the shape they need.
  if (current.wolfFormActive) {
    current = { ...current, wolfFormActive: false };
    summary.push({
      moveKey: null,
      title: 'Wolf Form',
      detail: 'the rest ends your Wolf Form',
      noChange: false,
    });
  }

  const changes = toChanges(current);
  const before = toChanges(state);
  const companionChanges = toCompanionChanges(state.companions, current.companions);
  const unchanged =
    companionChanges.length === 0 &&
    (Object.keys(changes) as (keyof RestResourceChanges)[]).every(key => changes[key] === before[key]);

  return { restType, nextState: current, changes, previous: before, companionChanges, summary, unchanged };
}
