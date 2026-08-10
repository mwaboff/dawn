import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { ArmorFeatureResponse, ArmorModifierResponse, ArmorResponse } from '../models/armor-api.model';
import { CUSTOM_CONTENT_TAG, isCustomContent } from './custom-content.util';

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
    subtitle: 'Armor',
    subtitleSecondary: `Tier ${response.tier}`,
    tags: [
      `Score: ${response.baseScore}`,
      `Major: ${response.baseMajorThreshold}+`,
      `Severe: ${response.baseSevereThreshold}+`,
      ...(isCustomContent(response) ? [CUSTOM_CONTENT_TAG] : []),
    ],
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      baseScore: response.baseScore,
      baseMajorThreshold: response.baseMajorThreshold,
      baseSevereThreshold: response.baseSevereThreshold,
      tier: response.tier,
      modifiers,
      createdByUserId: response.createdByUserId ?? null,
    },
  };
}
