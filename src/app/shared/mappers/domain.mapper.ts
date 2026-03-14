import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { DomainResponse } from '../models/domain-card-api.model';
import { DOMAIN_THEME_COLORS } from './domain-card.mapper';

export type { DomainResponse } from '../models/domain-card-api.model';

export function mapDomainToCardData(domain: DomainResponse): CardData {
  const accentColor = DOMAIN_THEME_COLORS[domain.name] ?? undefined;

  return {
    id: domain.id,
    name: domain.name,
    description: domain.description ?? '',
    cardType: 'domain',
    metadata: {
      iconUrl: domain.iconUrl,
      accentColor,
    },
  };
}
