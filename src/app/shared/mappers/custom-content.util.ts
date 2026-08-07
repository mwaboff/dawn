/**
 * The tag shown on catalogue cards for player-authored content.
 *
 * Deliberately a tag rather than a new `CardType`: a card type would need its own
 * `[data-card-type]` rule and `--color-card-*` token, and homebrew is a property of a weapon or
 * armor rather than a different kind of thing.
 */
export const CUSTOM_CONTENT_TAG = 'Custom';

/**
 * Whether a catalogue record was authored by a user rather than imported from a sourcebook.
 *
 * Keyed on `isOfficial` alone. A row can be unofficial with no author — an official import
 * later demoted — and that is still not canon, so it should still read as custom.
 */
export function isCustomContent(record: { isOfficial?: boolean }): boolean {
  return record.isOfficial === false;
}
