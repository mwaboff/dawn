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
  expansionId: number;
  costTagIds: number[];
  costTags?: FeatureCostTag[];
  modifierIds: number[];
  modifiers?: FeatureModifierResponse[];
  createdAt: string;
  lastModifiedAt: string;
}
