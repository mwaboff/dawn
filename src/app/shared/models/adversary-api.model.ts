export interface AdversaryFeature {
  name: string;
  description?: string;
}

export interface AdversaryApiResponse {
  id: number;
  name: string;
  description?: string;
  tier: number;
  adversaryType: string;
  difficulty?: number;
  hitPointMax?: number;
  stressMax?: number;
  evasion?: number;
  majorThreshold?: number;
  severeThreshold?: number;
  attackModifier?: number;
  weaponName?: string;
  attackRange?: string;
  damage?: { notation: string; damageType: string };
  motivesAndTactics?: string;
  experiences?: string[];
  features?: AdversaryFeature[];
  expansionId?: number;
  isOfficial?: boolean;
}

export interface AdversaryFilters {
  tier?: number;
  adversaryType?: string;
  isOfficial?: boolean;
  expansionId?: number;
  page?: number;
}
