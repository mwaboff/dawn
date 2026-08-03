import { AdversaryApiResponse } from './adversary-api.model';
import { RetieredStatisticsResponse } from './encounter-api.model';

export type EncounterRunStatus = 'ACTIVE' | 'COMPLETED';

/**
 * One snapshotted, live-tracked instance within a run (mirrors one `encounter_run_adversaries`
 * row). Marked HP/Stress, defeated, and notes live here -- never on the catalog `Adversary`,
 * which two instances of the same adversary share.
 */
export interface EncounterRunAdversaryResponse {
  id: number;
  adversaryId: number;
  /**
   * Full stat block including `features`/`experiences` -- present on `GET .../{runId}` only,
   * omitted on the list endpoint.
   */
  adversary?: AdversaryApiResponse;
  label?: string;
  tierOverride?: number;
  /** Only present when `tierOverride` is set. Retiering does not change `hitPointMax`/`stressMax`. */
  retieredStatistics?: RetieredStatisticsResponse;
  hitPointsMarked: number;
  hitPointMax: number;
  stressMarked: number;
  stressMax: number;
  /** Adversary Tokens (Core rulebook) -- gates features like Slow, Relentless, Pool, Evolution. No maximum. */
  tokens: number;
  isDefeated: boolean;
  note?: string;
  displayOrder: number;
}

export interface EncounterRunResponse {
  id: number;
  encounterId: number;
  /** Null for a standalone run -- a campaign is never required to start or play one. */
  campaignId?: number;
  /** The source encounter's environment. */
  environmentId?: number;
  startedById: number;
  status: EncounterRunStatus;
  startedAt: string;
  /** Null while `ACTIVE`. */
  endedAt?: string;
  adversaries: EncounterRunAdversaryResponse[];
  createdAt: string;
  lastModifiedAt: string;
}

/** An absent/empty body starts a standalone, campaign-free run. */
export interface StartEncounterRunRequest {
  campaignId?: number;
}

export interface EncounterRunFilters {
  status?: EncounterRunStatus;
  /** Omitting this lists the caller's own runs; providing it lists that campaign's tagged runs. */
  campaignId?: number;
}

/**
 * Partial update -- a field left out is unchanged server-side. Every provided field is an
 * absolute value, never a delta.
 */
export interface UpdateEncounterRunAdversaryRequest {
  hitPointsMarked?: number;
  stressMarked?: number;
  /** Absolute value, never a delta. No maximum, unlike hitPointsMarked/stressMarked. */
  tokens?: number;
  isDefeated?: boolean;
  note?: string;
}
