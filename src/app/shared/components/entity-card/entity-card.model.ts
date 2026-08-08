import { CardType } from '../daggerheart-card/daggerheart-card.model';

/**
 * The three resting heights an EntityCard can be laid out at. `compact` is a single scannable row
 * (name, type, one fact); `normal` is the default everywhere and clips its body to a fixed height;
 * `expanded` lifts that cap and lets the body scroll internally so a tall card never pushes the
 * cards beside it out of alignment in a grid.
 */
export type EntityCardSize = 'compact' | 'normal' | 'expanded';

/** A short label/value pair. Rendered as a chip in the header, or a `Label: value` line in the body. */
export interface EntityCardBadge {
  label: string;
  value?: string;
  /**
   * Decorative mark shown before the label on a header chip, e.g. the homebrew star. Rendered
   * `aria-hidden` -- the label alone has to carry the meaning, so a glyph is never the only cue.
   * Ignored on `meta` rows, which are prose lines rather than chips.
   */
  glyph?: string;
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
 */
export interface EntityCardData {
  id: string | number;
  name: string;
  cardType: CardType;
  /** Overrides the type tab's text. Domain cards show their domain ("Valor") instead of "Domain Card". */
  eyebrow?: string;
  /** The italic line under the name -- a subclass's "Foundation"/"Specialization"/"Mastery". */
  subtitle?: string;
  /** The single fact carried into `compact` size, where there is no room for anything else. */
  headline?: string;
  description?: string;
  /** Chips in the card header: "Lvl 3", "Recall 2". Keep each to a couple of words. */
  badges?: EntityCardBadge[];
  /** `Label: value` lines above the description, for longer metadata like a subclass's domains. */
  meta?: EntityCardBadge[];
  features?: EntityCardFeature[];
}
