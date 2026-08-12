import { buildRestrictedCardData, CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
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
  if (response.restricted) {
    return buildRestrictedCardData(response.id, 'environment', response.expansionName);
  }

  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'environment',
    subtitle: titleCase(response.environmentType),
    subtitleSecondary: `Tier ${response.tier}`,
    tags: [formatDifficulty(response)],
    // Difficulty changes slot with its own shape: a printed number is a stat, and the verbatim
    // rules callout the "Special" variant prints is prose, so it belongs in the named-facts grid
    // where a long value can wrap. No `entityDisplay.subtitle` -- the card's subtitle is already
    // the environment type.
    entityDisplay: {
      scalar: { label: 'Tier', value: String(response.tier) },
      stats: response.difficulty !== undefined
        ? [{ label: 'Difficulty', value: String(response.difficulty) }]
        : undefined,
      meta: response.difficulty === undefined && response.difficultySpecial
        ? [{ label: 'Difficulty', value: response.difficultySpecial }]
        : undefined,
    },
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      srd: response.srd,
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
