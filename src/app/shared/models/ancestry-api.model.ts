import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

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
  modifiers?: ModifierResponse[];
}

export interface AncestryCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'ANCESTRY';
  expansionId: number;
  isOfficial: boolean;
  isMixed?: boolean;
  featureIds: number[];
  features: AncestryFeatureResponse[];
  costTagIds: number[];
  costTags: AncestryCostTag[];
  createdAt: string;
  lastModifiedAt: string;
}

export interface CreateMixedAncestryRequest {
  name: string;
  description: string;
  expansionId: number;
  featureIds: [number, number];
}
