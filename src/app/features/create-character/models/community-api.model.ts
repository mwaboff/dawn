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
