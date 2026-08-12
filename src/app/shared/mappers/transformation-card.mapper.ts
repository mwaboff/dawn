import { buildRestrictedCardData, CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import {
  TransformationCardFeatureResponse,
  TransformationCardQuestionResponse,
  TransformationCardResponse,
} from '../models/transformation-card-api.model';

function mapFeature(feature: TransformationCardFeatureResponse): CardFeature {
  return {
    id: feature.id,
    name: feature.name,
    description: feature.description ?? '',
  };
}

/**
 * Transformation Cards carry no stat block -- unlike Beastform/Environment there is no tier,
 * trait, or evasion to surface as a subtitle/tag, so this mapper stays deliberately sparse.
 * `features`/`questions` default to `[]` (never throw) when the caller didn't request
 * `?expand=features,questions`, mirroring `beastform.mapper.ts`'s defensive style.
 */
export function mapTransformationCardToCardData(response: TransformationCardResponse): CardData {
  if (response.restricted) {
    return buildRestrictedCardData(response.id, 'transformationCard', response.expansionName);
  }

  const features: CardFeature[] = (response.features ?? []).map(mapFeature);
  const questions: TransformationCardQuestionResponse[] = response.questions ?? [];

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'transformationCard',
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      srd: response.srd,
      questionIds: response.questionIds,
      questions,
    },
  };
}
