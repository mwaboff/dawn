import { CardType } from '../daggerheart-card/daggerheart-card.model';

/**
 * The three resting heights an EntityCard can be laid out at. `compact` is a single scannable row
 * (name, type, one fact); `normal` is the default everywhere and clips its body to a fixed height;
 * `expanded` lifts that cap and lets the body scroll internally so a tall card never pushes the
 * cards beside it out of alignment in a grid.
 */
export type EntityCardSize = 'compact' | 'normal' | 'expanded';

/**
 * A short label/value pair. Rendered as a chip in the header (`badges`) or as a row of the body's
 * two-column metadata grid (`meta`). Both draw the label in the small uppercase display face and
 * the value in the body face beside it -- no colon, no italics; the typographic shift is what
 * separates them, so "TIER 3" and "EQUIPPED Primary" need no punctuation to parse.
 */
export interface EntityCardBadge {
  label: string;
  value?: string;
  /**
   * Decorative mark shown before the label on a header chip, e.g. the homebrew star. Rendered
   * `aria-hidden` -- the label alone has to carry the meaning, so a glyph is never the only cue.
   * Ignored on `meta` rows, which are grid rows rather than chips.
   */
  glyph?: string;
}

/**
 * One cell of the body's stat ledger: a tiny uppercase label stacked over its value. `label` is
 * optional for the rare stat that names itself -- a weapon's "2d8+1 phy" is already unambiguous --
 * but prefer supplying one, since a bare number in a row of numbers says nothing.
 */
export interface EntityCardStat {
  label?: string;
  value: string;
}

export interface EntityCardModifier {
  label: string;
  value: number;
}

export interface EntityCardFeature {
  /** Optional: some features are a bare paragraph with no rules name of their own. */
  name?: string;
  description: string;
  tags?: string[];
  modifiers?: EntityCardModifier[];
}

/**
 * Everything one card face renders. Callers map their own view models onto this rather than the
 * card growing a branch per source type -- the character sheet's class/subclass/ancestry/community/
 * domain cards, companions, beastforms, stances and transformations all arrive here as this shape.
 *
 * Which fact belongs in which slot is a fixed contract, not a per-mapper judgement call. It used to
 * be one: tier alone reached the reader through five different slots depending on card type (a
 * `Tier: 2` badge, a `Tier 2` badge, a meta row, the adversary's subtitle, and the catalogue's
 * `T2 · …` headline), and the tab said "what kind of card" on fifteen types but "what kind of
 * adversary/domain" on three. A reader could not learn one card and then read the next. The rules:
 *
 * - `eyebrow`/tab -- ALWAYS the kind of card. Never a subtype. Leave it unset and let
 *   `CARD_TYPE_LABELS` answer unless the kind genuinely isn't in `CardType` (a homebrew face).
 * - `subtitle` -- the one qualifying noun WITHIN that kind: "Bruiser", "Valor · Spell",
 *   "Foundation", "Consumable", "Exploration". This is where a subtype goes now that the tab
 *   cannot carry it.
 * - `badges` -- the power-level scalar and live state, nothing else. At most three chips, or the
 *   header stops being scannable.
 * - `stats` -- the numbers, as the body's ledger.
 * - `meta` -- named facts that are words rather than numbers.
 */
export interface EntityCardData {
  id: string | number;
  name: string;
  cardType: CardType;
  /**
   * Overrides the type tab's text. Reserved for a kind `CardType` cannot name; a subtype belongs in
   * `subtitle`, so that the tab answers "what am I looking at" identically on every card.
   */
  eyebrow?: string;
  /**
   * The line under the name: the card's classification within its kind -- an adversary's "Bruiser",
   * a domain card's "Valor · Spell", a subclass's "Foundation", a consumable's "Consumable".
   */
  subtitle?: string;
  /** The single fact carried into `compact` size, where there is no room for anything else. */
  headline?: string;
  description?: string;
  /**
   * Chips in the card header, in this order and nothing else:
   * 1. the power-level scalar -- `{ label: 'Tier' | 'Level', value: '3' }`, never both, always
   *    first, always this shape so it lands in the same place on every card;
   * 2. live state the reader can change -- Equipped, Active, Wolf Form, a Stress count;
   * 3. provenance -- the homebrew `Custom` chip, last.
   * Anything else is a stat or a meta row. Three chips is the ceiling.
   */
  badges?: EntityCardBadge[];
  /**
   * The card's numbers, drawn as a ledger of label-over-value cells above everything else -- an
   * adversary's Difficulty/HP/Stress/Evasion, a weapon's damage/trait/range/burden, an armor's
   * score and thresholds. Values are already formatted for display. Use `meta` instead when the
   * fact is a sentence rather than a number.
   */
  stats?: EntityCardStat[];
  /**
   * Named facts above the description, drawn as a two-column grid so a long value wraps under
   * itself rather than under its label -- an adversary's Motives & Tactics, a subclass's domains.
   */
  meta?: EntityCardBadge[];
  features?: EntityCardFeature[];
}
