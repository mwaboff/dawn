import { EntityCardBadge } from '../components/entity-card/entity-card.model';

/**
 * The tag shown on catalogue cards for player-authored content.
 *
 * Deliberately a tag rather than a new `CardType`: a card type would need its own
 * `[data-card-type]` rule and `--color-card-*` token, and homebrew is a property of a weapon or
 * armor rather than a different kind of thing.
 */
export const CUSTOM_CONTENT_TAG = 'Custom';

/**
 * The same mark as a beta `EntityCard` badge. Both a chip and a glyph, because neither alone is
 * enough: the glyph is `aria-hidden` decoration (see `EntityCardBadge.glyph`) and the word is what a
 * screen reader and a colour-blind reader actually get.
 *
 * Here rather than in either mapper because both of them need it -- the reference browser reaches it
 * through `card-data-to-entity-card.mapper.ts` and the character sheet through
 * `features/character-sheet-beta/utils/entity-card.mapper.ts`, and `features/` may import from
 * `shared/` but never the reverse (dawn/CLAUDE.md). It sits beside `CUSTOM_CONTENT_TAG` because the
 * two are the same fact in the two card faces' vocabularies, and they must not drift apart.
 */
export const CUSTOM_ITEM_BADGE: EntityCardBadge = { label: 'Custom', glyph: '✦' };

/**
 * Whether a catalogue record was authored by a user rather than imported from a sourcebook.
 *
 * Keyed on `isOfficial` alone. A row can be unofficial with no author — an official import
 * later demoted — and that is still not canon, so it should still read as custom.
 */
export function isCustomContent(record: { isOfficial?: boolean }): boolean {
  return record.isOfficial === false;
}
