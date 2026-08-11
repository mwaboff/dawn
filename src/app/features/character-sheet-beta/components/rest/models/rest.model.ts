export type RestType = 'short' | 'long';

export type RestMoveId =
  | 'tendToWounds'
  | 'clearStress'
  | 'repairArmor'
  | 'prepare'
  | 'tendToAllWounds'
  | 'clearAllStress'
  | 'repairAllArmor'
  | 'workOnAProject'
  | 'showTribute'
  | 'refocus';

/**
 * Who a targetable move is aimed at. An ally's sheet is not this sheet, so `'ally'` spends the
 * move and reports the roll but changes nothing here.
 */
export type RestMoveTarget = 'self' | 'ally';

/** A gate the sheet already computes. The catalogue never re-derives class membership itself. */
export type RestMoveRequirement = 'warlockResources' | 'martialStances';

export type RestMoveRoll =
  /** 1d4 + tier. */
  | { readonly kind: 'tierPool' }
  /** Instinct-many d6, take the highest. */
  | { readonly kind: 'focusRefresh' };

export interface RestMoveDefinition {
  readonly id: RestMoveId;
  readonly name: string;
  /** Rules text, shown under the name in the catalogue. */
  readonly text: string;
  readonly rests: readonly RestType[];
  /** True when "you can do this to an ally instead" applies. */
  readonly targetable: boolean;
  /** True for Prepare only: preparing with party members gives 2 Hope instead of 1. */
  readonly partyOption: boolean;
  readonly requires: RestMoveRequirement | null;
  readonly roll: RestMoveRoll | null;
}

/** One filled downtime slot. The same `moveId` may legitimately appear more than once. */
export interface RestSelection {
  /** Stable key for `@for` tracking and removal. Never reused within one modal session. */
  readonly key: string;
  readonly moveId: RestMoveId;
  readonly target: RestMoveTarget;
  readonly withParty: boolean;
}

/** Which gated moves this character may take. Mirrors the sheet's existing predicates. */
export interface RestMoveAccess {
  readonly warlockResources: boolean;
  readonly martialStances: boolean;
}

/**
 * Everything a rest can read, assembled once at submit time so `applyRestMoves` never touches a
 * signal, a service, or the DOM.
 *
 * Marked HP, Stress and Armor count DAMAGE -- clearing decreases them toward 0. Hope is the
 * opposite: it counts what you HAVE, and Prepare increases it.
 */
export interface RestCharacterState {
  readonly tier: number;
  readonly hitPointMarked: number;
  readonly stressMarked: number;
  readonly armorMarked: number;
  readonly hopeHeld: number;
  /** `hopeMax.modified` plus any companion-granted slots. */
  readonly hopeCap: number;
  readonly focusHeld: number;
  readonly focusMax: number;
  readonly favor: number;
  /** The character's Spellcast trait modifier; null when no subclass card names one. */
  readonly spellcastTrait: number | null;
  /** The trait's name, for the summary line. Null when no subclass names one. */
  readonly spellcastTraitName: string | null;
  readonly instinct: number;
  readonly wolfFormActive: boolean;
}

/** Absolute new values for every field a rest can move. Never deltas. */
export interface RestResourceChanges {
  readonly hitPointMarked: number;
  readonly stressMarked: number;
  readonly armorMarked: number;
  readonly hopeHeld: number;
  readonly focusHeld: number;
  readonly favor: number;
  readonly wolfFormActive: boolean;
}

export interface RestSummaryLine {
  /** The `RestSelection.key` this line came from; null for automatic bookkeeping like Wolf Form. */
  readonly moveKey: string | null;
  readonly title: string;
  /**
   * Plain-language sentence with no leading capital, so the template can render it after the
   * title: "rolled 3 + tier 2 = 5, cleared 4 of your 4 marked HP".
   */
  readonly detail: string;
  /** True when the move was spent but nothing on THIS sheet moved. Rendered muted. */
  readonly noChange: boolean;
}

export interface RestOutcome {
  readonly restType: RestType;
  readonly nextState: RestCharacterState;
  readonly changes: RestResourceChanges;
  readonly summary: readonly RestSummaryLine[];
  /** True when nothing moved. Submit skips the PUT entirely. */
  readonly unchanged: boolean;
}

/** What the host tells the modal about the save it asked for. */
export type RestApplyResult = { readonly status: 'saved' } | { readonly status: 'error' };

/** Every character gets two downtime moves per rest. */
export const BASE_REST_MOVES = 2;

/**
 * Ceiling on manually-added extra moves. Nothing in the rules caps this, but a stack of features
 * and items granting more than four extra moves is not a real character sheet, and an unbounded
 * stepper is a worse control than a bounded one.
 */
export const MAX_REST_MOVES = 6;
