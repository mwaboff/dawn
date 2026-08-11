import {
  CharacterSheetResponse,
  UpdateCharacterSheetRequest,
} from '../../../../create-character/models/character-sheet-api.model';
import { CharacterSheetView } from '../../../../character-sheet/models/character-sheet-view.model';
import { tierForLevel } from '../../../../../shared/utils/tier.utils';
import { RestCharacterState, RestResourceChanges } from '../models/rest.model';

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
    wolfFormActive: raw.wolfFormActive ?? false,
  };
}

/** The one partial body a rest sends. Absolute values only -- the backend does not clamp. */
export function restUpdateRequest(changes: RestResourceChanges): UpdateCharacterSheetRequest {
  return {
    hitPointMarked: changes.hitPointMarked,
    stressMarked: changes.stressMarked,
    armorMarked: changes.armorMarked,
    hopeMarked: changes.hopeHeld,
    focusMarked: changes.focusHeld,
    favor: changes.favor,
    wolfFormActive: changes.wolfFormActive,
  };
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
