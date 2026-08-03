/**
 * Battle Point math from the Daggerheart adversary-building rules
 * (`resources/rules/chapters/core-04-adversaries-and-environments.md`).
 *
 * Mirrors `core`'s `BattlePointCalculator` exactly. The backend stays authoritative on save —
 * this copy exists only to give the encounter builder instant feedback as adversaries are added.
 */

export type AdversaryTypeKey =
  | 'MINION'
  | 'SOCIAL'
  | 'SUPPORT'
  | 'HORDE'
  | 'RANGED'
  | 'SKULK'
  | 'STANDARD'
  | 'LEADER'
  | 'BRUISER'
  | 'SOLO';

/** Per-instance input to `spentPoints` — just enough to know what it costs. */
export interface BattlePointAdversaryInstance {
  adversaryType: AdversaryTypeKey;
}

/** The six discrete Battle Point adjustment toggles, mirroring the `encounters` table columns. */
export interface BattlePointAdjustments {
  easier?: boolean;
  twoPlusSolos?: boolean;
  bonusDamage?: boolean;
  lowerTier?: boolean;
  noElites?: boolean;
  harder?: boolean;
}

const TYPE_COSTS: Record<AdversaryTypeKey, number> = {
  MINION: 1,
  SOCIAL: 1,
  SUPPORT: 1,
  HORDE: 2,
  RANGED: 2,
  SKULK: 2,
  STANDARD: 2,
  LEADER: 3,
  BRUISER: 4,
  SOLO: 5,
};

const ADJUSTMENT_DELTAS: Record<keyof BattlePointAdjustments, number> = {
  easier: -1,
  twoPlusSolos: -2,
  bonusDamage: -2,
  lowerTier: 1,
  noElites: 1,
  harder: 2,
};

/** `(3 * partySize) + 2 + sum(adjustment deltas)`. */
export function suggestedBudget(partySize: number, adjustments: BattlePointAdjustments = {}): number {
  const adjustmentTotal = (Object.keys(ADJUSTMENT_DELTAS) as (keyof BattlePointAdjustments)[])
    .reduce((sum, key) => sum + (adjustments[key] ? ADJUSTMENT_DELTAS[key] : 0), 0);
  return 3 * partySize + 2 + adjustmentTotal;
}

/**
 * The printed per-type Battle Point cost, for callers that need one instance's own contribution
 * (e.g. the encounter builder's meter, breaking `spentPoints`'s total into a segment per
 * adversary). Minions are excluded from the signature -- they have no meaningful per-instance
 * cost, only a per-group one, which is what `spentPoints` already computes.
 */
export function pointCostForType(type: Exclude<AdversaryTypeKey, 'MINION'>): number {
  return TYPE_COSTS[type];
}

/**
 * `1 point per group of Minions equal to party size` + the per-type cost of every other instance.
 * A party size of 0 is treated as 1 for the minion grouping, matching the backend's `Math.max`
 * guard against a divide-by-zero.
 */
export function spentPoints(instances: BattlePointAdversaryInstance[], partySize: number): number {
  const minionCount = instances.filter(i => i.adversaryType === 'MINION').length;
  const minionGroups = Math.ceil(minionCount / Math.max(partySize, 1));
  const everythingElse = instances
    .filter(i => i.adversaryType !== 'MINION')
    .reduce((sum, i) => sum + TYPE_COSTS[i.adversaryType], 0);
  return minionGroups + everythingElse;
}
