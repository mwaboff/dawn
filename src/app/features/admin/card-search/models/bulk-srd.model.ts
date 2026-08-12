import { SearchableEntityType } from '../../../../shared/models/search.model';

/** Body of `PATCH /api/admin/content/srd`. */
export interface BulkSrdUpdateRequest {
  type: SearchableEntityType;
  ids: number[];
  srd: boolean;
}

/** Result of one `PATCH /api/admin/content/srd` call. `unknownIds` are ids that don't resolve
 *  to a row of `type` -- the backend still applies the batch to whatever did resolve. */
export interface BulkSrdUpdateResponse {
  type: string;
  srd: boolean;
  updatedIds: number[];
  unknownIds: number[];
}

/** Outcome of one type-group's call within a bulk action that may span several types (e.g. a
 *  cross-type search selection mixing weapons and adversaries). `error` is set instead of
 *  `updatedIds`/`unknownIds` being trusted when the call itself failed (network, 403, 500). */
export interface BulkSrdGroupOutcome {
  type: SearchableEntityType;
  requestedIds: number[];
  updatedIds: number[];
  unknownIds: number[];
  error?: string;
}

/** Aggregated, UI-ready summary of a bulk action across every type-group it touched. */
export interface BulkSrdSummary {
  srd: boolean;
  requestedCount: number;
  updatedCount: number;
  unknownIds: number[];
  errors: { type: SearchableEntityType; message: string }[];
}
