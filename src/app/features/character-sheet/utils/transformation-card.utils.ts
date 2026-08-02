/**
 * Whether a transformation shows the Vampire "Feed" token pool. Card-name-driven because the
 * mechanic (a token pool, not a boolean toggle) belongs to exactly one of the six printed
 * transformations, and is not represented anywhere else on the card response.
 */
export function isVampireTransformation(name: string | undefined): boolean {
  return name?.trim().toLowerCase() === 'vampire';
}

/**
 * Whether a transformation shows the Werewolf "Wolf Form" toggle. Card-name-driven for the same
 * reason as {@link isVampireTransformation} -- Wolf Form is meaningless for the other five cards.
 */
export function isWerewolfTransformation(name: string | undefined): boolean {
  return name?.trim().toLowerCase() === 'werewolf';
}
