import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { CommunityCardResponse, CommunityFeatureResponse } from '../models/community-api.model';

function mapFeature(feature: CommunityFeatureResponse): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle: 'Community Feature',
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
  };
}

export function mapCommunityResponseToCardData(response: CommunityCardResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.description,
    cardType: 'community',
    features: features.length > 0 ? features : undefined,
    metadata: {
      features: response.features ?? [],
    },
  };
}
