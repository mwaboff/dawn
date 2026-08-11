/**
 * Tier of play for a character level: tier 1 is level 1, tier 2 is levels 2-4, tier 3 is levels
 * 5-7, tier 4 is levels 8-10.
 *
 * Always derived from the FULL character level, never a per-class level -- the rulebook's example
 * is a level 7 wizard multiclassing into druid, who gets the tier 3 Beastform options. Downtime
 * moves that clear "1d4 + your tier" read the same value.
 *
 * Levels at or below 1 return tier 1, so a malformed or zero level degrades to the lowest tier
 * rather than producing a nonsense bonus.
 */
export function tierForLevel(level: number): number {
  if (level <= 1) return 1;
  if (level <= 4) return 2;
  if (level <= 7) return 3;
  return 4;
}
