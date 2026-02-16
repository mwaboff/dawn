import { CardData, CardFeature } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { ClassFeatureResponse, ClassResponse } from '../models/class-api.model';

function mapFeature(feature: ClassFeatureResponse, subtitle: string): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle,
    tags: feature.costTags?.map(tag => tag.label.toUpperCase()),
  };
}

export function mapClassResponseToCardData(response: ClassResponse): CardData {
  const tags: string[] = [];
  if (response.startingEvasion != null) {
    tags.push(`Evasion: ${response.startingEvasion}`);
  }
  if (response.startingHitPoints != null) {
    tags.push(`Hit Points: ${response.startingHitPoints}`);
  }

  const features: CardFeature[] = [
    ...(response.hopeFeatures ?? []).map(f => mapFeature(f, 'Hope Feature')),
    ...(response.classFeatures ?? []).map(f => mapFeature(f, 'Class Feature')),
  ];

  return {
    id: response.id,
    name: response.name,
    description: response.description,
    cardType: 'class',
    tags: tags.length > 0 ? tags : undefined,
    features: features.length > 0 ? features : undefined,
  };
}
