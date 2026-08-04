import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';
import { CompanionApiResponse, CompanionTrainingOption, ViciousAxis } from '../../../shared/models/companion-api.model';

export type AdvancementType =
  | 'BOOST_TRAITS' | 'GAIN_HP' | 'GAIN_STRESS' | 'BOOST_EXPERIENCES'
  | 'GAIN_DOMAIN_CARD' | 'BOOST_EVASION' | 'UPGRADE_SUBCLASS'
  | 'BOOST_PROFICIENCY' | 'MULTICLASS'
  | 'FEATURE_DOMAIN_CARD' | 'UPGRADE_COMBO_DIE';

export type TraitEnum = 'AGILITY' | 'STRENGTH' | 'FINESSE' | 'INSTINCT' | 'PRESENCE' | 'KNOWLEDGE';

export interface AvailableAdvancement {
  type: AdvancementType;
  description: string;
  limitPerTier: number;
  usedInTier: number;
  remaining: number;
  mutuallyExclusiveWith: AdvancementType | null;
}

export interface CompanionTrainingAvailableOption {
  option: CompanionTrainingOption;
  remaining: number;
}

/**
 * One eligible companion's Training availability for this level-up (core WP5). Eligibility is
 * active (not soft-deleted) + `advancesOnLevelUp` + existed before this level-up -- a companion
 * created by THIS level-up never appears here (see `level-up.ts`'s phase-0 companion creation).
 * `picksAvailable` is always the baseline (1) here, since this endpoint runs before advancements
 * are chosen -- see `companionTrainingBonusPicks` for the reactive client-side recompute.
 */
export interface CompanionTrainingEligibility {
  companionId: number;
  name: string;
  currentStats: CompanionApiResponse;
  availableOptions: CompanionTrainingAvailableOption[];
  picksAvailable: number;
}

export interface LevelUpOptionsResponse {
  currentLevel: number;
  nextLevel: number;
  currentTier: number;
  nextTier: number;
  tierTransition: boolean;
  availableAdvancements: AvailableAdvancement[];
  domainCardLevelCap: number | null;
  accessibleDomainIds: number[];
  equippedDomainCardCount: number;
  maxEquippedDomainCards: number;
  /** Optional for responses that predate core WP5; treat a missing value as `[]`. */
  companionTraining?: CompanionTrainingEligibility[];
  /** Soft-deleted companions (`origin: 'SUBCLASS_FEATURE'`) eligible to restore this level-up,
   * already scoped to this sheet. Optional for the same reason; treat a missing value as `[]`. */
  restorableCompanions?: CompanionApiResponse[];
}

export interface AdvancementChoice {
  type: AdvancementType;
  traits?: TraitEnum[];
  experienceIds?: number[];
  boostNewExperience?: boolean;
  domainCardId?: number;
  equipDomainCard?: boolean;
  subclassCardId?: number;
}

export interface DomainCardTradeRequest {
  tradeOutCardIds: number[];
  tradeInCardIds: number[];
  equipTradedInCardIds: number[];
}

export interface CompanionTrainingSelection {
  companionId: number;
  option: CompanionTrainingOption;
  /** Required iff `option === 'VICIOUS'`. */
  viciousAxis?: ViciousAxis;
  /** Required iff `option === 'INTELLIGENT'`; must belong to this companion. */
  targetExperienceId?: number;
}

export interface CompanionExperienceGrant {
  companionId: number;
  description: string;
}

export interface LevelUpRequest {
  advancements: AdvancementChoice[];
  newExperienceDescription?: string;
  newDomainCardId: number;
  equipNewDomainCard?: boolean;
  unequipDomainCardId?: number;
  trades?: DomainCardTradeRequest[];
  companionTrainings?: CompanionTrainingSelection[];
  /** Tier-transition-only; ignored by the backend otherwise, but `level-up.ts` never sends it on
   * a non-tier-transition level-up regardless (mirrors `newExperienceDescription`'s own gate). */
  companionExperiences?: CompanionExperienceGrant[];
  /** The companion this level-up newly associates -- either a brand-new companion (created via a
   * phase-0 `CompanionService.createCompanion` call before this request, since its id must exist
   * to be sent here) or an existing soft-deleted companion the player chose to restore instead
   * (no separate call: the backend restores it as part of applying this same request). */
  newCompanionId?: number;
}

export interface TradeDisplayPair {
  gaveUpName: string;
  receivedName: string;
}

export interface LevelUpResponse {
  characterSheet: CharacterSheetResponse;
  advancementLogId: number;
  appliedChanges: string[];
}
