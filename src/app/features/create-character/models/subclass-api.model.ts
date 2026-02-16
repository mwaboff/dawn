export type SubclassLevel = 'FOUNDATION' | 'SPECIALIZATION' | 'MASTERY';

export interface SubclassCostTag {
  id: number;
  label: string;
  category: string;
}

export interface SubclassFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: SubclassCostTag[];
}

export interface SubclassCardResponse {
  id: number;
  name: string;
  description?: string;
  cardType: 'SUBCLASS';
  expansionId: number;
  expansionName?: string;
  isOfficial: boolean;
  featureIds: number[];
  features: SubclassFeatureResponse[];
  costTagIds: number[];
  costTags: SubclassCostTag[];
  subclassPathId: number;
  domainNames?: string[];
  level: SubclassLevel;
  createdAt: string;
  lastModifiedAt: string;
}
