import { LootApiResponse } from '../../../shared/models/loot-api.model';

export interface CreateCharacterSheetRequest {
  name: string;
  pronouns?: string;
  level: number;
  evasion: number;
  armorMax: number;
  armorMarked: number;
  majorDamageThreshold: number;
  severeDamageThreshold: number;
  agilityModifier: number;
  agilityMarked: boolean;
  strengthModifier: number;
  strengthMarked: boolean;
  finesseModifier: number;
  finesseMarked: boolean;
  instinctModifier: number;
  instinctMarked: boolean;
  presenceModifier: number;
  presenceMarked: boolean;
  knowledgeModifier: number;
  knowledgeMarked: boolean;
  hitPointMax: number;
  hitPointMarked: number;
  stressMax: number;
  stressMarked: number;
  hopeMax: number;
  hopeMarked: number;
  gold: number;
  communityCardIds?: number[];
  ancestryCardIds?: number[];
  subclassCardIds?: number[];
  domainCardIds?: number[];
  equippedDomainCardIds?: number[];
  vaultDomainCardIds?: number[];
  inventoryWeapons?: InventoryWeaponRequest[];
  inventoryArmors?: InventoryArmorRequest[];
  inventoryItems?: InventoryLootRequest[];
}

export interface UpdateCharacterSheetRequest {
  name?: string;
  pronouns?: string;
  level?: number;
  evasion?: number;
  armorMax?: number;
  armorMarked?: number;
  majorDamageThreshold?: number;
  severeDamageThreshold?: number;
  agilityModifier?: number;
  agilityMarked?: boolean;
  strengthModifier?: number;
  strengthMarked?: boolean;
  finesseModifier?: number;
  finesseMarked?: boolean;
  instinctModifier?: number;
  instinctMarked?: boolean;
  presenceModifier?: number;
  presenceMarked?: boolean;
  knowledgeModifier?: number;
  knowledgeMarked?: boolean;
  hitPointMax?: number;
  hitPointMarked?: number;
  stressMax?: number;
  stressMarked?: number;
  hopeMax?: number;
  hopeMarked?: number;
  gold?: number;
  communityCardIds?: number[];
  ancestryCardIds?: number[];
  subclassCardIds?: number[];
  domainCardIds?: number[];
  equippedDomainCardIds?: number[];
  vaultDomainCardIds?: number[];
  inventoryWeapons?: InventoryWeaponRequest[];
  inventoryArmors?: InventoryArmorRequest[];
  inventoryItems?: InventoryLootRequest[];
}

export interface CreateExperienceRequest {
  characterSheetId: number;
  description: string;
  modifier: number;
}

export interface ExperienceResponse {
  id: number;
  characterSheetId: number;
  description: string;
  modifier: number;
  createdById?: number;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface FeatureResponse {
  id?: number;
  name?: string;
  description: string;
  featureType?: string;
  modifiers?: ModifierResponse[];
  costTags?: CostTagResponse[];
}

export interface ModifierResponse {
  target: string;
  operation: string;
  value: number;
}

export interface CostTagResponse {
  label: string;
  category: string;
}

export interface InventoryWeaponRequest {
  weaponId: number;
  equipped?: boolean;
  slot?: 'PRIMARY' | 'SECONDARY';
}

export interface InventoryArmorRequest {
  armorId: number;
  equipped?: boolean;
}

export interface InventoryLootRequest {
  lootId: number;
}

export interface InventoryWeaponResponse {
  id: number;
  weaponId: number;
  equipped: boolean;
  slot?: 'PRIMARY' | 'SECONDARY';
  weapon?: WeaponResponse;
}

export interface InventoryArmorResponse {
  id: number;
  armorId: number;
  equipped: boolean;
  armor?: ArmorResponse;
}

export interface InventoryLootResponse {
  id: number;
  lootId: number;
  loot?: LootApiResponse;
}

export interface DamageRollResponse {
  diceCount: number;
  diceType: string;
  modifier: number;
  damageType: string;
  notation: string;
}

export interface WeaponResponse {
  id: number;
  name: string;
  tier?: number;
  isPrimary?: boolean;
  trait?: string;
  range?: string;
  burden?: string;
  damage?: DamageRollResponse;
  featureIds?: number[];
  features?: FeatureResponse[];
}

export interface ArmorResponse {
  id: number;
  name: string;
  tier?: number;
  baseMajorThreshold?: number;
  baseSevereThreshold?: number;
  baseScore?: number;
  featureIds?: number[];
  features?: FeatureResponse[];
}

export interface CommunityCardResponse {
  id: number;
  name: string;
  description?: string;
  featureIds?: number[];
  features?: FeatureResponse[];
}

export interface AncestryCardResponse {
  id: number;
  name: string;
  description?: string;
  featureIds?: number[];
  features?: FeatureResponse[];
}

export interface SubclassCardResponse {
  id: number;
  name: string;
  description?: string;
  associatedClassId?: number;
  associatedClassName?: string;
  subclassPathName?: string;
  domainNames?: string[];
  level?: string;
  featureIds?: number[];
  features?: FeatureResponse[];
}

export interface DomainCardResponse {
  id: number;
  name: string;
  description?: string;
  associatedDomainId?: number;
  associatedDomainName?: string;
  level?: number;
  recallCost?: number;
  type?: string;
  featureIds?: number[];
  features?: FeatureResponse[];
}

export interface CharacterSheetResponse {
  id: number;
  name: string;
  pronouns?: string;
  level: number;
  evasion: number;
  armorMax: number;
  armorMarked: number;
  majorDamageThreshold: number;
  severeDamageThreshold: number;
  agilityModifier: number;
  agilityMarked: boolean;
  strengthModifier: number;
  strengthMarked: boolean;
  finesseModifier: number;
  finesseMarked: boolean;
  instinctModifier: number;
  instinctMarked: boolean;
  presenceModifier: number;
  presenceMarked: boolean;
  knowledgeModifier: number;
  knowledgeMarked: boolean;
  hitPointMax: number;
  hitPointMarked: number;
  stressMax: number;
  stressMarked: number;
  hopeMax: number;
  hopeMarked: number;
  gold: number;
  ownerId: number;
  communityCardIds: number[];
  ancestryCardIds: number[];
  subclassCardIds: number[];
  domainCardIds: number[];
  proficiency: number;
  equippedDomainCardIds: number[];
  vaultDomainCardIds: number[];
  experienceIds: number[];
  createdAt: string;
  lastModifiedAt: string;
  experiences?: ExperienceResponse[];
  communityCards?: CommunityCardResponse[];
  ancestryCards?: AncestryCardResponse[];
  subclassCards?: SubclassCardResponse[];
  domainCards?: DomainCardResponse[];
  inventoryWeapons?: InventoryWeaponResponse[];
  inventoryArmors?: InventoryArmorResponse[];
  inventoryItems?: InventoryLootResponse[];
}
