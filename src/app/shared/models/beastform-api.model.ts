export type BeastformTrait = 'AGILITY' | 'STRENGTH' | 'FINESSE' | 'INSTINCT' | 'PRESENCE' | 'KNOWLEDGE';
export type BeastformRange = 'MELEE' | 'VERY_CLOSE' | 'CLOSE' | 'FAR' | 'VERY_FAR';
export type BeastformDamageType = 'PHYSICAL' | 'MAGIC' | 'PHYSICAL_AND_MAGIC';
export type BeastformDiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20';

export interface BeastformDamageRollResponse {
  diceCount?: number;
  diceType: BeastformDiceType;
  modifier?: number;
  damageType: BeastformDamageType;
  notation?: string;
}

export interface BeastformFeatureResponse {
  id: number;
  name: string;
  description?: string;
}

/**
 * Response DTO for Beastform entities -- Druid creature-form stat blocks. Mirrors
 * `com.aboff.core.model.dto.dh.response.BeastformResponse`.
 */
export interface BeastformResponse {
  id: number;
  name: string;
  example?: string;
  advantages?: string;
  agilityModifier?: number;
  strengthModifier?: number;
  finesseModifier?: number;
  instinctModifier?: number;
  presenceModifier?: number;
  knowledgeModifier?: number;
  evasion?: number;
  tier?: number;
  attackRange: BeastformRange;
  attackTrait: BeastformTrait;
  damage: BeastformDamageRollResponse;
  expansionId: number;
  expansion?: { id: number; name: string; isPublished: boolean };
  isOfficial: boolean;
  isPublic: boolean;
  featureIds?: number[];
  features?: BeastformFeatureResponse[];
  originalBeastformId?: number;
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
}

/**
 * `BeastformController`'s GET only supports `expansionId`/`isOfficial`/`isPublic`
 * server-side -- no `tier` filter param, unlike Environment/Adversary/Weapon. Do not add
 * one here without confirming the backend accepts it first.
 */
export interface BeastformFilters {
  page?: number;
  size?: number;
  expansionId?: number;
  isOfficial?: boolean;
  isPublic?: boolean;
}
