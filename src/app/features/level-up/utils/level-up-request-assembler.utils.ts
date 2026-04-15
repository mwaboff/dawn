import { AdvancementChoice, DomainCardTradeRequest, LevelUpRequest } from '../models/level-up-api.model';

export interface LevelUpWizardState {
  advancements: AdvancementChoice[];
  newExperienceDescription?: string;
  newDomainCardId: number;
  equipNewDomainCard: boolean;
  unequipDomainCardId?: number;
  trades: DomainCardTradeRequest[];
  bonusDomainCardIds: number[];
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

  return request;
}
