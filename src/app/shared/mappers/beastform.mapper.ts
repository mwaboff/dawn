import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { BeastformFeatureResponse, BeastformResponse } from '../models/beastform-api.model';

function formatTitleCase(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function mapFeature(feature: BeastformFeatureResponse): CardFeature {
  return {
    id: feature.id,
    name: feature.name,
    description: feature.description ?? '',
  };
}

export function mapBeastformToCardData(response: BeastformResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);

  return {
    id: response.id,
    name: response.name,
    description: response.example ?? '',
    cardType: 'beastform',
    subtitle: formatTitleCase(response.attackTrait),
    subtitleSecondary: response.tier != null ? `Tier ${response.tier}` : response.damage.notation,
    tags: [
      response.tier != null ? `Tier ${response.tier}` : null,
      formatTitleCase(response.attackRange),
    ].filter((t): t is string => !!t),
    features: features.length > 0 ? features : undefined,
    metadata: {
      example: response.example,
      advantages: response.advantages,
      attackRange: response.attackRange,
      attackTrait: response.attackTrait,
      damage: response.damage,
      evasion: response.evasion,
      tier: response.tier,
      isOfficial: response.isOfficial,
    },
  };
}
