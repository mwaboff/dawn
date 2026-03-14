export interface LootFeature {
  name: string;
  description?: string;
}

export interface LootApiResponse {
  id: number;
  name: string;
  description?: string;
  tier?: number;
  isConsumable?: boolean;
  costTags?: string[];
  features?: LootFeature[];
  expansionId?: number;
  isOfficial?: boolean;
}

export interface LootFilters {
  tier?: number;
  isConsumable?: boolean;
  expansionId?: number;
  isOfficial?: boolean;
  page?: number;
}
