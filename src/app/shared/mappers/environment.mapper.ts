import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { EnvironmentFeatureResponse, EnvironmentResponse, EnvironmentType } from '../models/environment-api.model';

function formatEnvironmentType(type: EnvironmentType): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

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
  return {
    id: feature.id,
    name: feature.name,
    description: feature.description ?? '',
  };
}

export function mapEnvironmentToCardData(response: EnvironmentResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'environment',
    subtitle: formatEnvironmentType(response.environmentType),
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
