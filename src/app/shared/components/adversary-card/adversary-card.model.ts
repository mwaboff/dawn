import { CardFeature } from '../daggerheart-card/daggerheart-card.model';

export interface AdversaryData {
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
  features?: CardFeature[];
}
