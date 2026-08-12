import { FeatureInput } from './feature-api.model';
import { ItemSort } from './item-sort.model';

export interface LootFeature {
  name: string;
  description?: string;
}

export interface LootApiResponse {
  id: number;
  name: string;
  description?: string;
  tier?: number;
  isConsumable?: boolean;
  costTags?: string[];
  features?: LootFeature[];
  /** Null or absent for custom loot, which came from no sourcebook. */
  expansionId?: number | null;
  isOfficial?: boolean;
  /** Visible to every user. Only moderators and above can set this. */
  isPublic?: boolean;
  /**
   * Author of custom loot. Null for official imports; a non-null value alongside
   * `isOfficial: false` is what marks loot as homebrew.
   */
  createdByUserId?: number | null;
  /** Campaigns this loot has been explicitly shared with. */
  campaignIds?: number[];
  originalLootId?: number | null;
  /** Whether this loot is SRD-licensed content, freely usable without owning the sourcebook
   * it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this loot because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` may then be
   * omitted. See `loot.mapper.ts`'s `mapLootToCardData`. */
  restricted?: boolean;
  /** The paid book this loot belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}

/**
 * Payload for `POST /api/dh/loot/custom`.
 *
 * Has no `isOfficial`, `expansionId`, or `originalLootId` — see the note on
 * `CreateCustomWeaponRequest`.
 */
export interface CreateCustomLootRequest {
  name: string;
  tier: number;
  /** Honoured only for moderators and above; silently coerced to false otherwise. */
  isPublic?: boolean;
  /** The caller must be involved in every campaign named here. */
  campaignIds?: number[];
  isConsumable: boolean;
  description?: string;
  features?: FeatureInput[];
}

/** Payload for `PUT /api/dh/loot/{id}`. Every field is optional; omitted means unchanged. */
export interface UpdateLootRequest extends Partial<CreateCustomLootRequest> {
  /** Removes the sourcebook; see the note on `UpdateWeaponRequest`. */
  clearExpansion?: boolean;
  /** Honoured only for moderators and above. */
  isOfficial?: boolean;
  expansionId?: number;
}

export interface LootFilters {
  /** Case-insensitive substring match on the name. */
  name?: string;
  /** Ordering; the API defaults to insertion order, which buries custom content. */
  sort?: ItemSort;
  tier?: number;
  isConsumable?: boolean;
  expansionId?: number;
  isOfficial?: boolean;
  /** Narrows to loot authored by one user -- how a profile lists its owner's homebrew. */
  createdByUserId?: number;
  page?: number;
  size?: number;
}
