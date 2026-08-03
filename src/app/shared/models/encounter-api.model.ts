import { AdversaryApiResponse } from './adversary-api.model';
import { EnvironmentResponse } from './environment-api.model';

/**
 * Computed on read from the static retier table (`improvisedTierStats`) — never stored, so it
 * can never drift from the book. Only present on an `EncounterAdversaryResponse` whose
 * `tierOverride` is set.
 */
export interface RetieredStatisticsResponse {
  tier: number;
  attackModifier: number;
  difficulty: number;
  majorThreshold: number;
  severeThreshold: number;
  damageDiceRange: string;
}

/** One adversary instance within an encounter (mirrors one `encounter_adversaries` row). */
export interface EncounterAdversaryResponse {
  id: number;
  adversaryId: number;
  /** Full adversary object — only present with `?expand=adversaryDetails`. */
  adversary?: AdversaryApiResponse;
  label?: string;
  tierOverride?: number;
  retieredStatistics?: RetieredStatisticsResponse;
  displayOrder: number;
}

export interface EncounterResponse {
  id: number;
  name: string;
  description?: string;
  /** Overall tier, null for a deliberately multi-tier encounter. */
  tier?: number;
  isOfficial: boolean;
  isPublic: boolean;
  campaignId?: number;
  environmentId?: number;
  /** Only present with `?expand=environment`. */
  environment?: EnvironmentResponse;
  originalEncounterId?: number;
  creatorId: number;
  adversaries: EncounterAdversaryResponse[];
  /** Manually entered; never derived from a campaign roster. */
  partySize?: number;
  adjustmentEasier: boolean;
  adjustmentTwoPlusSolos: boolean;
  adjustmentBonusDamage: boolean;
  adjustmentLowerTier: boolean;
  adjustmentNoElites: boolean;
  adjustmentHarder: boolean;
  suggestedBattlePoints: number;
  spentBattlePoints: number;
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
}

/** One entry in a create/update request's `adversaries` list — one row per instance. */
export interface EncounterAdversaryEntry {
  adversaryId: number;
  label?: string;
  tierOverride?: number;
}

export interface EncounterAdjustmentFlags {
  adjustmentEasier?: boolean;
  adjustmentTwoPlusSolos?: boolean;
  adjustmentBonusDamage?: boolean;
  adjustmentLowerTier?: boolean;
  adjustmentNoElites?: boolean;
  adjustmentHarder?: boolean;
}

export interface CreateEncounterRequest extends EncounterAdjustmentFlags {
  name: string;
  description?: string;
  campaignId?: number;
  environmentId?: number;
  isPublic?: boolean;
  partySize?: number;
  adversaries?: EncounterAdversaryEntry[];
}

/** All fields optional — `PUT` supports partial updates. */
export type UpdateEncounterRequest = Partial<CreateEncounterRequest>;

export interface EncounterFilters {
  page?: number;
  size?: number;
  tier?: number;
  isOfficial?: boolean;
  name?: string;
  expand?: string;
}
