import {
  AdvancementChoice,
  CompanionExperienceGrant,
  CompanionTrainingSelection,
  DomainCardTradeRequest,
  LevelUpRequest,
} from '../models/level-up-api.model';

export interface LevelUpWizardState {
  advancements: AdvancementChoice[];
  newExperienceDescription?: string;
  newDomainCardId: number;
  equipNewDomainCard: boolean;
  unequipDomainCardId?: number;
  trades: DomainCardTradeRequest[];
  bonusDomainCardIds: number[];
  companionTrainings: CompanionTrainingSelection[];
  companionExperiences: CompanionExperienceGrant[];
  /** The resolved id (newly created, or restored) for this level-up's Companion tab selection --
   * `undefined` when no Companion tab was shown or offered. See `LevelUpRequest.newCompanionId`. */
  newCompanionId?: number;
}

export function assembleLevelUpRequest(state: LevelUpWizardState): LevelUpRequest {
  const bonusEntries: AdvancementChoice[] = state.bonusDomainCardIds.map(id => ({
    type: 'FEATURE_DOMAIN_CARD',
    domainCardId: id,
  }));

  const request: LevelUpRequest = {
    advancements: [...state.advancements, ...bonusEntries],
    newDomainCardId: state.newDomainCardId,
  };

  if (state.newExperienceDescription) {
    request.newExperienceDescription = state.newExperienceDescription;
  }

  if (state.equipNewDomainCard) {
    request.equipNewDomainCard = true;
  }

  if (state.unequipDomainCardId != null) {
    request.unequipDomainCardId = state.unequipDomainCardId;
  }

  if (state.trades.length > 0) {
    request.trades = state.trades;
  }

  if (state.companionTrainings.length > 0) {
    request.companionTrainings = state.companionTrainings;
  }

  if (state.companionExperiences.length > 0) {
    request.companionExperiences = state.companionExperiences;
  }

  if (state.newCompanionId != null) {
    request.newCompanionId = state.newCompanionId;
  }

  return request;
}
