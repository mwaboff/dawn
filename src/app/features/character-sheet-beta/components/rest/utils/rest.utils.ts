import { DiceRollFn, rollFocusRefresh } from '../../../../character-sheet/utils/focus-refresh.utils';
import {
  RestCharacterState,
  RestMoveId,
  RestOutcome,
  RestResourceChanges,
  RestSelection,
  RestSummaryLine,
  RestType,
} from '../models/rest.model';

/** Injected so `applyRestMoves` stays pure and specs can script the dice. */
export type RestDiceRoller = DiceRollFn;

interface ResolvedMove {
  readonly state: RestCharacterState;
  readonly title: string;
  readonly detail: string;
  readonly noChange: boolean;
}

/**
 * Clears up to `amount` from a damage track. Never clears more than is marked and never goes below
 * zero -- the backend deliberately does not enforce `marked <= max`, so this is the only guard.
 */
function clearMarked(marked: number, amount: number): { readonly next: number; readonly cleared: number } {
  const cleared = Math.max(0, Math.min(marked, Math.trunc(amount)));
  return { next: marked - cleared, cleared };
}

/** Gains up to `amount`, never past the cap. A value already over the cap is left alone. */
function gainCapped(
  held: number,
  amount: number,
  cap: number,
): { readonly next: number; readonly gained: number } {
  const next = Math.min(Math.max(cap, held), held + Math.max(0, Math.trunc(amount)));
  return { next, gained: next - held };
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

  clearStress: (state, _selection, roll) => {
    const { amount, prefix } = tierPool(state, roll);
    const { next, cleared } = clearMarked(state.stressMarked, amount);
    return {
      state: { ...state, stressMarked: next },
      title: 'Clear Stress',
      noChange: cleared === 0,
      detail: clearedDetail(prefix, cleared, state.stressMarked, 'Stress'),
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

  clearAllStress: state => {
    const cleared = state.stressMarked;
    return {
      state: { ...state, stressMarked: 0 },
      title: 'Clear All Stress',
      noChange: cleared === 0,
      detail: clearedAllDetail(cleared, 'Stress'),
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
 */
export function applyRestMoves(
  restType: RestType,
  state: RestCharacterState,
  selections: readonly RestSelection[],
  roll: RestDiceRoller,
): RestOutcome {
  const summary: RestSummaryLine[] = [];
  let current = state;

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
  const unchanged = (Object.keys(changes) as (keyof RestResourceChanges)[]).every(
    key => changes[key] === before[key],
  );

  return { restType, nextState: current, changes, summary, unchanged };
}
