export type CreatedItemType = 'weapon' | 'armor' | 'loot';

export interface CreatedItemFeature {
  name: string;
  description?: string;
}

export interface CreatedItemSummary {
  id: number;
  itemType: CreatedItemType;
  name: string;
  tier?: number;
  description?: string;
  isConsumable?: boolean;
  trait?: string;
  range?: string;
  burden?: string;
  damageNotation?: string;
  baseScore?: number;
  baseMajorThreshold?: number;
  baseSevereThreshold?: number;
  features?: CreatedItemFeature[];
}
