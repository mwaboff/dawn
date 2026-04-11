export interface RawCardResponse {
  id: number;
  name: string;
  description?: string;
  expansionId: number;
  isOfficial?: boolean;
  backgroundImageUrl?: string;
  associatedDomainId?: number;
  associatedDomainIds?: number[];
  subclassPathId?: number;
  level?: number | string;
  recallCost?: number;
  type?: string;
  featureIds?: number[];
  features?: RawFeatureResponse[];
  costTagIds?: number[];
  [key: string]: unknown;
}

export interface RawFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  modifierIds: number[];
  costTags?: RawCostTag[];
  modifiers?: RawModifier[];
}

export interface RawCostTag {
  id: number;
  label: string;
  category: string;
}

export interface RawModifier {
  id: number;
  target: string;
  operation: string;
  value: number;
}

export interface FeatureUpdateRequest {
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTags?: { label: string; category: string }[];
  modifiers?: { target: string; operation: string; value: number }[];
}
