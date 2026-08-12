import {
  CharacterSheetResponse,
  UpdateCharacterSheetRequest,
} from '../../../../create-character/models/character-sheet-api.model';
import { CharacterSheetView } from '../../../../character-sheet/models/character-sheet-view.model';
import { tierForLevel } from '../../../../../shared/utils/tier.utils';
import { CompanionApiResponse } from '../../../../../shared/models/companion-api.model';
import { RestCharacterState, RestCompanionState, RestResourceChanges } from '../models/rest.model';

/**
 * The live values a rest reads. Marked resources come from the sheet's optimistic computeds rather
 * than the raw response, so a pip toggled in the last 800ms is respected.
 */
export interface RestStateSources {
  readonly view: CharacterSheetView | null;
  readonly raw: CharacterSheetResponse | null;
  readonly hitPointMarked: number;
  readonly stressMarked: number;
  readonly armorMarked: number;
  readonly hopeHeld: number;
  readonly hopeCap: number;
  readonly focusHeld: number;
  readonly focusMax: number;
  readonly favor: number;
  /** The sheet's active companions, straight off `CharacterSheet.companions`. */
  readonly companions: readonly CompanionApiResponse[];
}

/**
 * Companions as a rest sees them. `stressMax` is the response's derived value (base + Resilient),
 * never `baseStressMax`; `outOfScene` is deliberately dropped rather than carried, because a rest
 * clears Stress in stages and only a value derived from the live track stays true through that --
 * see `isCompanionDowned`.
 */
function toRestCompanions(companions: readonly CompanionApiResponse[]): readonly RestCompanionState[] {
  return companions.map(companion => ({
    id: companion.id,
    name: companion.name,
    stressMarked: companion.stressMarked,
    stressMax: companion.stressMax,
    hasCreatureComfort: companion.trainings.some(training => training.option === 'CREATURE_COMFORT'),
  }));
}

/** The trait name the view uses for Instinct. Must match `mapTraits` in the view mapper. */
const INSTINCT_TRAIT = 'Instinct';

function traitModifier(view: CharacterSheetView, name: string): number | null {
  const trait = view.traits.find(t => t.name.trim().toLowerCase() === name.trim().toLowerCase());
  return trait ? trait.modifier.modified : null;
}

/**
 * The Spellcast trait is named on the subclass card (`spellcastingTrait.trait`, an enum name such
 * as `PRESENCE`) while its value lives on the view's traits (`'Presence'`) -- hence the
 * case-insensitive match.
 *
 * A multiclass character can carry more than one spellcasting subclass; the first that names a
 * trait wins. That is correct for every real Warlock and is the honest simple rule; a character
 * with two spellcasting subclasses should check the Favor gain by hand.
 */
function spellcastTrait(
  raw: CharacterSheetResponse,
  view: CharacterSheetView,
): { readonly value: number | null; readonly name: string | null } {
  const named = (raw.subclassCards ?? []).map(card => card.spellcastingTrait?.trait).find(Boolean);
  if (!named) return { value: null, name: null };
  return { value: traitModifier(view, named), name: named };
}

/**
 * Null until both the view and the raw response have loaded, which is also what keeps the Rest
 * button from rendering against a half-loaded sheet.
 */
export function toRestCharacterState(sources: RestStateSources): RestCharacterState | null {
  const { view, raw } = sources;
  if (!view || !raw) return null;

  const spellcast = spellcastTrait(raw, view);
  return {
    tier: tierForLevel(view.level),
    hitPointMarked: sources.hitPointMarked,
    stressMarked: sources.stressMarked,
    armorMarked: sources.armorMarked,
    hopeHeld: sources.hopeHeld,
    hopeCap: sources.hopeCap,
    focusHeld: sources.focusHeld,
    focusMax: sources.focusMax,
    favor: sources.favor,
    spellcastTrait: spellcast.value,
    spellcastTraitName: spellcast.name,
    // Read from the raw column, matching `CharacterSheet.refreshFocus`. Whether trait modifiers
    // should count toward the Focus roll is a pre-existing open question; this must not answer it
    // differently in two places.
    instinct: raw.instinctModifier ?? traitModifier(view, INSTINCT_TRAIT) ?? 0,
    // Gated on the GM's grant, not just the flag: transformation state is a GM-granted resource
    // and the backend rejects a player-side write to it while the grant is off. A sheet left with
    // a stale `wolfFormActive` after a revoked grant is the GM's to clear, not a rest's.
    wolfFormActive: (raw.transformationEnabled ?? false) && (raw.wolfFormActive ?? false),
    companions: toRestCompanions(sources.companions),
  };
}

/** Maps each field a rest can move to the request field that carries it. */
const REST_REQUEST_FIELDS: readonly {
  readonly from: keyof RestResourceChanges;
  readonly to: keyof UpdateCharacterSheetRequest;
}[] = [
  { from: 'hitPointMarked', to: 'hitPointMarked' },
  { from: 'stressMarked', to: 'stressMarked' },
  { from: 'armorMarked', to: 'armorMarked' },
  { from: 'hopeHeld', to: 'hopeMarked' },
  { from: 'focusHeld', to: 'focusMarked' },
  { from: 'favor', to: 'favor' },
  { from: 'wolfFormActive', to: 'wolfFormActive' },
];

/**
 * The one partial body a rest sends: absolute values (the backend does not clamp) for the fields
 * this rest actually moved, and nothing else.
 *
 * Restating an untouched field is not free. Several of these are gated server-side on a resource
 * the character may not have -- `wolfFormActive` needs a GM-granted transformation -- and a gate
 * that fires rejects the whole body, losing the HP and Stress the rest did clear. Sending only
 * what moved keeps a rest independent of every resource it didn't touch.
 */
export function restUpdateRequest(
  changes: RestResourceChanges,
  previous: RestResourceChanges,
): UpdateCharacterSheetRequest {
  const request: UpdateCharacterSheetRequest = {};
  for (const { from, to } of REST_REQUEST_FIELDS) {
    if (changes[from] === previous[from]) continue;
    // Each pair above maps a field to the request field of the same type; the assignment is
    // sound but not provably so field-by-field, hence the one cast.
    (request as Record<string, unknown>)[to] = changes[from];
  }
  return request;
}

export function applyRestToRaw(
  raw: CharacterSheetResponse,
  changes: RestResourceChanges,
): CharacterSheetResponse {
  return {
    ...raw,
    hitPointMarked: changes.hitPointMarked,
    stressMarked: changes.stressMarked,
    armorMarked: changes.armorMarked,
    hopeMarked: changes.hopeHeld,
    focusMarked: changes.focusHeld,
    favor: changes.favor,
    wolfFormActive: changes.wolfFormActive,
  };
}

/** The view holds only the four core tracks; Focus, Favor and Wolf Form live on the raw response. */
export function applyRestToView(
  view: CharacterSheetView,
  changes: RestResourceChanges,
): CharacterSheetView {
  return {
    ...view,
    hitPointMarked: changes.hitPointMarked,
    stressMarked: changes.stressMarked,
    armorMarked: changes.armorMarked,
    hopeMarked: changes.hopeHeld,
  };
}
