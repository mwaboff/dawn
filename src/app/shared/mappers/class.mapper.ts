import { buildRestrictedCardData, CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
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
  if (response.restricted) {
    return buildRestrictedCardData(response.id, 'class', response.expansionName);
  }

  const tags: string[] = [];
  // The classic chips bake the label into the string because that row has nothing to separate a
  // label from its value; the beta ledger draws the label above the number, so it takes the pair.
  const stats: { label: string; value: string }[] = [];
  if (response.startingEvasion != null) {
    tags.push(`Evasion: ${response.startingEvasion}`);
    stats.push({ label: 'Evasion', value: String(response.startingEvasion) });
  }
  if (response.startingHitPoints != null) {
    tags.push(`Hit Points: ${response.startingHitPoints}`);
    stats.push({ label: 'Hit Points', value: String(response.startingHitPoints) });
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
    entityDisplay: stats.length > 0 ? { stats } : undefined,
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      srd: response.srd,
      startingEvasion: response.startingEvasion,
      startingHitPoints: response.startingHitPoints,
    },
  };
}
