/**
 * `Feature.timing` is null on every row in the DB (a known, deferred data issue -- see
 * `adversary.mapper.spec.ts`). The printed timing survives as a name suffix instead, e.g.
 * `"Relentless (3) - Passive"`, `"Earth Eruption - Action"`, `"Team-Up - Reaction"`. A name with
 * no recognized suffix is returned unchanged, with no timing.
 *
 * Shared between `adversary.mapper.ts` and `environment.mapper.ts` -- both catalog entities print
 * their Features in the identical `Name - Timing` convention (Core ch. 4), so this is one parsing
 * rule, not two.
 */
const FEATURE_TIMING_SUFFIX = /^(.+?)\s*-\s*(Passive|Action|Reaction)$/i;

export function parseFeatureTiming(name: string): { name: string; timing?: string } {
  const match = FEATURE_TIMING_SUFFIX.exec(name);
  if (!match) return { name };

  const [, cleanName, timing] = match;
  return { name: cleanName.trim(), timing: timing.charAt(0).toUpperCase() + timing.slice(1).toLowerCase() };
}
