import { buildRestrictedCardData, CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
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
  if (response.restricted) {
    return buildRestrictedCardData(response.id, 'armor', response.expansionName);
  }

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
    // The beta face reads the raw numbers rather than the tag strings above: the "Score: "/"+"
    // punctuation is there because the classic card draws one flat row of chips with nothing to
    // separate a label from its value, while `EntityCard` stacks the label over the value itself.
    // The blank subtitle is deliberate -- the classic "Armor" subtitle only repeats the type tab.
    entityDisplay: {
      subtitle: '',
      scalar: { label: 'Tier', value: String(response.tier) },
      stats: [
        { label: 'Score', value: String(response.baseScore) },
        { label: 'Major', value: String(response.baseMajorThreshold) },
        { label: 'Severe', value: String(response.baseSevereThreshold) },
      ],
    },
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      srd: response.srd,
      baseScore: response.baseScore,
      baseMajorThreshold: response.baseMajorThreshold,
      baseSevereThreshold: response.baseSevereThreshold,
      tier: response.tier,
      modifiers,
      createdByUserId: response.createdByUserId ?? null,
    },
  };
}
