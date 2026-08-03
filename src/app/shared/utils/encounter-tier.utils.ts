import { EncounterAdversaryResponse, EncounterResponse } from '../models/encounter-api.model';

function effectiveAdversaryTier(entry: EncounterAdversaryResponse): number | undefined {
  return entry.tierOverride ?? entry.adversary?.tier;
}

/**
 * "Tier 2", "Tier 1–3" across a mixed-tier roster, or "Mixed Tier" when no tier can be resolved
 * at all. Prefers the server's own rolled-up `tier` (null only for a deliberately multi-tier
 * encounter) so the common case needs no `?expand=adversaryDetails` -- none of this app's
 * consumers (dashboard preview, profile preview, encounters list) request that expansion, since
 * `EncounterService.getOwnEncounters` doesn't offer one. The adversary-derived range below only
 * ever runs for the genuinely multi-tier case, and only resolves for retiered adversaries
 * (`tierOverride`, which isn't gated by expand) -- unretiered ones need the expansion and won't
 * have a resolvable tier here, so they fall out of the range rather than skewing it.
 *
 * Single source for every surface that displays an encounter's tier. Previously duplicated: a
 * simple `tier`-only version (used by the dashboard and profile previews) and this range-aware
 * one (used by the encounters list), with inconsistent fallback casing between them ("Mixed
 * Tier" vs "Mixed tiers"). The encounters list additionally special-cases a roster with zero
 * adversaries ("No adversaries yet") -- that's a presentational choice specific to that page (it
 * manages the adversary roster directly), not part of the tier-resolution rule itself, so it
 * stays as a thin wrapper there rather than folding into this function.
 */
export function tierRangeLabel(encounter: EncounterResponse): string {
  if (encounter.tier !== undefined && encounter.tier !== null) return `Tier ${encounter.tier}`;

  const tiers = encounter.adversaries.map(effectiveAdversaryTier).filter((t): t is number => t !== undefined);
  if (tiers.length === 0) return 'Mixed Tier';
  const min = Math.min(...tiers);
  const max = Math.max(...tiers);
  return min === max ? `Tier ${min}` : `Tier ${min}–${max}`;
}
