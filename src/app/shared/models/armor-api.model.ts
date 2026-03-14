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
  expansionId: number;
  expansion?: { id: number; name: string; isPublished: boolean };
  tier: number;
  isOfficial: boolean;
  baseMajorThreshold: number;
  baseSevereThreshold: number;
  baseScore: number;
  featureIds?: number[];
  features?: ArmorFeatureResponse[];
  createdAt: string;
  lastModifiedAt: string;
}
