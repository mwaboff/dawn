export interface AncestryCostTag {
  id: number;
  label: string;
  category: string;
}

export interface AncestryFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: AncestryCostTag[];
}

export interface AncestryCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'ANCESTRY';
  expansionId: number;
  isOfficial: boolean;
  featureIds: number[];
  features: AncestryFeatureResponse[];
  costTagIds: number[];
  costTags: AncestryCostTag[];
  createdAt: string;
  lastModifiedAt: string;
}
