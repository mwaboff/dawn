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
  expansionId?: number;
  features?: CardFeature[];
  /** GM spends a Fear to add `modifier` to a roll -- printed on the card as e.g. "Thief +2". */
  experiences?: { description: string; modifier: number }[];
}
