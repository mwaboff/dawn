/**
 * Adding a member here is only half the job: give it a matching `[data-card-type='<name>']` rule
 * in shared/styles/card-accents.css and a `--color-card-<name>` token in styles.css. A type with
 * no rule compiles fine and renders as a white card with no accent, which has shipped twice.
 */
export type CardType =
  | 'class'
  | 'subclass'
  | 'heritage'
  | 'community'
  | 'ancestry'
  | 'domain'
  | 'domainCard'
  | 'weapon'
  | 'armor'
  | 'loot'
  | 'companion'
  | 'subclassPath'
  | 'feature'
  | 'environment'
  | 'beastform'
  | 'transformationCard'
  | 'martialStance'
  | 'adversary';

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  class: 'Class',
  subclass: 'Subclass',
  heritage: 'Heritage',
  community: 'Community',
  ancestry: 'Ancestry',
  domain: 'Domain',
  domainCard: 'Domain Card',
  weapon: 'Weapon',
  armor: 'Armor',
  loot: 'Loot',
  companion: 'Companion',
  subclassPath: 'Subclass Path',
  feature: 'Feature',
  environment: 'Environment',
  beastform: 'Beastform',
  transformationCard: 'Transformation',
  martialStance: 'Martial Stance',
  adversary: 'Adversary',
};

export interface CardFeature {
  id?: number;
  name: string;
  description: string;
  subtitle?: string;
  tags?: string[];
}

/**
 * The beta `EntityCard` face's share of a `CardData`, kept structured instead of pre-joined.
 *
 * `CardData.tags` is a flat `string[]` because the classic card renders it as one undifferentiated
 * row of chips, so the response mappers pre-format everything into it: an armor's "Score: 4"
 * sits beside its "Tier 2" and its "Custom" mark with nothing to tell them apart. `EntityCard`
 * needs them apart -- the tier is a header badge, the score is a ledger stat, "Custom" is
 * provenance -- and that split cannot be recovered from the joined strings without parsing them
 * back, which is exactly the "two implementations of one rule" `cardDataToEntityCard`'s own doc
 * comment refuses. So the mapper that knew the difference records it here, once, at the point it
 * still has the typed response in hand.
 *
 * Purely additive: the classic `daggerheart-card` reads `subtitle`/`subtitleSecondary`/`tags` and
 * never looks at this field, so a mapper populating it changes nothing for a classic reader. Every
 * field is optional and `cardDataToEntityCard` falls back to its old tags-to-badges behaviour when
 * the whole object is absent, so a mapper that has not been given one still renders.
 */
export interface CardEntityDisplay {
  /** Overrides `CardData.subtitle` on the beta face: the card's subtype ("Valor · Spell"). */
  subtitle?: string;
  /** The power-level scalar, the first badge on every card that has one. Never both labels. */
  scalar?: { label: 'Tier' | 'Level'; value: string };
  /** Live state the reader can change, as bare badge labels. Rendered after `scalar`. */
  state?: string[];
  /** The numbers, for the body's stat ledger. `label` is omitted only when the value names itself. */
  stats?: { label?: string; value: string }[];
  /** Named facts that are words rather than numbers, for the body's two-column grid. */
  meta?: { label: string; value: string }[];
}

export interface CardData {
  id: number;
  name: string;
  description: string;
  cardType: CardType;
  subtitle?: string;
  subtitleSecondary?: string;
  tags?: string[];
  features?: CardFeature[];
  metadata?: Record<string, unknown>;
  /** Beta-only; see `CardEntityDisplay`. Classic rendering never reads it. */
  entityDisplay?: CardEntityDisplay;
  /**
   * True when the backend redacted this card because the viewer lacks access to its expansion
   * (SRD vs. paid-expansion content gating). When true, every field except `id`, `cardType`, and
   * `expansionName` may be absent -- mappers must check this before reading anything else off the
   * source response. Both `daggerheart-card` and the beta `EntityCard` (via
   * `cardDataToEntityCard`) render a locked placeholder instead of the normal face; see
   * `RESTRICTED_CARD_TITLE` / `restrictedCardMessage`.
   */
  restricted?: boolean;
  /** The paid book this card belongs to, present only alongside `restricted: true` and only when
   * the backend knows it -- degrade gracefully (`restrictedCardMessage`) when absent. */
  expansionName?: string;
}

/** The locked placeholder's title, shared by the classic and beta faces. */
export const RESTRICTED_CARD_TITLE = 'Content Not Available';

/**
 * The locked placeholder's body copy, shared by the classic and beta faces. `expansionName` is
 * optional on the wire (the backend does not always know it), so this degrades to a generic
 * "an expansion" rather than interpolating "undefined" into the sentence.
 */
export function restrictedCardMessage(expansionName?: string): string {
  const subject = expansionName ? `from ${expansionName}, which` : 'from an expansion that';
  return `This card is ${subject} you don't have access to. Contact an administrator if this is a mistake.`;
}

/**
 * Builds the redacted `CardData` a gated-DTO mapper returns in place of its normal mapping once
 * `response.restricted` is true. Centralised so every mapper produces an identically-shaped
 * placeholder (and so `name`/`description` -- required fields on `CardData` -- always hold real
 * text even for the rare caller that renders them without checking `restricted` first).
 */
export function buildRestrictedCardData(id: number, cardType: CardType, expansionName?: string): CardData {
  return {
    id,
    cardType,
    name: RESTRICTED_CARD_TITLE,
    description: restrictedCardMessage(expansionName),
    restricted: true,
    expansionName,
  };
}
