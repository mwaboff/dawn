import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

export interface DomainResponse {
  id: number;
  name: string;
}

export function mapDomainToCardData(domain: DomainResponse): CardData {
  return {
    id: domain.id,
    name: domain.name,
    description: '',
    cardType: 'domain',
  };
}
