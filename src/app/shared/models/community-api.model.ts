import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

export interface CommunityCostTag {
  id: number;
  label: string;
  category: string;
}

export interface CommunityFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: CommunityCostTag[];
  modifiers?: ModifierResponse[];
}

export interface CommunityCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'COMMUNITY';
  expansionId: number;
  isOfficial: boolean;
  featureIds: number[];
  features: CommunityFeatureResponse[];
  costTagIds: number[];
  costTags: CommunityCostTag[];
  createdAt: string;
  lastModifiedAt: string;
}
