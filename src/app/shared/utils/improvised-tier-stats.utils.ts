/**
 * The book's "Improvised Statistics by Tier" lookup
 * (`resources/rules/chapters/core-04-adversaries-and-environments.md`, L935-940).
 *
 * Used to preview a retiered adversary instance's adjusted stats. Damage dice are printed as a
 * range in the book, not a single roll, so they're exposed as a display string rather than an
 * invented single notation.
 */

export interface ImprovisedTierStats {
  tier: 1 | 2 | 3 | 4;
  attackModifier: number;
  damageDiceDisplay: string;
  difficulty: number;
  majorThreshold: number;
  severeThreshold: number;
}

const TIER_STATS: Record<1 | 2 | 3 | 4, ImprovisedTierStats> = {
  1: { tier: 1, attackModifier: 1, damageDiceDisplay: '1d6+2 to 1d12+4', difficulty: 11, majorThreshold: 7, severeThreshold: 12 },
  2: { tier: 2, attackModifier: 2, damageDiceDisplay: '2d6+3 to 2d12+4', difficulty: 14, majorThreshold: 10, severeThreshold: 20 },
  3: { tier: 3, attackModifier: 3, damageDiceDisplay: '3d8+3 to 3d12+5', difficulty: 17, majorThreshold: 20, severeThreshold: 32 },
  4: { tier: 4, attackModifier: 4, damageDiceDisplay: '4d8+10 to 4d12+15', difficulty: 20, majorThreshold: 25, severeThreshold: 45 },
};

/** Looks up the improvised stats for a tier, or `undefined` for any tier outside 1-4. */
export function improvisedTierStats(tier: number): ImprovisedTierStats | undefined {
  return Number.isInteger(tier) ? TIER_STATS[tier as 1 | 2 | 3 | 4] : undefined;
}
