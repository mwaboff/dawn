import { CharacterSheetResponse } from '../../create-character/models/character-sheet-api.model';

export type AdvancementType =
  | 'BOOST_TRAITS' | 'GAIN_HP' | 'GAIN_STRESS' | 'BOOST_EXPERIENCES'
  | 'GAIN_DOMAIN_CARD' | 'BOOST_EVASION' | 'UPGRADE_SUBCLASS'
  | 'BOOST_PROFICIENCY' | 'MULTICLASS';

export type TraitEnum = 'AGILITY' | 'STRENGTH' | 'FINESSE' | 'INSTINCT' | 'PRESENCE' | 'KNOWLEDGE';

export interface AvailableAdvancement {
  type: AdvancementType;
  description: string;
  limitPerTier: number;
  usedInTier: number;
  remaining: number;
  mutuallyExclusiveWith: AdvancementType | null;
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

export interface LevelUpRequest {
  advancements: AdvancementChoice[];
  newExperienceDescription?: string;
  newDomainCardId: number;
  equipNewDomainCard?: boolean;
  unequipDomainCardId?: number;
  trades?: DomainCardTradeRequest[];
}

export interface LevelUpResponse {
  characterSheet: CharacterSheetResponse;
  advancementLogId: number;
  appliedChanges: string[];
}
