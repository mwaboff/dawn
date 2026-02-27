import { CardData, CardFeature } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AncestryCardResponse, AncestryFeatureResponse } from '../models/ancestry-api.model';

function mapFeature(feature: AncestryFeatureResponse): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle: 'Ancestry Feature',
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
  };
}

export function mapAncestryResponseToCardData(response: AncestryCardResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.description,
    cardType: 'ancestry',
    features: features.length > 0 ? features : undefined,
  };
}
