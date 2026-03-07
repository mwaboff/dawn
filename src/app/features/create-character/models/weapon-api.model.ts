export type WeaponTrait = 'AGILITY' | 'STRENGTH' | 'FINESSE' | 'INSTINCT' | 'PRESENCE' | 'KNOWLEDGE';
export type WeaponRange = 'MELEE' | 'VERY_CLOSE' | 'CLOSE' | 'FAR' | 'VERY_FAR';
export type WeaponBurden = 'ONE_HANDED' | 'TWO_HANDED';
export type DamageType = 'PHYSICAL' | 'MAGIC';
export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12';

export interface WeaponDamageResponse {
  diceCount: number | null;
  diceType: DiceType;
  modifier: number;
  damageType: DamageType;
  notation: string;
}

export interface WeaponCostTag {
  id: number;
  label: string;
  category: string;
}

export interface WeaponModifierResponse {
  id: number;
  target: string;
  operation: string;
  value: number;
}

export interface WeaponFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: WeaponCostTag[];
  modifierIds: number[];
  modifiers: WeaponModifierResponse[];
}

export interface WeaponResponse {
  id: number;
  name: string;
  expansionId: number;
  expansion?: { id: number; name: string; isPublished: boolean };
  tier: number;
  isOfficial: boolean;
  isPrimary: boolean;
  trait: WeaponTrait;
  range: WeaponRange;
  burden: WeaponBurden;
  damage: WeaponDamageResponse;
  featureIds?: number[];
  features?: WeaponFeatureResponse[];
  createdAt: string;
  lastModifiedAt: string;
}
