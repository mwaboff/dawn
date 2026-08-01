import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { TransformationCardResponse } from '../../../shared/models/transformation-card-api.model';
import { MartialStanceResponse } from '../../../shared/models/martial-stance-api.model';

/** Dice size for the Brawler's stored Combo Die, serialized uppercase by the backend's `DiceType` enum. */
export type ComboDieType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20';

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
  /** Hope & Fear resources -- see the matching fields on {@link CharacterSheetResponse}. */
  focusMarked?: number;
  focusMax?: number;
  favor?: number;
  /**
   * ID of the transformation card to attach. Ignored (left unchanged) if
   * {@link clearTransformationCard} is true.
   */
  transformationCardId?: number;
  /** Explicit flag to detach the character's transformation card. See backend javadoc for why a
   * boolean flag is needed instead of a plain null `transformationCardId`. */
  clearTransformationCard?: boolean;
  /** Vampire "Feed" token count, clamped to 0..6 by the service. */
  transformationTokens?: number;
  /** Whether the Werewolf transformation's "Wolf Form" is currently active. */
  wolfFormActive?: boolean;
  /** IDs of martial stances this character knows (null to leave unchanged, empty to clear all). */
  knownMartialStanceIds?: number[];
  /** ID of the martial stance to shift into. Ignored (left unchanged) if
   * {@link clearActiveMartialStance} is true. */
  activeMartialStanceId?: number;
  /** Explicit flag to drop the character's active stance back to none. */
  clearActiveMartialStance?: boolean;
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
  diceCount: number | null;
  diceType: string;
  modifier: number | null;
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

export interface ClassCardResponse {
  id: number;
  name: string;
  description?: string;
  hopeFeatures?: FeatureResponse[];
  classFeatures?: FeatureResponse[];
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
  notes?: string; // omitted when null on server; max 10,000 chars
  ownerId: number;
  ownerName?: string;
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
  /** @deprecated Only the first of `classIds`. Use `classIds` -- a character can be multiclassed. */
  classId?: number;
  /** @deprecated Only the first of `classNames`. Use `classNames`. */
  className?: string;
  /** @deprecated Only the first of `classes`. Use `classes`. */
  class?: ClassCardResponse;
  /**
   * Every class the character has, deduped across all subclass cards, ordered by class id
   * ascending. The server always sets it (as `[]` when the character has no subclass cards), but
   * it stays optional here so pre-existing fixtures and older responses still typecheck.
   */
  classIds?: number[];
  /** Names parallel to `classIds`, same order. */
  classNames?: string[];
  /**
   * Populated when `expand=class` is requested and the character has at least one class; each
   * entry carries `classFeatures` when a `features` (or `classFeatures`) expand is also present.
   */
  classes?: ClassCardResponse[];
  experiences?: ExperienceResponse[];
  communityCards?: CommunityCardResponse[];
  ancestryCards?: AncestryCardResponse[];
  classCards?: ClassCardResponse[];
  subclassCards?: SubclassCardResponse[];
  domainCards?: DomainCardResponse[];
  inventoryWeapons?: InventoryWeaponResponse[];
  inventoryArmors?: InventoryArmorResponse[];
  inventoryItems?: InventoryLootResponse[];

  /** Focus currently held (Martial Artist's "Stance Fighter" resource). Zero and harmless for
   * characters without the Martial Artist subclass. Always present on real backend responses (a
   * `NOT NULL DEFAULT 0` column); optional here only so pre-existing fixtures/mocks that predate
   * this field still typecheck. */
  focusMarked?: number;
  /** Maximum Focus this character can hold. See {@link focusMarked} on optionality. */
  focusMax?: number;
  /** Favor points currently held (Warlock resource). See {@link focusMarked} on optionality. */
  favor?: number;
  /** Current Combo Die size (Brawler resource), null when the character has no Combo Die. */
  comboDie?: ComboDieType;
  /**
   * Whether transformations are unlocked for this character. The sheet hides the Transformation
   * panel entirely -- owner included -- until a GM enables it from the Campaign page, so it is
   * deliberately absent from every update-request type: a player must not be able to self-grant.
   */
  transformationEnabled?: boolean;
  /** ID of the transformation card attached to this character (null if none). */
  transformationCardId?: number;
  /** Full transformation card object (included only when `expand=transformationCard`). */
  transformationCard?: TransformationCardResponse;
  /** Vampire "Feed" token count. Null when the character's transformation does not use a token pool. */
  transformationTokens?: number;
  /** Whether the Werewolf transformation's "Wolf Form" is currently active. */
  wolfFormActive?: boolean;
  /** IDs of martial stances this character knows (always included). */
  knownMartialStanceIds?: number[];
  /** Full martial stance objects (included only when `expand=knownMartialStances`). */
  knownMartialStances?: MartialStanceResponse[];
  /** ID of the martial stance the character is currently shifted into (null if none). */
  activeMartialStanceId?: number;
  /** Full active martial stance object (included only when `expand=activeMartialStance`). */
  activeMartialStance?: MartialStanceResponse;
}

export interface UpdateCharacterSheetNotesRequest {
  notes: string;
}
