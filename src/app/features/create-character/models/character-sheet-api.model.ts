import { LootApiResponse } from '../../../shared/models/loot-api.model';
import { TransformationCardResponse } from '../../../shared/models/transformation-card-api.model';
import { MartialStanceResponse } from '../../../shared/models/martial-stance-api.model';
import { SpellcastingTraitResponse } from '../../../shared/models/subclass-api.model';

/** Dice size for the Brawler's stored Combo Die, serialized uppercase by the backend's `DiceType` enum. */
export type ComboDieType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20';

/**
 * One rolled Prayer Die (Seraph class feature). `value` is the d4 face, 1-4; `spent` marks a die
 * whose value has already been used. Spent dice stay on the sheet -- and stay readable -- until the
 * next session's roll clears them, because the rules clear Prayer Dice per session, not per rest.
 *
 * The backend stores the whole list as a compact string and only ever exposes it in this shape.
 */
export interface PrayerDie {
  value: number;
  spent: boolean;
}

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
  /** Replaces the character's whole Prayer Dice set. Omit to leave unchanged; send an empty array
   * to clear. */
  prayerDice?: PrayerDie[];
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

/** Exactly one of `characterSheetId` or `companionId` must be set -- the backend enforces this
 * with a single-owner CHECK constraint (`chk_experience_single_owner`). */
export interface CreateExperienceRequest {
  characterSheetId?: number;
  companionId?: number;
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
  /**
   * False for player-authored content. Present so the character sheet can badge a custom item
   * without going through the catalogue types in shared/models -- those are a separate,
   * richer shape and the two are still bridged by casts in character-sheet.ts.
   */
  isOfficial?: boolean;
  /** Author of custom content; null for official imports. */
  createdByUserId?: number | null;
  tier?: number;
  isPrimary?: boolean;
  trait?: string;
  range?: string;
  burden?: string;
  damage?: DamageRollResponse;
  featureIds?: number[];
  features?: FeatureResponse[];
  /** Present only when the backend redacted this embedded weapon because the viewer lacks access
   * to its expansion (SRD vs. paid-expansion content gating); every other field except `id` may
   * then be omitted. See `buildWeaponDisplay`. */
  restricted?: boolean;
  /** The paid book this weapon belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}

export interface ArmorResponse {
  id: number;
  name: string;
  /**
   * False for player-authored content. Present so the character sheet can badge a custom item
   * without going through the catalogue types in shared/models -- those are a separate,
   * richer shape and the two are still bridged by casts in character-sheet.ts.
   */
  isOfficial?: boolean;
  /** Author of custom content; null for official imports. */
  createdByUserId?: number | null;
  tier?: number;
  baseMajorThreshold?: number;
  baseSevereThreshold?: number;
  baseScore?: number;
  featureIds?: number[];
  features?: FeatureResponse[];
  /** See `WeaponResponse.restricted`. */
  restricted?: boolean;
  /** See `WeaponResponse.expansionName`. */
  expansionName?: string;
}

export interface CommunityCardResponse {
  id: number;
  name: string;
  description?: string;
  featureIds?: number[];
  features?: FeatureResponse[];
  /** See `WeaponResponse.restricted`. */
  restricted?: boolean;
  /** See `WeaponResponse.expansionName`. */
  expansionName?: string;
}

export interface AncestryCardResponse {
  id: number;
  name: string;
  description?: string;
  featureIds?: number[];
  features?: FeatureResponse[];
  /** See `WeaponResponse.restricted`. */
  restricted?: boolean;
  /** See `WeaponResponse.expansionName`. */
  expansionName?: string;
}

export interface ClassCardResponse {
  id: number;
  name: string;
  description?: string;
  hopeFeatures?: FeatureResponse[];
  classFeatures?: FeatureResponse[];
  /** See `WeaponResponse.restricted`. */
  restricted?: boolean;
  /** See `WeaponResponse.expansionName`. */
  expansionName?: string;
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
  /** The subclass path's Spellcast trait, as a trait enum name such as `PRESENCE`. The backend
   * always includes it (null when the path has no spellcasting). Shares its type with the
   * catalogue's `SubclassCardResponse` in `shared/models/subclass-api.model.ts`. */
  spellcastingTrait?: SpellcastingTraitResponse | null;
  /** See `WeaponResponse.restricted`. */
  restricted?: boolean;
  /** See `WeaponResponse.expansionName`. */
  expansionName?: string;
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
  /** See `WeaponResponse.restricted`. */
  restricted?: boolean;
  /** See `WeaponResponse.expansionName`. */
  expansionName?: string;
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
   * Every class the character has, deduped across all subclass cards, in acquisition order: the
   * original class first, then each multiclass in the order it was taken at level-up. (It used to
   * be class id ascending, which put a low-id multiclass ahead of the character's real first
   * class.) Nothing on the client can reconstruct that order, so consumers must render these in
   * the order they arrive rather than sorting. Best-effort, not guaranteed: the server derives it
   * from the advancement log and falls back to class id ascending when that log is missing or
   * unparseable -- legacy characters and undone level-ups both hit the fallback. The server always
   * sets it (as `[]` when the character has no subclass cards), but it stays optional here so
   * pre-existing fixtures and older responses still typecheck.
   */
  classIds?: number[];
  /** Names parallel to `classIds`, same order. */
  classNames?: string[];
  /**
   * Every class the character has, in the same acquisition order as {@link classIds}. Populated
   * when `expand=class` is requested and the character has at least one class; each entry carries
   * `classFeatures` when a `features` (or `classFeatures`) expand is also present. Each `id` is a
   * class id, so it is what a `SubclassCardResponse.associatedClassId` points at.
   */
  classes?: ClassCardResponse[];
  experiences?: ExperienceResponse[];
  communityCards?: CommunityCardResponse[];
  ancestryCards?: AncestryCardResponse[];
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
  /** Prayer Dice currently on the sheet (Seraph resource). Empty for characters without the
   * feature, and empty until the first roll of a session. */
  prayerDice?: PrayerDie[];
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
  /**
   * Whether a GM has enabled companion creation for this character independent of the Beastbound
   * Ranger's Companion feature (companions plan §3.4) -- lands with core WP3. Optional here so
   * responses that predate it still typecheck; treat a missing value as `false`. A companion this
   * flag helped create is never hidden again just because the flag is later turned back off.
   */
  companionsEnabled?: boolean;
  /**
   * Bonus Hope slots granted by companion Training (`LIGHT_IN_THE_DARK`), summed across every
   * `advancesOnLevelUp` companion -- lands with core WP3. Optional here for the same reason as
   * {@link companionsEnabled}; treat a missing value as `0`.
   */
  companionGrantedHopeSlots?: number;
}

export interface UpdateCharacterSheetNotesRequest {
  notes: string;
}
