import { FeatureInput } from './feature-api.model';

export interface ArmorCostTag {
  id: number;
  label: string;
  category: string;
}

export interface ArmorModifierResponse {
  id: number;
  target: string;
  operation: string;
  value: number;
}

export interface ArmorFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: ArmorCostTag[];
  modifierIds: number[];
  modifiers: ArmorModifierResponse[];
}

export interface ArmorResponse {
  id: number;
  name: string;
  /** Null for custom armor, which came from no sourcebook. */
  expansionId: number | null;
  expansion?: { id: number; name: string; isPublished: boolean };
  tier: number;
  isOfficial: boolean;
  /** Visible to every user. Only moderators and above can set this. */
  isPublic: boolean;
  /**
   * Author of custom armor. Null for official imports; a non-null value alongside
   * `isOfficial: false` is what marks armor as homebrew.
   */
  createdByUserId?: number | null;
  /** Campaigns this armor has been explicitly shared with. */
  campaignIds?: number[];
  baseMajorThreshold: number;
  baseSevereThreshold: number;
  baseScore: number;
  featureIds?: number[];
  features?: ArmorFeatureResponse[];
  originalArmorId?: number | null;
  createdAt: string;
  lastModifiedAt: string;
  /** Whether this armor is SRD-licensed content, freely usable without owning the sourcebook
   * it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this armor because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` may then be
   * omitted. See `armor.mapper.ts`'s `mapArmorResponseToCardData`. */
  restricted?: boolean;
  /** The paid book this armor belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}

/**
 * Payload for `POST /api/dh/armors/custom`.
 *
 * Has no `isOfficial`, `expansionId`, or `originalArmorId` — see the note on
 * `CreateCustomWeaponRequest`.
 */
export interface CreateCustomArmorRequest {
  name: string;
  tier: number;
  /** Honoured only for moderators and above; silently coerced to false otherwise. */
  isPublic?: boolean;
  /** The caller must be involved in every campaign named here. */
  campaignIds?: number[];
  baseMajorThreshold: number;
  baseSevereThreshold: number;
  baseScore: number;
  features?: FeatureInput[];
}

/** Payload for `PUT /api/dh/armors/{id}`. Every field is optional; omitted means unchanged. */
export interface UpdateArmorRequest extends Partial<CreateCustomArmorRequest> {
  /** Removes the sourcebook; see the note on `UpdateWeaponRequest`. */
  clearExpansion?: boolean;
  /** Honoured only for moderators and above. */
  isOfficial?: boolean;
  expansionId?: number;
}
