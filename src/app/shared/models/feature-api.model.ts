import { FeatureType } from './feature-type.model';

export interface FeatureCostTag {
  id: number;
  label: string;
  category: string;
}

export interface FeatureModifierResponse {
  id: number;
  target: string;
  operation: string;
  value: number;
}

/**
 * Response shape for a standalone Feature entity fetched from `GET /api/dh/features`.
 * Distinct from the nested `*FeatureResponse` shapes embedded on weapons/armor/etc. --
 * this represents a feature browsed directly, including unattached (ownerless) rows.
 */
export interface FeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: FeatureType;
  /** Null for homebrew features, which came from no sourcebook. */
  expansionId: number | null;
  costTagIds: number[];
  costTags?: FeatureCostTag[];
  modifierIds: number[];
  modifiers?: FeatureModifierResponse[];
  createdAt: string;
  lastModifiedAt: string;
  /** Whether this feature is SRD-licensed content, freely usable without owning the sourcebook
   * it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this feature because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` may then be
   * omitted. See `feature.mapper.ts`'s `mapFeatureResponseToCardData`. */
  restricted?: boolean;
  /** The paid book this feature belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}

/**
 * Editing shapes used by `FeatureEditor` and `FeatureEditService`.
 *
 * Separate from the response types above because a feature being edited may not exist yet: a
 * draft cost tag or modifier has no id until it is saved. They live here rather than under
 * `features/admin/` because `shared/` must never import from `features/`, and both the admin
 * editors and the custom item builder need them.
 */

export interface RawCostTag {
  id?: number;
  label: string;
  category: string;
}

export interface RawModifier {
  id?: number;
  target: string;
  operation: string;
  value: number;
}

export interface RawFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: FeatureType;
  /** Null for homebrew features, which came from no sourcebook. */
  expansionId: number | null;
  costTagIds: number[];
  modifierIds: number[];
  costTags?: RawCostTag[];
  modifiers?: RawModifier[];
}

export interface FeatureUpdateRequest {
  name: string;
  description: string;
  featureType: FeatureType;
  /** Null for homebrew features, which came from no sourcebook. */
  expansionId: number | null;
  costTags?: { label: string; category: string }[];
  modifiers?: { target: string; operation: string; value: number }[];
}

/** Payload for creating a feature inline; identical in shape to an update. */
export type FeatureInput = FeatureUpdateRequest;
