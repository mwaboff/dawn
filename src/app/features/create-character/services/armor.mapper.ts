import { CardData, CardFeature } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { ArmorFeatureResponse, ArmorModifierResponse, ArmorResponse } from '../models/armor-api.model';

function mapFeature(feature: ArmorFeatureResponse): CardFeature {
  return {
    name: feature.name,
    description: feature.description,
    subtitle: 'Armor Feature',
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
  };
}

export function mapArmorResponseToCardData(response: ArmorResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  const modifiers: ArmorModifierResponse[] = (response.features ?? [])
    .flatMap(f => f.modifiers ?? []);

  return {
    id: response.id,
    name: response.name,
    description: '',
    cardType: 'armor',
    tags: [
      `Score: ${response.baseScore}`,
      `Major: ${response.baseMajorThreshold}+`,
      `Severe: ${response.baseSevereThreshold}+`,
    ],
    features: features.length > 0 ? features : undefined,
    metadata: {
      baseScore: response.baseScore,
      baseMajorThreshold: response.baseMajorThreshold,
      baseSevereThreshold: response.baseSevereThreshold,
      tier: response.tier,
      modifiers,
    },
  };
}
