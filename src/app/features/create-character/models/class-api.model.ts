export interface ClassCostTag {
  label: string;
  value: number;
}

export interface ClassFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  costTags?: ClassCostTag[];
}

export interface ClassResponse {
  id: number;
  name: string;
  description: string;
  startingEvasion: number;
  startingHitPoints: number;
  hopeFeatures: ClassFeatureResponse[];
  classFeatures: ClassFeatureResponse[];
  expansionId?: number;
  isOfficial: boolean;
  isPublic: boolean;
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
