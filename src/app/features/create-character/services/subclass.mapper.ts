import { CardData, CardFeature } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { SubclassCardResponse, SubclassFeatureResponse } from '../models/subclass-api.model';

function mapFeature(feature: SubclassFeatureResponse): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle: 'Subclass Feature',
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
  };
}

export function mapSubclassResponseToCardData(response: SubclassCardResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);
  const subtitle = response.domainNames?.length
    ? response.domainNames.join(' · ')
    : undefined;

  const tags: string[] | undefined = response.spellcastingTrait
    ? [`Spellcasting: ${response.spellcastingTrait.trait}`]
    : undefined;

  const metadata: Record<string, unknown> = {
    subclassPathId: response.subclassPathId,
    level: response.level,
    domainNames: response.domainNames ?? [],
  };

  if (response.spellcastingTrait) {
    metadata['spellcastingTrait'] = response.spellcastingTrait;
  }

  return {
    id: response.id,
    name: response.name,
    description: '',
    cardType: 'subclass',
    subtitle,
    tags,
    features: features.length > 0 ? features : undefined,
    metadata,
  };
}
