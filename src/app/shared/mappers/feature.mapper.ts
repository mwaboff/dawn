import { buildRestrictedCardData, CardData } from '../components/daggerheart-card/daggerheart-card.model';
import { FeatureResponse } from '../models/feature-api.model';
import { FEATURE_TYPE_LABELS } from '../models/feature-type.model';

/**
 * Maps a standalone Feature entity to card display data for the admin browse list.
 *
 * HF-01 made `description` part of the Feature find-or-create key, so multiple rows can
 * legitimately share the same `name` (e.g. four `Barrier` variants with different tier
 * text baked into the description). The subtitle (feature type) plus the full description
 * body give an admin enough to tell rows apart at a glance -- unlike weapon/armor cards,
 * there is no separate "tier" field on Feature to surface instead.
 */
export function mapFeatureResponseToCardData(feature: FeatureResponse): CardData {
  if (feature.restricted) {
    return buildRestrictedCardData(feature.id, 'feature', feature.expansionName);
  }

  const costTags = feature.costTags?.length
    ? feature.costTags.map(tag => tag.label.toUpperCase())
    : undefined;

  return {
    id: feature.id,
    name: feature.name,
    description: feature.description ?? '',
    cardType: 'feature',
    subtitle: FEATURE_TYPE_LABELS[feature.featureType] ?? feature.featureType,
    tags: costTags,
    // Cost tags need no label: "1 HOPE" already names its own unit, and a "Cost" label above each
    // of two of them would only repeat itself.
    entityDisplay: costTags ? { stats: costTags.map(tag => ({ value: tag })) } : undefined,
    metadata: { expansionId: feature.expansionId, srd: feature.srd },
  };
}
