import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';
import { CharacterSheetView } from '../models/character-sheet-view.model';

/** A resolved Spellcast trait: the trait's name as the sheet displays it, and its modified value. */
export interface SpellcastTrait {
  /** The trait name as the backend enum spells it (e.g. `PRESENCE`), or null if none. */
  readonly name: string | null;
  /** The trait's modified value, or null when unresolvable. */
  readonly value: number | null;
}

const NO_SPELLCAST_TRAIT: SpellcastTrait = { name: null, value: null };

function traitModifier(view: CharacterSheetView, name: string): number | null {
  const trait = view.traits.find(t => t.name.trim().toLowerCase() === name.trim().toLowerCase());
  return trait ? trait.modifier.modified : null;
}

/**
 * Resolves the character's Spellcast trait to a value.
 *
 * The trait is *named* on the subclass card (`spellcastingTrait.trait`, an enum name such as
 * `PRESENCE`) while its *value* lives on the view's traits (`'Presence'`) -- hence the
 * case-insensitive match. The value is the modified one, so trait bonuses count.
 *
 * A multiclass character can carry more than one spellcasting subclass; the first that names a
 * trait wins. That is correct for every real single-class character and is the honest simple rule;
 * a character with two spellcasting subclasses should check the result by hand.
 */
export function resolveSpellcastTrait(
  raw: CharacterSheetResponse,
  view: CharacterSheetView,
): SpellcastTrait {
  const named = (raw.subclassCards ?? []).map(card => card.spellcastingTrait?.trait).find(Boolean);
  if (!named) return NO_SPELLCAST_TRAIT;
  return { name: named, value: traitModifier(view, named) };
}
