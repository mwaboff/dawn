import { buildRestrictedCardData, CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { DomainResponse } from '../models/domain-card-api.model';
import { DOMAIN_THEME_COLORS } from './domain-card.mapper';

export type { DomainResponse } from '../models/domain-card-api.model';

export function mapDomainToCardData(domain: DomainResponse): CardData {
  if (domain.restricted) {
    return buildRestrictedCardData(domain.id, 'domain', domain.expansionName);
  }

  const accentColor = DOMAIN_THEME_COLORS[domain.name] ?? undefined;

  return {
    id: domain.id,
    name: domain.name,
    description: domain.description ?? '',
    cardType: 'domain',
    metadata: {
      expansionId: domain.expansionId,
      srd: domain.srd,
      iconUrl: domain.iconUrl,
      accentColor,
    },
  };
}
