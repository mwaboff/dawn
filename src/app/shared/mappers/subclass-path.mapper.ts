import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';

export function mapSubclassPathToCardData(response: SubclassPathApiResponse): CardData {
  const tags: string[] = [];

  if (response.spellcastingTrait?.trait) {
    tags.push(`Spellcasting: ${response.spellcastingTrait.trait}`);
  }

  if (response.associatedDomains?.length) {
    tags.push(...response.associatedDomains.map(d => d.name));
  }

  return {
    id: response.id,
    name: response.name,
    description: response.spellcastingTrait?.description ?? '',
    cardType: 'subclassPath' as never,
    tags: tags.length > 0 ? tags : undefined,
    metadata: {
      associatedClassId: response.associatedClassId,
      associatedClass: response.associatedClass,
      associatedDomains: response.associatedDomains ?? [],
      spellcastingTrait: response.spellcastingTrait,
      expansion: response.expansion,
    },
  };
}
