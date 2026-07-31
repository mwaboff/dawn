import { CardData } from '../components/daggerheart-card/daggerheart-card.model';
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
  return {
    id: feature.id,
    name: feature.name,
    description: feature.description ?? '',
    cardType: 'feature',
    subtitle: FEATURE_TYPE_LABELS[feature.featureType] ?? feature.featureType,
    tags: feature.costTags?.length
      ? feature.costTags.map(tag => tag.label.toUpperCase())
      : undefined,
    metadata: { expansionId: feature.expansionId },
  };
}
