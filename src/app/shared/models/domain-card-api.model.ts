export type DomainCardType = 'SPELL' | 'GRIMOIRE' | 'ABILITY' | 'TRANSFORMATION' | 'WILD';

export interface DomainCardCostTag {
  id: number;
  label: string;
  category: string;
}

export interface DomainCardModifierResponse {
  id: number;
  target: string;
  operation: string;
  value: number;
}

export interface DomainCardFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: DomainCardCostTag[];
  modifierIds: number[];
  modifiers: DomainCardModifierResponse[];
}

export interface DomainCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'DOMAIN';
  expansionId: number;
  isOfficial: boolean;
  featureIds: number[];
  features: DomainCardFeatureResponse[];
  costTagIds: number[];
  costTags: DomainCardCostTag[];
  associatedDomainId: number;
  associatedDomain?: {
    id: number;
    name: string;
    description: string;
    expansionId: number;
  };
  level: number;
  recallCost: number;
  type: DomainCardType;
  createdAt: string;
  lastModifiedAt: string;
}

export interface DomainResponse {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  expansionId?: number;
  expansion?: {
    id: number;
    name: string;
    isPublished: boolean;
  };
}
