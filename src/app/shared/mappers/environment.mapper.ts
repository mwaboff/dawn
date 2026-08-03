import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { EnvironmentFeatureResponse, EnvironmentResponse } from '../models/environment-api.model';
import { parseFeatureTiming } from '../utils/feature-timing.utils';
import { titleCase } from '../utils/text.utils';

/**
 * Formats the printed Difficulty for the card's tags. Environments mutually-exclusively
 * print either a numeric Difficulty or a verbatim rules callout (e.g. the core book's
 * `Difficulty: Special (see "Relative Strength")`) -- see `EnvironmentResponse` for why.
 */
function formatDifficulty(response: EnvironmentResponse): string {
  return response.difficulty !== undefined
    ? `Difficulty ${response.difficulty}`
    : `Difficulty: ${response.difficultySpecial}`;
}

function mapFeature(feature: EnvironmentFeatureResponse): CardFeature {
  const { name, timing } = parseFeatureTiming(feature.name);
  return {
    id: feature.id,
    name,
    description: feature.description ?? '',
    subtitle: timing,
  };
}

export function mapEnvironmentToCardData(response: EnvironmentResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'environment',
    subtitle: titleCase(response.environmentType),
    subtitleSecondary: `Tier ${response.tier}`,
    tags: [formatDifficulty(response)],
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      environmentType: response.environmentType,
      tier: response.tier,
      difficulty: response.difficulty,
      difficultySpecial: response.difficultySpecial,
      impulses: response.impulses,
      potentialAdversaries: response.potentialAdversaries,
      isOfficial: response.isOfficial,
    },
  };
}
