import { CardData, CardFeature } from '../components/daggerheart-card/daggerheart-card.model';
import { BeastformFeatureResponse, BeastformResponse } from '../models/beastform-api.model';

/**
 * `attackTrait`, `attackRange`, `damage`, `evasion` and every trait modifier are nullable on
 * `Beastform` -- the "Evolved" meta-cards (Legendary Beast, Mythic Beast) print no stat line at
 * all, so they arrive with those keys absent. Returns null rather than throwing on `.split()`.
 */
function formatTitleCase(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
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
    subtitle: formatTitleCase(response.attackTrait) ?? undefined,
    subtitleSecondary: response.tier != null ? `Tier ${response.tier}` : response.damage?.notation,
    tags: [
      response.tier != null ? `Tier ${response.tier}` : null,
      formatTitleCase(response.attackRange),
    ].filter((t): t is string => !!t),
    features: features.length > 0 ? features : undefined,
    metadata: {
      expansionId: response.expansionId,
      example: response.example,
      advantages: response.advantages,
      attackRange: response.attackRange,
      attackTrait: response.attackTrait,
      damage: response.damage,
      evasion: response.evasion,
      tier: response.tier,
      agilityModifier: response.agilityModifier,
      strengthModifier: response.strengthModifier,
      finesseModifier: response.finesseModifier,
      instinctModifier: response.instinctModifier,
      presenceModifier: response.presenceModifier,
      knowledgeModifier: response.knowledgeModifier,
      isOfficial: response.isOfficial,
    },
  };
}
