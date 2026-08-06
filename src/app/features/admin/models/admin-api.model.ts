import { RawFeatureResponse } from '../../../shared/models/feature-api.model';

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
