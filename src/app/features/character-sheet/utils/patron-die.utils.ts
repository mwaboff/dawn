/**
 * Warlock's "Patron's Pact" die size: a plain `d6` that automatically becomes a `d8` at level 5.
 * There is no player choice involved (unlike the Brawler's Combo Die), so this is derived purely
 * from level rather than persisted -- persisting it would create a value that can silently drift
 * out of sync with level.
 */
export function patronDieForLevel(level: number): 'D6' | 'D8' {
  return level >= 5 ? 'D8' : 'D6';
}
