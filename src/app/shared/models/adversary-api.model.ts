export interface AdversaryFeature {
  name: string;
  description?: string;
}

/** GM spends a Fear to add `modifier` to a roll against/by this adversary; `description` is the
 * printed experience name (e.g. "Thief"), not free text. */
export interface ExperienceResponse {
  id: number;
  description: string;
  modifier: number;
}

/**
 * Mirrors `AdversaryResponse.DamageRollResponse` (core). `diceCount`/`modifier` are
 * nullable on the backend for flat-die attacks with no dice count or no modifier
 * (e.g. Broadsword's `d8 phy`), not just optional.
 */
export interface AdversaryDamage {
  diceCount?: number | null;
  diceType?: string;
  modifier?: number | null;
  damageType: string;
  notation: string;
}

export interface AdversaryApiResponse {
  id: number;
  name: string;
  description?: string;
  tier: number;
  adversaryType: string;
  difficulty?: number;
  hitPointMax?: number;
  stressMax?: number;
  evasion?: number;
  majorThreshold?: number;
  severeThreshold?: number;
  attackModifier?: number;
  weaponName?: string;
  attackRange?: string;
  damage?: AdversaryDamage;
  motivesAndTactics?: string;
  experiences?: ExperienceResponse[];
  features?: AdversaryFeature[];
  expansionId?: number;
  isOfficial?: boolean;
}

export interface AdversaryFilters {
  /** A single tier, or several to browse at once (e.g. Tier 1 + Tier 2 together). */
  tier?: number | number[];
  adversaryType?: string;
  isOfficial?: boolean;
  expansionId?: number;
  page?: number;
  size?: number;
}
