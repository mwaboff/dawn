import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { CompanionApiResponse } from '../models/companion-api.model';

export function mapCompanionToCardData(response: CompanionApiResponse): CardData {
  const tags: string[] = [];

  if (response.companionType) {
    tags.push(response.companionType);
  }

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'companion' as never,
    tags: tags.length > 0 ? tags : undefined,
    metadata: {
      companionType: response.companionType,
      expansionId: response.expansionId,
      isOfficial: response.isOfficial,
    },
  };
}
