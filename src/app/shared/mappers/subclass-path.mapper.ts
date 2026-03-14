import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';

export function mapSubclassPathToCardData(response: SubclassPathApiResponse): CardData {
  const tags: string[] = [];

  if (response.spellcastingTrait) {
    tags.push(`Spellcasting: ${response.spellcastingTrait}`);
  }

  if (response.associatedDomains?.length) {
    tags.push(...response.associatedDomains.map(d => d.name));
  }

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'subclassPath' as never,
    tags: tags.length > 0 ? tags : undefined,
    metadata: {
      associatedDomains: response.associatedDomains ?? [],
      spellcastingTrait: response.spellcastingTrait,
    },
  };
}
