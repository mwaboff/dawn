import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { MartialStanceFeatureResponse, MartialStanceResponse } from '../models/martial-stance-api.model';

function mapFeature(feature: MartialStanceFeatureResponse): CardFeature {
  return {
    id: feature.id,
    name: feature.name,
    description: feature.description ?? '',
  };
}

/**
 * A printed stance is a name plus one effect sentence -- `description` carries that effect
 * text, and `features` stays empty for every official stance (see `MartialStanceResponse`).
 * `tier`/`isOfficial` are optional server-side even though every real stance sets them, so this
 * returns `null`/`undefined` rather than throwing on an absent value, matching
 * `beastform.mapper.ts`'s defensive style.
 */
export function mapMartialStanceToCardData(response: MartialStanceResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'martialStance',
    subtitleSecondary: response.tier != null ? `Tier ${response.tier}` : undefined,
    tags: [response.tier != null ? `Tier ${response.tier}` : null].filter((t): t is string => !!t),
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      tier: response.tier,
      isOfficial: response.isOfficial,
      originalMartialStanceId: response.originalMartialStanceId,
    },
  };
}
