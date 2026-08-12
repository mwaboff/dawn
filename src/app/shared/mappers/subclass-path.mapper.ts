import { buildRestrictedCardData, CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { SubclassPathApiResponse } from '../models/subclass-path-api.model';

export function mapSubclassPathToCardData(response: SubclassPathApiResponse): CardData {
  if (response.restricted) {
    return buildRestrictedCardData(response.id, 'subclassPath', response.expansionName);
  }

  const tags: string[] = [];
  // Both facts are words rather than numbers, so the beta face names them instead of showing the
  // spellcasting trait and each domain as undifferentiated chips in one row.
  const meta: { label: string; value: string }[] = [];

  if (response.spellcastingTrait?.trait) {
    tags.push(`Spellcasting: ${response.spellcastingTrait.trait}`);
    meta.push({ label: 'Spellcasting', value: response.spellcastingTrait.trait });
  }

  if (response.associatedDomains?.length) {
    tags.push(...response.associatedDomains.map(d => d.name));
    meta.push({ label: 'Domains', value: response.associatedDomains.map(d => d.name).join(', ') });
  }

  return {
    id: response.id,
    name: response.name,
    description: response.spellcastingTrait?.description ?? '',
    cardType: 'subclassPath' as never,
    tags: tags.length > 0 ? tags : undefined,
    entityDisplay: meta.length > 0 ? { meta } : undefined,
    metadata: {
      associatedClassId: response.associatedClassId,
      associatedClass: response.associatedClass,
      associatedDomains: response.associatedDomains ?? [],
      spellcastingTrait: response.spellcastingTrait,
      expansion: response.expansion,
    },
  };
}
